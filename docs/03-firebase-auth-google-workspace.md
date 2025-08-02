# チケット #03: Firebase AuthenticationとGoogle Workspace連携実装

## 概要
Firebase AuthenticationとGoogle Workspace SSOの完全な連携実装

## 目標
- Google Workspace シングルサインオン (SSO)
- 企業ドメイン制限機能
- カスタムクレーム設定
- セキュリティトークンリフレッシュ

## 実装タスク

### 1. Firebase Auth設定
- [ ] Google OAuth プロバイダー設定
- [ ] 承認済みドメインの設定
- [ ] カスタムクレームルールの作成
- [ ] セキュリティルールとの連携

### 2. Google Workspace API連携
- [ ] Google APIs Service Account作成
- [ ] 必要なスコープ設定
  - `https://www.googleapis.com/auth/drive.readonly`
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/spreadsheets`

### 3. フロントエンド認証フロー
- [ ] Google Workspace ログインボタン
- [ ] トークンリフレッシュ処理
- [ ] ログアウト処理の改善
- [ ] 認証状態の永続化

### 4. バックエンド認証処理
- [ ] カスタムクレーム設定Function
- [ ] アクセストークン検証
- [ ] ユーザー権限管理
- [ ] セッション管理

### 5. 企業向け機能
- [ ] ドメイン制限設定
- [ ] 管理者権限設定
- [ ] 組織単位でのアクセス制御
- [ ] 監査ログ

## 必要なFirebase設定
1. Authentication > Sign-in method > Google有効化
2. Google Cloud Console > APIs & Services設定
3. OAuth同意画面の設定
4. 承認済みドメインの追加

## 成功条件
- [ ] Google Workspaceアカウントでログイン可能
- [ ] 企業ドメイン以外はアクセス拒否
- [ ] 管理者権限が正しく設定される
- [ ] トークンが自動更新される

## 推定工数
8-10時間

## セキュリティ考慮事項
- HTTPS必須
- トークン有効期限管理
- CSRFトークン実装
- セッション固定攻撃対策