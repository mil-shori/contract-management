# チケット #07: CI/CD設定とFirebaseデプロイ

## 概要
GitHub Actionsを使用したCI/CDパイプラインとFirebaseデプロイの自動化

## 目標
- 自動テスト実行
- 自動ビルド・デプロイ
- ステージング・本番環境の分離
- ロールバック機能

## 実装タスク

### 1. GitHub Actions設定
- [ ] `.github/workflows/deploy.yml` 作成
- [ ] 環境変数の設定
- [ ] Firebase Service Account設定
- [ ] Secrets管理

### 2. ビルド・テストパイプライン
- [ ] Node.js環境設定
- [ ] 依存関係インストール
- [ ] TypeScript型チェック
- [ ] ESLint静的解析
- [ ] 単体テスト実行

### 3. Firebaseデプロイ設定
- [ ] Firebase CLI設定
- [ ] 環境別デプロイ設定
- [ ] Functions/Hosting/Rules同時デプロイ
- [ ] デプロイ前バリデーション

### 4. 環境管理
- [ ] Development環境設定
- [ ] Staging環境設定
- [ ] Production環境設定
- [ ] 環境変数管理

### 5. 監視・通知
- [ ] デプロイ結果通知（Slack/Discord）
- [ ] エラーアラート設定
- [ ] パフォーマンス監視
- [ ] ログ集約

## GitHub Actions ワークフロー例
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run test
    - run: npm run lint
```

## 必要なSecrets設定
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `FIREBASE_PROJECT_ID_DEV`
- `FIREBASE_PROJECT_ID_PROD`
- `OPENAI_API_KEY`
- `SLACK_WEBHOOK_URL`

## 成功条件
- [ ] コミット時に自動テスト実行
- [ ] mainブランチマージ時に本番デプロイ
- [ ] デプロイ失敗時の自動ロールバック
- [ ] 5分以内のデプロイ完了

## 推定工数
6-8時間

## セキュリティ考慮事項
- Service Accountの最小権限設定
- Secretsの適切な管理
- プルリクエスト時の権限制限
- 本番デプロイの承認フロー