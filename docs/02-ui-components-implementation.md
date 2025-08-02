# チケット #02: Material UIコンポーネント実装

## 概要
契約管理システムの主要UIコンポーネントの実装

## 目標
- 契約管理に必要な画面・コンポーネントの完成
- Material UIを活用したGoogle Workspace風のデザイン
- レスポンシブ対応

## 実装タスク

### 1. 共通コンポーネント
- [ ] Layout (ヘッダー、サイドバー、フッター)
- [ ] LoadingScreen
- [ ] ErrorBoundary
- [ ] 契約ステータスチップ
- [ ] ファイルアップロードコンポーネント

### 2. 認証関連ページ
- [ ] LoginPage (Google/メール認証)
- [ ] 認証フック (useAuth)

### 3. ダッシュボード
- [ ] DashboardPage
- [ ] 契約統計カード
- [ ] 最近の活動リスト
- [ ] 期限近づいている契約アラート

### 4. 契約管理ページ
- [ ] ContractsPage (一覧・検索・フィルター)
- [ ] ContractCard (契約カード表示)
- [ ] ContractDetailPage (詳細表示)
- [ ] CreateContractPage (新規作成・編集)
- [ ] ContractForm (フォームコンポーネント)

### 5. その他のページ
- [ ] SettingsPage (設定画面)
- [ ] NotFoundPage (404ページ)
- [ ] UserProfile (ユーザープロフィール)

### 6. データテーブル
- [ ] ContractDataGrid (Material UI DataGrid)
- [ ] ソート・フィルター機能
- [ ] ページネーション
- [ ] CSV エクスポート機能

## 成功条件
- [ ] 全ての画面が適切に表示される
- [ ] レスポンシブデザインが機能する
- [ ] Material UIテーマが統一されている
- [ ] ロード中・エラー状態が適切に表示される

## 推定工数
12-16時間

## 関連ファイル
- `frontend/src/components/`
- `frontend/src/pages/`
- `frontend/src/hooks/`