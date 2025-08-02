# OCRサービス (Python Cloud Functions)

契約管理システム用のOCR（光学文字認識）サービスです。PDFや画像ファイルからテキストを抽出し、契約書の主要情報を自動解析します。

## 📋 機能概要

### 主要機能
- **PDFテキスト抽出**: PyPDF2とpdfplumberを使用した高精度テキスト抽出
- **画像OCR**: Google Cloud Vision APIによる日本語/英語OCR
- **契約書解析**: 当事者名、日付、金額、重要条項の自動抽出
- **画像前処理**: OpenCVを使用したノイズ除去とコントラスト強化
- **多言語対応**: 日本語と英語の混在文書に対応

### 抽出される契約情報
- **当事者情報**: 会社名、個人名の自動検出
- **日付情報**: 契約日、有効期限、締結日の識別
- **金額情報**: 各種通貨（円、ドル、ユーロ）の金額抽出
- **重要条項**: 責任、義務、保証、違約金等の条項分類
- **条項分類**: 支払、解除、責任、秘密保持等のカテゴリ分け

## 🛠️ 技術スタック

### 主要ライブラリ
- **Google Cloud Vision API**: OCR機能
- **Firebase Admin SDK**: Firestore連携
- **PyPDF2 & pdfplumber**: PDF処理
- **OpenCV**: 画像前処理
- **Pillow (PIL)**: 画像操作
- **Janome**: 日本語形態素解析

### 実行環境
- **Python**: 3.11
- **Cloud Functions**: Python Runtime
- **Google Cloud Platform**: Vision API, Storage, Firestore

## 📁 ファイル構成

```
functions-python/
├── main.py              # メインOCRサービス
├── requirements.txt     # Python依存関係
├── Dockerfile          # コンテナ設定
├── .gcloudignore       # デプロイ除外設定
├── test_ocr.py         # テストスクリプト
└── README.md           # このファイル
```

## 🚀 セットアップと実行

### 1. 環境準備

```bash
# Python仮想環境作成
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 依存関係インストール
pip install -r requirements.txt
```

### 2. Google Cloud設定

```bash
# Google Cloud SDK認証
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Vision API有効化
gcloud services enable vision.googleapis.com

# サービスアカウントキー設定
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
```

### 3. ローカル実行

```bash
# OCRサーバー起動
python main.py

# 別ターミナルでテスト実行
python test_ocr.py
```

### 4. Firebase デプロイ

```bash
# Firebaseプロジェクトディレクトリで実行
firebase deploy --only functions:python
```

## 📡 API仕様

### エンドポイント: `/extract-text`

**Method:** POST  
**Content-Type:** application/json  
**Authorization:** Bearer {firebase_token}

#### リクエスト形式
```json
{
  "file_url": "gs://bucket-name/path/to/file.pdf",
  "file_type": "pdf",
  "user_id": "user123"
}
```

#### レスポンス形式
```json
{
  "text": "抽出されたテキスト内容...",
  "pages": [
    {
      "page_number": 1,
      "text": "ページ1のテキスト...",
      "method": "PyPDF2"
    }
  ],
  "metadata": {
    "method": "PyPDF2",
    "language_hints": ["ja", "en"]
  },
  "confidence": 0.95,
  "contract_info": {
    "parties": [
      {
        "name": "株式会社サンプル",
        "type": "company",
        "position": 123
      }
    ],
    "dates": {
      "contract_date": {
        "date": "2024-01-15T00:00:00",
        "original_text": "2024年1月15日",
        "position": 456
      }
    },
    "amounts": [
      {
        "value": 500000,
        "original_text": "500,000円",
        "currency": "JPY",
        "position": 789
      }
    ],
    "key_terms": [
      {
        "keyword": "責任",
        "text": "乙は業務遂行において善管注意義務を負う。",
        "importance": "high"
      }
    ],
    "clauses": [
      {
        "type": "payment",
        "content": "甲は乙に対し、月額500,000円（税別）の報酬を支払う。",
        "keyword": "支払"
      }
    ]
  },
  "result_id": "ocr_result_123"
}
```

## 🧪 テスト実行

### 自動テストスクリプト
```bash
# 統合テスト実行
python test_ocr.py
```

### テスト項目
- **サーバーヘルスチェック**: ローカルサーバー起動確認
- **契約書解析テスト**: サンプル契約書での情報抽出テスト
- **API統合テスト**: HTTPエンドポイントのテスト

### 手動テスト用cURL
```bash
curl -X POST http://localhost:8080/extract-text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "file_url": "gs://test-bucket/sample.pdf",
    "file_type": "pdf",
    "user_id": "test_user"
  }'
```

## ⚙️ 設定オプション

### 環境変数
- `GOOGLE_APPLICATION_CREDENTIALS`: サービスアカウントキーのパス
- `GOOGLE_CLOUD_PROJECT`: GCPプロジェクトID
- `PORT`: サーバーポート番号（デフォルト: 8080）

### OCR設定
- **対応言語**: 日本語（ja）、英語（en）
- **対応ファイル形式**: PDF, JPEG, PNG, TIFF, GIF
- **最大ファイルサイズ**: 20MB（Cloud Functionsの制限）

## 🔧 トラブルシューティング

### よくある問題

#### 1. Vision API認証エラー
```
Error: Vision API authentication failed
```
**解決方法:**
- サービスアカウントキーが正しく設定されているか確認
- Vision APIが有効化されているか確認
- プロジェクト課金が有効になっているか確認

#### 2. PDF処理エラー
```
Error: PDF text extraction failed
```
**解決方法:**
- PDFが破損していないか確認
- パスワード保護されたPDFは事前に解除
- 画像のみのPDFの場合はVision APIが自動使用される

#### 3. 日本語文字化け
```
文字化けしたテキストが出力される
```
**解決方法:**
- ファイルのエンコーディングをUTF-8に変更
- Vision APIの言語ヒントに'ja'が含まれているか確認

### ログ確認
```bash
# Cloud Functions ログ
gcloud functions logs read extract-text --limit 100

# ローカルログ
tail -f /var/log/ocr-service.log
```

## 📊 パフォーマンス

### 処理時間目安
- **PDFテキスト抽出**: 1-3秒/ページ
- **画像OCR**: 2-5秒/画像
- **契約情報解析**: 0.5-1秒/文書

### リソース使用量
- **メモリ**: 512MB-1GB
- **CPU**: 1vCPU
- **ネットワーク**: Vision API呼び出し時のみ

## 🔗 関連ドキュメント

- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [Firebase Functions Python](https://firebase.google.com/docs/functions/python)
- [契約管理システム設計書](../docs/00-firebase-setup-guide.md)
- [AI サービス実装](../docs/05-ai-service-implementation.md)

## 📈 今後の拡張予定

- **多言語対応拡充**: 中国語、韓国語への対応
- **レイアウト解析**: 表形式データの構造化抽出
- **バッチ処理**: 複数ファイルの一括処理
- **リアルタイム処理**: WebSocketを使用したリアルタイム進捗表示
- **AI統合**: OpenAI APIとの連携による高度な契約書解析