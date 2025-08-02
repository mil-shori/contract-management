# チケット #01: 国際化 (i18n) 設定実装

## 概要
React i18nextを使用した多言語対応システムの実装

## 目標
- 日本語・英語の切り替え機能
- 動的言語切り替え
- Material UIとの連携

## 実装タスク

### 1. i18n基盤設定
- [ ] i18nextの設定ファイル作成
- [ ] 言語リソースファイル作成（ja/en）
- [ ] I18nContextの実装
- [ ] 言語切り替えフック作成

### 2. 翻訳ファイル作成
- [ ] 共通翻訳（navigation, buttons, messages）
- [ ] 契約関連翻訳（contract, status, fields）
- [ ] エラーメッセージ翻訳
- [ ] フォームバリデーション翻訳

### 3. コンポーネント多言語化
- [ ] Layout/Navigationの多言語化
- [ ] ログインページの多言語化
- [ ] 契約一覧・詳細ページの多言語化
- [ ] フォームの多言語化

### 4. Material UI多言語化
- [ ] MUI DatePickerのローカライズ
- [ ] MUI DataGridのローカライズ
- [ ] カスタムテーマの言語対応

## 成功条件
- [ ] 言語切り替えボタンが機能する
- [ ] ページリロード時に言語設定が保持される
- [ ] 全ての文字列が翻訳される
- [ ] ブラウザ言語設定の自動検出が働く

## 推定工数
4-6時間

## 関連ファイル
- `frontend/src/contexts/I18nContext.tsx`
- `frontend/src/locales/ja.json`
- `frontend/src/locales/en.json`
- `frontend/src/hooks/useTranslation.ts`