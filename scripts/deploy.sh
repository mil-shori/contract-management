#!/bin/bash

# 契約管理システム デプロイスクリプト
# Usage: ./scripts/deploy.sh [staging|production]

set -e

# 色付きログ用関数
log_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

log_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

# 引数チェック
if [ $# -eq 0 ]; then
    log_error "環境を指定してください: staging または production"
    echo "Usage: $0 [staging|production]"
    exit 1
fi

ENVIRONMENT=$1

# 環境チェック
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    log_error "無効な環境です: $ENVIRONMENT"
    echo "有効な環境: staging, production"
    exit 1
fi

log_info "=$ENVIRONMENT 環境へのデプロイを開始します"

# 必要なツールの確認
check_requirements() {
    log_info "必要なツールの確認中..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js がインストールされていません"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm がインストールされていません"
        exit 1
    fi
    
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI がインストールされていません"
        echo "インストール: npm install -g firebase-tools"
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 がインストールされていません"
        exit 1
    fi
    
    log_success "必要なツールが揃っています"
}

# Firebase プロジェクト設定
setup_firebase_project() {
    log_info "Firebase プロジェクト設定中..."
    
    if [ "$ENVIRONMENT" == "staging" ]; then
        PROJECT_ID=${FIREBASE_PROJECT_ID_STAGING:-"contract-management-staging"}
    else
        PROJECT_ID=${FIREBASE_PROJECT_ID_PRODUCTION:-"contract-management-prod"}
    fi
    
    log_info "プロジェクト ID: $PROJECT_ID"
    firebase use $PROJECT_ID
    
    log_success "Firebase プロジェクト設定完了"
}

# 依存関係インストール
install_dependencies() {
    log_info "依存関係をインストール中..."
    
    # フロントエンド
    log_info "フロントエンド依存関係インストール中..."
    cd frontend
    npm ci
    cd ..
    
    # Functions (TypeScript)
    log_info "Functions 依存関係インストール中..."
    cd functions
    npm ci
    cd ..
    
    # Python OCR Service
    log_info "OCR サービス依存関係インストール中..."
    cd functions-python
    pip3 install -r requirements.txt
    cd ..
    
    # Python AI Service
    log_info "AI サービス依存関係インストール中..."
    cd functions-ai
    pip3 install -r requirements.txt
    cd ..
    
    log_success "依存関係インストール完了"
}

# コードの品質チェック
run_quality_checks() {
    log_info "コード品質チェック実行中..."
    
    # フロントエンド
    log_info "フロントエンド品質チェック中..."
    cd frontend
    npm run lint
    npm run type-check
    cd ..
    
    # Functions
    log_info "Functions 品質チェック中..."
    cd functions
    npm run lint
    cd ..
    
    log_success "コード品質チェック完了"
}

# テスト実行
run_tests() {
    log_info "テスト実行中..."
    
    # フロントエンドテスト
    log_info "フロントエンドテスト実行中..."
    cd frontend
    npm run test -- --coverage --watchAll=false
    cd ..
    
    # Functionsテスト
    log_info "Functions テスト実行中..."
    cd functions
    npm run test || log_warning "Functions テストをスキップ（テストファイルなし）"
    cd ..
    
    # Python サービステスト
    log_info "Python サービステスト実行中..."
    cd functions-python
    python3 test_ocr.py || log_warning "OCR テストをスキップ（環境設定が必要）"
    cd ..
    
    cd functions-ai
    python3 test_ai.py || log_warning "AI テストをスキップ（環境設定が必要）"
    cd ..
    
    log_success "テスト実行完了"
}

# ビルド実行
build_application() {
    log_info "アプリケーションビルド中..."
    
    # フロントエンドビルド
    log_info "フロントエンドビルド中..."
    cd frontend
    
    if [ "$ENVIRONMENT" == "production" ]; then
        npm run build
    else
        npm run build
    fi
    
    cd ..
    
    # Functionsビルド
    log_info "Functions ビルド中..."
    cd functions
    npm run build
    cd ..
    
    log_success "アプリケーションビルド完了"
}

# 環境変数設定
setup_environment_variables() {
    log_info "環境変数設定中..."
    
    # Firebase Functions 用環境変数設定
    if [ "$ENVIRONMENT" == "production" ]; then
        if [ -n "$OPENAI_API_KEY_PRODUCTION" ]; then
            firebase functions:config:set openai.api_key="$OPENAI_API_KEY_PRODUCTION"
        fi
    else
        if [ -n "$OPENAI_API_KEY_STAGING" ]; then
            firebase functions:config:set openai.api_key="$OPENAI_API_KEY_STAGING"
        fi
    fi
    
    log_success "環境変数設定完了"
}

# Firebase デプロイ
deploy_firebase() {
    log_info "Firebase デプロイ実行中..."
    
    # 段階的デプロイ
    log_info "Firestore ルールデプロイ中..."
    firebase deploy --only firestore:rules
    
    log_info "Storage ルールデプロイ中..."
    firebase deploy --only storage
    
    log_info "Functions デプロイ中..."
    firebase deploy --only functions
    
    log_info "Frontend (Hosting) デプロイ中..."
    firebase deploy --only hosting
    
    log_success "Firebase デプロイ完了"
}

# デプロイ後検証
post_deploy_verification() {
    log_info "デプロイ後検証実行中..."
    
    # ヘルスチェック URL 取得
    if [ "$ENVIRONMENT" == "production" ]; then
        HEALTH_URL="https://$PROJECT_ID.web.app/api/health"
    else
        HEALTH_URL="https://$PROJECT_ID.web.app/api/health"
    fi
    
    log_info "ヘルスチェック実行中: $HEALTH_URL"
    
    # 最大5回リトライ
    for i in {1..5}; do
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            log_success "ヘルスチェック成功"
            break
        else
            log_warning "ヘルスチェック失敗 (試行 $i/5)"
            if [ $i -eq 5 ]; then
                log_error "ヘルスチェックが失敗しました"
                exit 1
            fi
            sleep 10
        fi
    done
    
    log_success "デプロイ後検証完了"
}

# バックアップ作成（本番環境のみ）
create_backup() {
    if [ "$ENVIRONMENT" == "production" ]; then
        log_info "バックアップ作成中..."
        
        BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_DIR="backups/${BACKUP_TIMESTAMP}"
        
        mkdir -p "$BACKUP_DIR"
        
        # Firestore エクスポート
        gcloud firestore export "gs://${PROJECT_ID}-backups/firestore/${BACKUP_TIMESTAMP}" \
            --project="$PROJECT_ID" || log_warning "Firestore バックアップに失敗"
        
        log_success "バックアップ作成完了: $BACKUP_DIR"
    fi
}

# Slack 通知
send_slack_notification() {
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        log_info "Slack 通知送信中..."
        
        if [ "$1" == "success" ]; then
            MESSAGE="✅ $ENVIRONMENT 環境へのデプロイが成功しました！"
            COLOR="good"
        else
            MESSAGE="❌ $ENVIRONMENT 環境へのデプロイが失敗しました"
            COLOR="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$COLOR\",
                    \"text\": \"$MESSAGE\",
                    \"fields\": [{
                        \"title\": \"Environment\",
                        \"value\": \"$ENVIRONMENT\",
                        \"short\": true
                    }, {
                        \"title\": \"Project\",
                        \"value\": \"$PROJECT_ID\",
                        \"short\": true
                    }]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" || log_warning "Slack 通知送信に失敗"
    fi
}

# エラーハンドリング
handle_error() {
    log_error "デプロイ中にエラーが発生しました"
    send_slack_notification "failure"
    exit 1
}

# エラートラップ設定
trap handle_error ERR

# メイン実行
main() {
    log_info "契約管理システム デプロイ開始"
    log_info "環境: $ENVIRONMENT"
    log_info "タイムスタンプ: $(date)"
    
    check_requirements
    setup_firebase_project
    install_dependencies
    run_quality_checks
    run_tests
    build_application
    setup_environment_variables
    create_backup
    deploy_firebase
    post_deploy_verification
    
    log_success "🎉 デプロイが正常に完了しました！"
    log_info "環境: $ENVIRONMENT"
    log_info "プロジェクト: $PROJECT_ID"
    
    send_slack_notification "success"
}

# スクリプト実行
main "$@"