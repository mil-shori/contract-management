# チケット #04: OCRサービス実装 (Cloud Functions Python)

## 概要
Google Cloud Vision APIを使用したOCRサービスの実装

## 目標
- PDF・画像からのテキスト抽出
- 契約書の主要項目自動抽出
- 多言語対応（日本語・英語）
- 高精度な文字認識

## 実装タスク

### 1. Cloud Functions (Python) セットアップ
- [ ] Python実行環境の設定
- [ ] requirements.txtの作成
- [ ] Google Cloud Vision API有効化
- [ ] サービスアカウント設定

### 2. OCR処理機能
- [ ] PDFからテキスト抽出
- [ ] 画像からテキスト抽出  
- [ ] OCR結果の構造化
- [ ] 信頼度スコア付与

### 3. 契約書項目抽出
- [ ] 当事者名の抽出
- [ ] 契約日・有効期限の抽出
- [ ] 金額・支払条件の抽出
- [ ] 重要条項の特定

### 4. データ処理・保存
- [ ] 抽出結果のFirestore保存
- [ ] 元ファイルのStorage保存
- [ ] OCR履歴の管理
- [ ] エラーハンドリング

### 5. API エンドポイント
- [ ] `/api/ocr/extract` - OCR実行
- [ ] `/api/ocr/status` - 処理状況確認
- [ ] `/api/ocr/result` - 結果取得
- [ ] 非同期処理対応

## 必要なGoogle Cloud設定
1. Cloud Vision API有効化
2. Service Account作成・キー取得
3. Firebase Functions Python環境設定
4. Cloud Storage権限設定

## パッケージ依存関係
```python
google-cloud-vision==3.4.4
google-cloud-firestore==2.13.1
google-cloud-storage==2.10.0
PyPDF2==3.0.1
Pillow==10.0.1
```

## 成功条件
- [ ] PDF・画像ファイルからテキスト抽出成功
- [ ] 日本語・英語の混在文書対応
- [ ] 主要項目の90%以上自動抽出
- [ ] 処理時間30秒以内（一般的な契約書）

## 推定工数
10-12時間

## セキュリティ考慮事項
- アップロードファイルサイズ制限
- ファイル形式チェック
- ウイルススキャン連携
- 機密情報の適切な処理