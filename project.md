契約管理システム 技術選定を含む要件定義
1. 目的と概要
前回整理した機能要件を実現するために、システム全体のアーキテクチャと技術スタックを定義します。本システムは契約書のデータ化・管理・活用を行い、Google Workspaceとの連携を通じてユーザーがGoogleアプリ上で作成・編集した文書から直接契約を生成し、進捗を追跡できるようにします。OneflowのようにGoogle Workspace内で契約生成・送付・署名まで完結する仕組みが求められます[1]。
2. システムアーキテクチャ
契約管理システムはマイクロサービスアーキテクチャを採用します。マイクロサービスでは単機能サービスをAPIで疎結合に連携させるため、スケーラビリティ向上や故障範囲の局所化、言語選択の柔軟性といった利点があります[2]。一方で複雑性や通信オーバーヘッドといった課題があるため、コンテナオーケストレーション（Kubernetes）やCI/CDの整備を前提とします。
主要なサービス群は以下の通りです。 ・ APIゲートウェイ: 認証/認可を担い、各マイクロサービスへの入口となる。 ・ 契約データサービス: 契約情報のCRUDを提供し、データベースと連携する。 ・ OCR・データ化サービス: アップロードされたPDFや画像からテキストを抽出し、主要項目を構造化する。 ・ 検索サービス: 契約全文や属性の検索インデックスを管理する。 ・ AIサービス: AI要約やチャット検索などを提供する。 ・ 通知サービス: メールやチャットへの通知送信、Google Calendar登録を行う。 ・ Google Workspace連携サービス: Drive/Docs/Sheets/Calendar/Gmailの各APIを呼び出し、ファイル連携や認証を行う。
3. 技術スタック
3.1 フロントエンド
・ React + TypeScriptを採用し、SPAとして構築します。Reactはコンポーネント志向で開発効率が高く、TypeScriptにより型安全性と保守性を確保します。 ・ UIフレームワークとしてMaterial UIを利用し、Google Workspaceに馴染むデザインを実現します。 ・ 国際化（i18n）対応のため、react-i18nextを導入し、日本語と英語の切り替えを可能にします。
3.2 バックエンド
・ Node.js/Expressで構築したREST APIを基盤とします。JavaScript/TypeScriptで統一することでフロントエンドとの親和性を高め、非同期処理に適した環境を提供します。 ・ 認証基盤にはOAuth 2.0/OpenID Connectを採用し、Google WorkspaceのSSOと連携します。 ・ AI処理やデータ抽出など計算負荷の高い処理はPythonのFastAPIサービスとして分離し、PyTorch/TensorFlowモデルや外部API（Google Cloud Visionなど）を活用します。 ・ GraphQLを併設してクライアントが必要なデータだけを取得できるようにする選択肢も検討します。
3.3 データベース
・ MongoDBを主データベースとし、契約書のメタ情報やJSON形式の全文データを柔軟に格納します。MongoDBはJSON構造に自然に対応し、MEANスタックの三層構造（Angular/Express/Node/MongoDB）に含まれるようにJavaScriptベースで扱いやすいと評価されています[3]。 ・ リレーショナル特性が必要な場合はPostgreSQLを併用し、取引先やユーザーのマスタ情報を正規化します。 ・ 検索用途にはElasticsearchやOpenSearchを導入し、全文検索やハイライト表示に対応します。
3.4 OCR・AIサービス
・ OCRにはGoogle Cloud Vision APIを利用し、PDFや画像からテキスト抽出を行います。Vision APIはCloud Storage上のPDF/TIFFファイルからテキストを検出できる[1]ため、精度とスケーラビリティを確保できます。 ・ AI要約や自然言語検索にはOpenAI APIを利用し、契約書の文脈理解を高めます。 ・ AIサービスは個別のマイクロサービスとして運用し、基盤モデルの更新を容易にします。
3.5 検索エンジン
・ Elasticsearchを採用し、契約全文・主要項目・添付ファイルメタデータをインデックス化します。Japanese Tokenizer（Kuromoji）を組み込んで日本語の形態素解析を行い、精度の高い全文検索を提供します。 ・ 検索APIはREST経由で提供し、フロントエンドからキーワードや条件を指定して検索可能にします。
3.6 インフラ・運用
・ マイクロサービスはDockerコンテナとして実装し、Kubernetes（GKE）上で運用します。Kubernetesによるオートスケーリングとローリングアップデートで可用性と運用効率を高めます[4]。 ・ CI/CDはGitHub ActionsとArgo CDを活用し、ブランチ毎に自動テスト・静的解析・本番環境へのデプロイを行います。 ・ ログ管理にはElastic Stack（Elasticsearch、Filebeat、Kibana）を用いて、各マイクロサービスから中央集約されたログ分析環境を提供します。 ・ 監視にはPrometheusとGrafanaを導入し、CPU/メモリ使用量やレスポンス時間、Google Workspace連携APIのエラーレートを可視化します。
3.7 Google Workspace連携
・ Google Drive APIを用いて契約書PDFや関連資料をDriveに保存し、バージョン管理と権限を同期します。 ・ Google Docs APIを利用して契約書のドラフトを作成・編集し、システム側に取込むときにドキュメント本文を取得します。 ・ Google Calendar APIを用いて契約期限や更新日をカレンダーに登録し、参加者の予定に反映します。 ・ Gmail APIで期限通知やカスタム通知を送信し、送信履歴をログに保存します。 ・ Google Sheets APIでCSV出力した契約データをシートに連携し、BIツールへの連携基盤を提供します。 ・ これらのAPI呼び出しはGoogleのOAuth認証を用い、ユーザー許可の範囲内で実行します。Oneflowのアドオンのように、Googleアプリ内から直接契約を生成・署名できる体験を実現します[5]。
4. 非機能要件
・ 性能: 検索レスポンスは1秒以内、ファイルアップロードはサイズに応じてストリーム処理を行い、高負荷時も安定して処理できるようにします。 ・ 可用性: Kubernetesの冗長構成により稼働率99.9%以上を目標とします。バックアップは日次で取得し、リージョンを跨いだレプリケーションを行います。 ・ セキュリティ: OAuth 2.0による認証・認可、データ暗号化、暗号化通信(HTTPS)を徹底します。アクセスログ・操作ログを保存し、監査証跡を確保します。 ・ 拡張性: マイクロサービスのため新機能追加時には既存サービスへ影響を最小限に抑えられます。検索インデックスやAIモデルのバージョンアップも独立して実施可能です。
5. 開発体制・プロセス
・ アジャイル開発を採用し、2週間単位のスプリントで開発とレビューを繰り返します。小さくリリースし、ユーザーからのフィードバックを取り入れながら改善します。 ・ コード管理はGitHubで行い、プルリクエストレビューによる品質担保と自動テストの導入を徹底します。 ・ ドキュメントはMarkdownで残し、仕様変更履歴を管理します。API仕様はOpenAPIで記述し、コード生成やテストに利用します。
6. まとめ
この技術選定により、契約管理システムは拡張性・柔軟性・高可用性を兼ね備えたプラットフォームとなります。JavaScriptを中心とするスタックによりフロントエンドとバックエンドの開発効率を高め、MongoDBやElasticsearchで大量の契約データを柔軟に扱います。マイクロサービスによる分散構造とGoogle Workspaceとの深い連携により、ユーザーは自分の業務環境を変えることなく契約書の作成・管理・署名を行えるようになります[6]。[2]で述べられているようにマイクロサービスはスケーラビリティや拡張性に優れ、[3]で説明されるようにJavaScript中心のMEAN構成はJSONデータと相性が良いことから本システムに適しています。
 
[1] [5] [6] How to sign contracts from Google Workspace Apps? - Oneflow
https://oneflow.com/blog/oneflow-for-google-workspace-contracts/
[2] [4] 7 Key Benefits of Microservices | Dreamfactory
https://blog.dreamfactory.com/7-key-benefits-of-microservices
[3] What Is The MEAN Stack? Introduction & Examples | MongoDB
https://www.mongodb.com/resources/languages/mean-stack
