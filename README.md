# 契約管理システム

## 概要
Google Workspaceとの連携を通じて契約書のデータ化・管理・活用を行う契約管理システムです。
Firebaseのサーバーレスアーキテクチャを採用し、スケーラブルかつコスト効率的なシステムを構築します。

## アーキテクチャ
- Firebase サーバーレスアーキテクチャ
- React + TypeScript フロントエンド (Firebase Hosting)
- Firebase Functions (Node.js + Python) バックエンド
- Firestore + Firebase Storage データベース
- Firebase Authentication + Google Workspace連携

## システム構成
- **Firebase Functions**: サーバーレスAPI群
- **Firebase Authentication**: Google Workspaceとの認証連携
- **Firestore**: 契約情報のリアルタイムデータベース
- **Firebase Storage**: 契約書ファイルの保存
- **Cloud Functions (Python)**: OCR・AI処理
- **Firebase Extensions**: 通知・検索機能

## 技術スタック

### フロントエンド
- React 18 + TypeScript
- Material UI
- react-i18next (国際化)
- Firebase SDK v9+ (モジュラーSDK)

### バックエンド
- Firebase Functions (Node.js 18)
- Cloud Functions (Python 3.11) - AI・OCR処理
- Firebase Authentication (Google OAuth)

### データベース・ストレージ
- Firestore (NoSQL リアルタイムデータベース)
- Firebase Storage (ファイルストレージ)
- Firebase Extensions (検索・通知)

### デプロイ・CI/CD
- Firebase Hosting (フロントエンド)
- Firebase Functions (バックエンド)
- GitHub Actions (自動デプロイ)

## Firebase利用メリット

### 認証・セキュリティ
- Firebase AuthenticationでGoogle Workspaceとシームレス連携
- Firestore Security Rulesできめ細かいアクセス制御
- 自動的なHTTPS通信とセキュリティ対策

### パフォーマンス・スケーラビリティ
- Firestoreのリアルタイム同期とオフライン対応
- Functions の自動スケーリングとコスト最適化
- グローバルCDNによる高速配信

### 開発・運用効率
- ワンコマンドでのデプロイとロールバック
- 統合監視とログ管理
- Google Cloud Platformとの親和性

## セットアップ

### 📋 重要: 最初にFirebase設定を完了してください

**[Firebase セットアップガイド](./docs/00-firebase-setup-guide.md)を必ず確認してください**

このガイドには以下の重要な設定が含まれています：
- Firebase プロジェクト作成
- Authentication設定（Google Workspace連携）
- Firestore・Storage設定
- 必要なGoogle Cloud APIs有効化
- サービスアカウント設定
- 環境変数設定

### クイックスタート
```bash
# 1. Firebase CLI インストール
npm install -g firebase-tools
firebase login

# 2. プロジェクト初期化
firebase init

# 3. 依存関係インストール
cd frontend && npm install
cd ../functions && npm install

# 4. ローカル開発環境起動
firebase emulators:start

# 5. フロントエンド開発サーバー起動（別ターミナル）
cd frontend && npm run dev
```

### 環境変数設定例
```bash
# frontend/.env.local
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# functions/.env (オプション)
OPENAI_API_KEY=your-openai-key
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

## 📋 開発ロードマップ

### 実装チケット一覧（優先順）

| #  | チケット | ステータス | 推定工数 |
|----|----------|-----------|----------|
| 00 | [Firebase セットアップガイド](./docs/00-firebase-setup-guide.md) | ✅ 完了 | 2-3時間 |
| 01 | [国際化 (i18n) 実装](./docs/01-i18n-implementation.md) | 🔄 次実行予定 | 4-6時間 |
| 02 | [Material UI コンポーネント実装](./docs/02-ui-components-implementation.md) | ⏸ 待機中 | 12-16時間 |
| 03 | [Firebase Auth & Google Workspace連携](./docs/03-firebase-auth-google-workspace.md) | ⏸ 待機中 | 8-10時間 |
| 04 | [OCRサービス実装](./docs/04-ocr-service-implementation.md) | ⏸ 待機中 | 10-12時間 |
| 05 | [AIサービス実装](./docs/05-ai-service-implementation.md) | ⏸ 待機中 | 8-10時間 |
| 06 | [Firebase Storage実装](./docs/06-firebase-storage-implementation.md) | ⏸ 待機中 | 8-10時間 |
| 07 | [CI/CD設定](./docs/07-cicd-deployment.md) | ⏸ 待機中 | 6-8時間 |

**総推定工数: 58-75時間**

### 次の実行指示
```bash
# チケット#01から順番に実行してください
# 各チケットの詳細な実装手順は docs/ フォルダを参照
```

## プロジェクト構成

```
contract-management-system/
├── docs/                    # 📋 実装チケット・ガイド
│   ├── 00-firebase-setup-guide.md
│   ├── 01-i18n-implementation.md
│   ├── 02-ui-components-implementation.md
│   ├── 03-firebase-auth-google-workspace.md
│   ├── 04-ocr-service-implementation.md
│   ├── 05-ai-service-implementation.md
│   ├── 06-firebase-storage-implementation.md
│   └── 07-cicd-deployment.md
├── frontend/                # React + TypeScript アプリ
│   ├── src/
│   ├── public/
│   └── package.json
├── functions/               # Firebase Functions
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules         # Firestore セキュリティルール
├── storage.rules           # Storage セキュリティルール
├── firebase.json           # Firebase 設定
└── .firebaserc            # Firebase プロジェクト設定
```

## 開発フロー

### 🚀 開発ワークフロー（必須ルール）

**すべてのコード修正は以下のワークフローに従ってください：**

#### 🛠️ 自動化スクリプトの使用（推奨）

```bash
# 1. 新しいブランチの作成
./scripts/new-branch.sh <type> <name>
# 例: ./scripts/new-branch.sh feature user-authentication

# 2. 開発作業後、コミット・プッシュ
./scripts/commit-push.sh "<commit-message>"
# 例: ./scripts/commit-push.sh "feat: ユーザー認証機能を追加"

# 3. マージ後のブランチクリーンアップ
./scripts/cleanup-branch.sh
```

#### 📋 手動での開発ワークフロー

#### 1. 新しいブランチの作成
```bash
# メインブランチから最新の状態を取得
git checkout main
git pull origin main

# 機能ブランチを作成（命名規則: feature/機能名、fix/修正内容、refactor/改善内容）
git checkout -b feature/your-feature-name
# または
git checkout -b fix/bug-description
# または
git checkout -b refactor/improvement-description
```

#### 2. 開発作業
```bash
# コードの修正・追加
# テストの実行
npm run test

# コードフォーマット・リンターの実行
npm run lint
npm run format
```

#### 3. コミットとプッシュ
```bash
# 変更をステージング
git add .

# コミット（コミットメッセージは明確に）
git commit -m "feat: 新機能の説明"
# または
git commit -m "fix: バグ修正の説明"
# または
git commit -m "refactor: リファクタリングの説明"

# リモートリポジトリにプッシュ
git push origin feature/your-feature-name
```

#### 4. プルリクエスト作成
- GitHub上で手動でプルリクエストを作成
- レビュー後にmainブランチにマージ
- マージ後は機能ブランチを削除

#### 5. ブランチのクリーンアップ
```bash
# mainブランチに戻る
git checkout main

# 最新の状態を取得
git pull origin main

# 不要になった機能ブランチを削除
git branch -d feature/your-feature-name
```

### 📜 利用可能なスクリプト

| スクリプト | 用途 | 使用例 |
|-----------|------|--------|
| `new-branch.sh` | 新しいブランチの作成 | `./scripts/new-branch.sh feature user-auth` |
| `commit-push.sh` | テスト・リント実行後のコミット・プッシュ | `./scripts/commit-push.sh "feat: 新機能追加"` |
| `cleanup-branch.sh` | マージ後のブランチクリーンアップ | `./scripts/cleanup-branch.sh` |

### ⚠️ 重要な注意事項
- **mainブランチへの直接コミットは禁止**
- すべての変更は機能ブランチ経由で行う
- コミット前には必ずテストとリンターを実行
- プルリクエストでのコードレビューを経てからマージ
- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) 形式を推奨

### ローカル開発
```bash
# Firebase Emulator Suite 起動
firebase emulators:start

# フロントエンド開発サーバー
cd frontend && npm start
```

### デプロイ
```bash
# 全体デプロイ
firebase deploy

# Functions のみ
firebase deploy --only functions

# Hosting のみ
firebase deploy --only hosting
```

## API仕様

### 契約データAPI
- `GET /contracts` - 契約一覧取得
- `POST /contracts` - 契約作成
- `GET /contracts/{id}` - 契約詳細取得
- `PUT /contracts/{id}` - 契約更新
- `DELETE /contracts/{id}` - 契約削除

### ファイル処理API
- `POST /upload` - ファイルアップロード
- `POST /ocr` - OCR処理
- `POST /ai/summary` - AI要約生成

### Google Workspace連携API
- `GET /google/auth` - Google認証
- `POST /google/drive/save` - Drive保存
- `POST /google/calendar/event` - カレンダー登録

## セキュリティ

### Firestore Rules
- ユーザー認証必須
- データの所有者のみ読み書き可能
- 管理者権限による全データアクセス

### Storage Rules
- 認証済みユーザーのみアップロード可能
- ファイルサイズ・形式制限
- ユーザー毎のディレクトリ分離

## 監視・ログ

### Firebase Analytics
- ユーザー行動分析
- エラー追跡
- パフォーマンス監視

### Cloud Logging
- Functions実行ログ
- エラーログの集約
- アラート設定

## 🚀 次のステップ

1. **[Firebase セットアップガイド](./docs/00-firebase-setup-guide.md)** を実行
2. **[チケット#01: 国際化実装](./docs/01-i18n-implementation.md)** から順番に実装
3. 各チケット完了後は対応するテストの実行

## 🆘 サポート

### よくある問題
- **Firebase 認証エラー**: [セットアップガイド](./docs/00-firebase-setup-guide.md#トラブルシューティング) を確認
- **Functions デプロイエラー**: Node.js バージョン (18+) を確認
- **権限エラー**: IAM設定と承認済みドメインを確認

### 開発コマンド
```bash
# ローカル開発環境
firebase emulators:start

# ビルド・テスト
npm run build
npm run test
npm run lint

# デプロイ
firebase deploy
```

## ライセンス
Private