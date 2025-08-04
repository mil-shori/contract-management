#!/bin/bash

# コミットとプッシュを行うスクリプト
# 使用方法: ./scripts/commit-push.sh "<commit-message>"
# 例: ./scripts/commit-push.sh "feat: ユーザー認証機能を追加"

set -e

# 引数チェック
if [ $# -ne 1 ]; then
    echo "使用方法: $0 \"<commit-message>\""
    echo "例: $0 \"feat: ユーザー認証機能を追加\""
    exit 1
fi

COMMIT_MESSAGE=$1
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# mainブランチでの直接コミットを防ぐ
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "❌ エラー: mainブランチへの直接コミットは禁止されています"
    echo "機能ブランチを作成してください: ./scripts/new-branch.sh <type> <name>"
    exit 1
fi

echo "現在のブランチ: $CURRENT_BRANCH"

# テストとリンターの実行
echo "🧪 テストを実行中..."
if [ -d "frontend" ]; then
    cd frontend
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm run test
    fi
    if [ -f "package.json" ] && grep -q "lint" package.json; then
        echo "🔧 リンターを実行中..."
        npm run lint
    fi
    cd ..
fi

if [ -d "functions" ]; then
    cd functions
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm run test
    fi
    if [ -f "package.json" ] && grep -q "lint" package.json; then
        echo "🔧 リンターを実行中..."
        npm run lint
    fi
    cd ..
fi

# 変更をステージング
echo "📝 変更をステージング中..."
git add .

# コミットメッセージの形式チェック
if [[ ! "$COMMIT_MESSAGE" =~ ^(feat|fix|refactor|docs|style|test|chore):.+ ]]; then
    echo "⚠️  警告: コミットメッセージは 'type: description' の形式が推奨されます"
    echo "例: feat: 新機能追加, fix: バグ修正, refactor: リファクタリング"
    echo ""
    read -p "このまま続行しますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "コミットをキャンセルしました"
        exit 1
    fi
fi

# コミット実行
echo "💾 コミット中..."
git commit -m "$COMMIT_MESSAGE"

# プッシュ実行
echo "🚀 プッシュ中..."
git push origin "$CURRENT_BRANCH"

echo "✅ コミットとプッシュが完了しました"
echo "📋 次のステップ:"
echo "1. GitHubでプルリクエストを作成"
echo "2. コードレビューを受ける"
echo "3. mainブランチにマージ"
echo "4. ./scripts/cleanup-branch.sh でブランチをクリーンアップ"