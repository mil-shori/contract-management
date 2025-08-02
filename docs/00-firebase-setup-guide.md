# Firebase セットアップガイド

## 概要
契約管理システムで必要なFirebaseプロジェクトの初期設定手順

## 前提条件
- Google アカウント
- Node.js 18.x 以上
- Firebase CLI

## 1. Firebase CLI インストール

```bash
npm install -g firebase-tools
firebase login
```

## 2. Firebase プロジェクト作成

### Console での作成
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名: `contract-management-system`
4. Google Analytics: 有効化推奨
5. リージョン: `asia-northeast1` (東京)

### CLI での初期化
```bash
firebase init
# 以下を選択:
# - Firestore
# - Functions  
# - Hosting
# - Storage
# - Emulators
```

## 3. Authentication 設定

### Google OAuth設定
1. Authentication > Sign-in method
2. Google プロバイダーを有効化
3. プロジェクトのサポートメールを設定
4. 承認済みドメインに本番ドメインを追加

### OAuth同意画面設定
1. [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services > OAuth同意画面
3. 外部ユーザータイプを選択
4. アプリ情報を入力
5. スコープを追加:
   - `auth/userinfo.email`
   - `auth/userinfo.profile` 
   - `drive/readonly`
   - `calendar`

## 4. Firestore 設定

### データベース作成
1. Firestore Database > データベースの作成
2. 本番モードで開始
3. ロケーション: `asia-northeast1`

### セキュリティルール
```bash
firebase deploy --only firestore:rules
```

### インデックス
```bash  
firebase deploy --only firestore:indexes
```

## 5. Storage 設定

### バケット作成
1. Storage > 開始する
2. セキュリティルールをテストモードで開始
3. ロケーション: `asia-northeast1`

### セキュリティルール適用
```bash
firebase deploy --only storage
```

## 6. Functions 設定

### Node.js Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

### Python Functions (OCR/AI用)
1. Google Cloud Console > Cloud Functions
2. 関数を作成
3. ランタイム: Python 3.11
4. リージョン: asia-northeast1

## 7. 必要なAPI有効化

### Google Cloud Console で以下を有効化:
- Cloud Vision API (OCR用)
- Google Drive API
- Google Calendar API  
- Gmail API
- Google Sheets API

## 8. サービスアカウント設定

### Functions用サービスアカウント
1. IAM > サービスアカウント > サービスアカウントを作成
2. 名前: `contract-management-functions`
3. 役割:
   - Cloud Vision API User
   - Firebase Admin SDK Service Agent
   - Storage Admin

### キーの作成・ダウンロード
```bash
# functions/.env に設定
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

## 9. 環境変数設定

### Firebase Functions環境変数
```bash
firebase functions:config:set \
  openai.api_key="your-openai-api-key" \
  google.client_id="your-google-client-id" \
  google.client_secret="your-google-client-secret"
```

### フロントエンド環境変数
```bash
# frontend/.env.local
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 10. ローカル開発環境

### Emulator Suite起動
```bash
firebase emulators:start
```

アクセス先:
- Emulator UI: http://localhost:4000
- Auth Emulator: http://localhost:9099  
- Firestore Emulator: http://localhost:8080
- Functions Emulator: http://localhost:5001
- Storage Emulator: http://localhost:9199

## 11. デプロイ

### 初回デプロイ
```bash
# 全体デプロイ
firebase deploy

# 個別デプロイ
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## トラブルシューティング

### よくある問題
1. **Functions デプロイエラー**: Node.js バージョン確認
2. **認証エラー**: OAuth設定の確認
3. **権限エラー**: IAMロールの確認
4. **API制限エラー**: 使用量制限の確認

### サポートコマンド
```bash
# ログ確認
firebase functions:log

# プロジェクト情報
firebase projects:list

# 設定確認
firebase functions:config:get
```

## セキュリティチェックリスト

- [ ] Firestore セキュリティルール適用済み
- [ ] Storage セキュリティルール適用済み  
- [ ] 本番環境の承認済みドメイン設定済み
- [ ] サービスアカウントの最小権限設定済み
- [ ] API キーの適切な制限設定済み
- [ ] HTTPSリダイレクト有効化済み