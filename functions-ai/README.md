# AIサービス (Python Cloud Functions)

契約管理システム用のAI分析サービスです。OpenAI GPT-4を使用して契約書の要約、リスク分析、チャット機能、重要ポイント抽出を提供します。

## 📋 機能概要

### 主要機能
- **契約書要約**: GPT-4による包括的な契約内容要約生成
- **リスク分析**: 法的・財務・運用リスクの自動判定と改善提案
- **チャット機能**: 契約書内容への自然言語での質問応答
- **重要ポイント抽出**: 契約書から主要条項や注意点を自動抽出
- **コスト管理**: トークン使用量とAPI利用コストの追跡
- **レート制限**: ユーザー別の使用量制限とスパム防止

### AI機能詳細
- **要約生成**: 契約の目的、条項、金額、期間、リスクを構造化して要約
- **リスク評価**: 低・中・高の3段階でリスクレベルを判定、具体的な改善案を提示
- **対話分析**: 契約書の内容について専門的な質問応答、コンテキスト保持
- **ポイント抽出**: 権利義務、金額、期間、リスク、特記事項を分類して抽出

## 🛠️ 技術スタック

### AI・ML関連
- **OpenAI GPT-4**: 主要なAI推論エンジン
- **LangChain**: AI アプリケーション開発フレームワーク
- **tiktoken**: トークン数計算とコスト管理
- **spaCy**: 自然言語処理（英語・日本語）
- **transformers**: 事前学習済みモデル

### 日本語処理
- **Janome**: 日本語形態素解析
- **MeCab**: 高精度日本語解析（オプション）
- **SudachiPy**: 日本語正規化・分割

### クラウド・データベース
- **Firebase Admin SDK**: Firestore連携
- **Google Cloud Storage**: ファイル管理
- **Google Cloud Functions**: サーバーレス実行環境

### Webフレームワーク
- **Functions Framework**: Google Cloud Functions対応
- **Flask**: HTTP APIサーバー
- **Flask-CORS**: CORS対応

## 📁 ファイル構成

```
functions-ai/
├── main.py              # メインAIサービス
├── requirements.txt     # Python依存関係
├── Dockerfile          # コンテナ設定
├── .gcloudignore       # デプロイ除外設定
├── test_ai.py          # 総合テストスクリプト
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

# spaCyモデルダウンロード
python -m spacy download en_core_web_sm
python -m spacy download ja_core_news_sm
```

### 2. OpenAI API設定

```bash
# OpenAI APIキー取得・設定
export OPENAI_API_KEY="your-openai-api-key-here"

# または.envファイルに記載
echo "OPENAI_API_KEY=your-openai-api-key-here" > .env
```

### 3. Google Cloud設定

```bash
# Google Cloud SDK認証
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Firebase Admin SDK認証
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
```

### 4. ローカル実行

```bash
# AIサーバー起動
python main.py

# 別ターミナルでテスト実行
python test_ai.py
```

### 5. Firebase デプロイ

```bash
# Firebaseプロジェクトディレクトリで実行
firebase deploy --only functions:ai
```

## 📡 API仕様

### 共通ヘッダー
```
Content-Type: application/json
Authorization: Bearer {firebase_token}
```

### 1. 契約書要約 - `/summarize`

**Method:** POST

#### リクエスト
```json
{
  "contract_text": "契約書の全文テキスト...",
  "user_id": "user123"
}
```

#### レスポンス
```json
{
  "summary": "契約書の包括的な要約...",
  "metadata": {
    "processing_time": 3.45,
    "tokens_used": 1250,
    "cost": 0.0375,
    "model": "gpt-4",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "result_id": "summary_abc123"
}
```

### 2. リスク分析 - `/analyze-risk`

**Method:** POST

#### リクエスト
```json
{
  "contract_text": "契約書の全文テキスト...",
  "user_id": "user123"
}
```

#### レスポンス
```json
{
  "risk_analysis": {
    "overall_risk_level": "中",
    "risk_score": 65,
    "risk_factors": [
      {
        "category": "法的リスク",
        "severity": "中",
        "description": "解除条件が一方的で不利...",
        "recommendation": "双方の合意による解除条項を追加"
      }
    ],
    "summary": "総合的なリスク評価コメント"
  },
  "metadata": {
    "processing_time": 4.20,
    "tokens_used": 1850,
    "cost": 0.0555,
    "model": "gpt-4",
    "timestamp": "2024-01-15T10:35:00Z"
  },
  "result_id": "risk_def456"
}
```

### 3. チャット機能 - `/chat`

**Method:** POST

#### リクエスト
```json
{
  "contract_text": "契約書の全文テキスト...",
  "question": "この契約の報酬はいくらですか？",
  "chat_history": [
    {
      "role": "user",
      "content": "前の質問...",
      "timestamp": "2024-01-15T10:25:00Z"
    },
    {
      "role": "assistant", 
      "content": "前の回答...",
      "timestamp": "2024-01-15T10:25:30Z"
    }
  ],
  "user_id": "user123"
}
```

#### レスポンス
```json
{
  "answer": "契約書によると、基本報酬は月額800,000円（税別）で、成果報酬として...",
  "metadata": {
    "processing_time": 2.15,
    "tokens_used": 890,
    "cost": 0.0267,
    "model": "gpt-4",
    "timestamp": "2024-01-15T10:40:00Z"
  },
  "session_id": "chat_session_789",
  "updated_history": [
    // 更新されたチャット履歴
  ]
}
```

### 4. 重要ポイント抽出 - `/extract-key-points`

**Method:** POST

#### リクエスト
```json
{
  "contract_text": "契約書の全文テキスト...",
  "user_id": "user123"
}
```

#### レスポンス
```json
{
  "key_points": {
    "key_points": [
      {
        "category": "金額",
        "title": "基本報酬",
        "content": "月額800,000円（税別）",
        "importance": "高",
        "page_reference": "第3条"
      },
      {
        "category": "期間",
        "title": "契約期間",
        "content": "2024年1月15日から2024年6月30日まで",
        "importance": "高",
        "page_reference": "第4条"
      }
    ],
    "summary": "本契約は業務委託契約で、主要なポイントは..."
  },
  "metadata": {
    "processing_time": 3.80,
    "tokens_used": 1420,
    "cost": 0.0426,
    "model": "gpt-4",
    "timestamp": "2024-01-15T10:45:00Z"
  },
  "result_id": "keypoints_ghi789"
}
```

## 🧪 テスト実行

### 統合テストスクリプト
```bash
# 全テスト実行
python test_ai.py

# 特定の機能テスト
python -c "from test_ai import test_summarize; test_summarize()"
python -c "from test_ai import test_risk_analysis; test_risk_analysis()"
python -c "from test_ai import test_chat; test_chat()"
```

### テスト項目
- **サーバーヘルスチェック**: AIサーバー起動確認
- **要約生成テスト**: サンプル契約書での要約品質確認
- **リスク分析テスト**: リスクレベル判定精度確認
- **チャット機能テスト**: 質問応答の適切性確認
- **重要ポイント抽出テスト**: 情報抽出の正確性確認
- **パフォーマンステスト**: 各API の応答時間測定
- **ローカル機能テスト**: トークンカウント、コスト計算等

### 手動テスト用cURL

#### 要約生成
```bash
curl -X POST http://localhost:8081/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "contract_text": "契約書の内容...",
    "user_id": "test_user"
  }'
```

#### リスク分析
```bash
curl -X POST http://localhost:8081/analyze-risk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "contract_text": "契約書の内容...",
    "user_id": "test_user"
  }'
```

## ⚙️ 設定・カスタマイズ

### 環境変数
- `OPENAI_API_KEY`: OpenAI APIキー（必須）
- `GOOGLE_APPLICATION_CREDENTIALS`: GCP サービスアカウントキー
- `GOOGLE_CLOUD_PROJECT`: GCPプロジェクトID
- `PORT`: サーバーポート番号（デフォルト: 8081）

### AIモデル設定
```python
# main.py内で変更可能
self.openai_client = ChatOpenAI(
    model_name="gpt-4-1106-preview",  # モデル指定
    temperature=0.3,                   # 創造性レベル
    max_tokens=2000,                   # 最大出力トークン数
    openai_api_key=os.getenv('OPENAI_API_KEY')
)
```

### レート制限設定
- **1分間制限**: 10リクエスト/ユーザー
- **1日制限**: 100リクエスト/ユーザー
- **制限は main.py の `_validate_rate_limit()` で変更可能**

### コスト設定
```python
# GPT-4料金（2024年1月時点）
prompt_cost = prompt_tokens * 0.00003    # $0.03/1K tokens
completion_cost = completion_tokens * 0.00006  # $0.06/1K tokens
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. OpenAI API認証エラー
```
Error: OpenAI API authentication failed
```
**解決方法:**
- APIキーが正しく設定されているか確認
- OpenAIアカウントの課金設定を確認
- APIキーの権限設定を確認

#### 2. レート制限エラー
```
Error: Rate limit exceeded
```
**解決方法:**
- 1分間に10回以上のリクエストを送信していないか確認
- 1日に100回以上のリクエストを送信していないか確認
- Firestoreのuser_ai_usageコレクションをクリア

#### 3. 日本語処理エラー
```
Error: Japanese text processing failed
```
**解決方法:**
- spaCyの日本語モデルがインストールされているか確認
```bash
python -m spacy download ja_core_news_sm
```
- Janomeが正しくインストールされているか確認

#### 4. メモリ不足エラー
```
Error: Memory allocation failed
```
**解決方法:**
- 大きな契約書は分割して処理
- Cloud Functionsのメモリ設定を増加
- 不要なモデルやライブラリをアンロード

### ログ確認
```bash
# Cloud Functions ログ
gcloud functions logs read summarize --limit 100
gcloud functions logs read analyze-risk --limit 100

# ローカルログ
tail -f /var/log/ai-service.log
```

## 📊 パフォーマンス・制限

### 処理時間目安
- **要約生成**: 3-8秒
- **リスク分析**: 4-10秒
- **チャット応答**: 2-6秒
- **重要ポイント抽出**: 3-8秒

### リソース使用量
- **メモリ**: 1GB-2GB
- **CPU**: 1-2vCPU
- **ネットワーク**: OpenAI API呼び出し時のみ

### トークン制限
- **最大入力**: 約32,000トークン（GPT-4）
- **最大出力**: 2,000トークン（設定可変）
- **1日の推奨上限**: 100,000トークン/ユーザー

### コスト目安（GPT-4使用時）
- **要約生成**: $0.03-0.08/回
- **リスク分析**: $0.04-0.10/回
- **チャット**: $0.02-0.06/回
- **重要ポイント抽出**: $0.03-0.08/回

## 🔒 セキュリティ・プライバシー

### データ保護
- 契約書データはOpenAIに送信（OpenAIのプライバシーポリシーに準拠）
- 処理後のデータは自動削除（ログ・履歴除く）
- 個人情報の匿名化推奨

### APIキー管理
- 環境変数での安全な管理
- ローテーション推奨（月1回）
- アクセスログの監視

### 使用量監視
- Firestoreでの使用量追跡
- 異常使用の検出・アラート
- コスト上限の設定推奨

## 🔗 関連ドキュメント

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [LangChain Documentation](https://python.langchain.com/)
- [Firebase Functions Python](https://firebase.google.com/docs/functions/python)
- [契約管理システム設計書](../docs/00-firebase-setup-guide.md)
- [OCR サービス実装](../functions-python/README.md)

## 📈 今後の拡張予定

- **多言語対応**: 中国語、韓国語での契約書分析
- **業界特化**: 特定業界向けの専門分析機能
- **リアルタイム分析**: WebSocketでの進捗表示
- **高度な分析**: 契約書比較、変更点検出
- **API統合**: 外部法務システムとの連携
- **バッチ処理**: 複数契約書の一括分析
- **カスタムプロンプト**: ユーザー定義の分析テンプレート