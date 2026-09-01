# チケット #04: 文字起こし・構造化パイプライン

## 全体の流れ

```
Storage 書き込み
   ↓ (Functions v2 トリガ)
captures/{id} 作成 (status=uploaded)
   ↓
[段1] ffmpeg: 音声抽出 + フレーム抽出        ← Cloud Run Job
   ↓ (status=transcribing)
[段2] Speech-to-Text v2 (chirp_2) batchRecognize
   ↓ (status=structuring)
[段3] Claude (claude-opus-5, vision) でカード起案
   ↓
[段4] Vertex AI で埋め込み生成 → Firestore vector field
   ↓ (status=ready)
承認キューへ
```

すべて **asia-northeast1**（東京）。既存 `functions/src/index.ts` の `setGlobalOptions` を踏襲。

---

## 段1: ffmpeg（Cloud Run Job）

**Cloud Functions ではなく Cloud Run Job にする。** ffmpeg のバイナリ同梱と、
長尺処理のタイムアウト（最大60分）の両方が必要なため。既存 `functions-python/Dockerfile` が
Docker 化の前例になる。

```bash
# 音声抽出（16kHz mono = STT が最も精度を出す形式）
ffmpeg -i input.mp4 -vn -ac 1 -ar 16000 -c:a flac audio.flac

# フレーム抽出（5秒間隔）
ffmpeg -i input.mp4 -vf "fps=1/5" -q:v 3 frame_%04d.jpg

# シーン変化でも抽出（動きのある瞬間を拾う）
ffmpeg -i input.mp4 -vf "select='gt(scene,0.3)',showinfo" -vsync vfr scene_%04d.jpg
```

- フレームは**多すぎても LLM のコストになるだけ**。1本あたり最大10枚に間引く
- 間引きは「シーン変化のフレームを優先し、足りなければ等間隔で補う」

---

## 段2: 文字起こし — Google Cloud Speech-to-Text v2 (`chirp_2`)

```python
from google.cloud import speech_v2

config = speech_v2.RecognitionConfig(
    auto_decoding_config=speech_v2.AutoDetectDecodingConfig(),
    model="chirp_2",
    language_codes=["ja-JP", "en-US", "vi-VN"],   # ← 設定ファイル駆動。後から追加できる
    features=speech_v2.RecognitionFeatures(
        enable_word_time_offsets=True,       # タイムコード必須
        enable_automatic_punctuation=True,
        diarization_config=speech_v2.SpeakerDiarizationConfig(
            min_speaker_count=1, max_speaker_count=3),
    ),
)
# 長尺は batchRecognize（GCS 上のファイルを非同期処理）
```

**選定理由**

| 観点 | 理由 |
|---|---|
| 日本語精度 | `chirp_2` は日本語で実用水準 |
| 多言語 | `language_codes` に複数指定して自動判定できる。母語が後から増えても設定追加だけ |
| データ所在 | 同一GCPプロジェクト内で完結。外部への持ち出しがない |
| 長尺 | `batchRecognize` で数十分の音声も処理できる |

### 最大の技術リスク：工場騒音下の認識精度

**これが閾値を割ると、この仕組み全体が成立しない。** Phase 0 で必ず実測する（#09）。

割った場合の分岐：

1. **ピンマイク**（Bluetooth または USB-C）を使う ← 第一候補。数千円で解決することが多い
2. **撮影と口述を分ける**：現場で撮る → 静かな場所で映像を見ながら口述
3. 騒音の少ない工程から先に導入し、うるさい工程は後回しにする

---

## 段3: 構造化 — Claude で「観点カード」を起案

### モデルとパラメータ

```python
from anthropic import Anthropic
client = Anthropic()

message = client.messages.create(
    model="claude-opus-5",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},
    system=[
        {"type": "text", "text": FACTORY_CONTEXT,   # 工場の前提・用語辞書・スキーマ定義
         "cache_control": {"type": "ephemeral"}},   # ← ここまでを prompt cache に載せる
    ],
    messages=[{"role": "user", "content": [
        *frame_image_blocks,                        # vision: 代表フレーム最大10枚
        {"type": "text", "text": transcript_with_timecodes},
    ]}],
)
```

**注意点**

- `budget_tokens` は Opus 5 では **400 エラー**になる。`thinking: {"type": "adaptive"}` を使う
- system プロンプト（工場の前提・用語辞書・出力スキーマ）は**安定プレフィックス**として
  先頭に固定し、`cache_control` を付ける。可変部（今回の文字起こし）は後ろに置く
- キャッシュが効いているかは `usage.cache_read_input_tokens` で確認する。0 のままなら
  プレフィックスのどこかが毎回変わっている
- 出力が長くなる場合は `.stream()` ＋ `get_final_message()`（HTTPタイムアウト回避）

### 出力の強制

`output_config.format` に `appendix-a-card-schema.json` を渡し、スキーマ違反を API 層で弾く。
パースエラーのリトライをアプリ側で書かなくて済む。

### 起案時の必須ルール（プロンプトに書く。詳細は付録B）

1. **`source.startSec` / `endSec` / `quote` は必ず埋める。** 埋められないカードは出力しない
2. **発言にない情報を補わない。** 一般論の食品衛生知識で穴を埋めない
3. `why` が発言から読み取れない場合は空にし、`confidence` を下げる（捏造しない）
4. 1本の動画から出すカードは**最大10枚**。細かく割りすぎない

---

## 段4: 埋め込み — Vertex AI

**Anthropic に埋め込みAPIは無い。** Vertex AI を使う。

```python
from vertexai.language_models import TextEmbeddingModel
model = TextEmbeddingModel.from_pretrained("text-multilingual-embedding-002")
```

- **多言語モデルを選ぶ。** 日本語のカードにベトナム語で質問しても引ける必要がある
- 埋め込む文字列は `title + observe + criteria + why` を連結したもの
- カードが `approved` になったタイミングで生成し、`cards.embedding` に書く
- 出力は 768 次元 → Firestore の vector field 設定と一致させる

---

## エラーハンドリング

| 失敗 | 対応 |
|---|---|
| ffmpeg 失敗 | `status=failed`、`error` に stderr。手動再実行できるボタンを管理画面に置く |
| STT の信頼度が低い | 認識結果は保存した上で `confidence` を下げ、承認画面で「音声不明瞭」と表示 |
| Claude のスキーマ違反 | API 層でリトライ（`output_config.format` があれば基本起きない） |
| Claude の rate limit (429) | 指数バックオフでリトライ。バッチ処理なので急がなくてよい |

**部分的に失敗しても、そこまでの成果物は残す。** 文字起こしまで成功していれば、
カード起案だけ後から再実行できるようにする。

---

## 完了条件

- [ ] 1本の動画を投入して、10分以内に `status=ready` まで到達する
- [ ] 工場の実音声で STT の精度を実測し、判定結果が #09 に記録されている
- [ ] `usage.cache_read_input_tokens` が2回目以降で 0 でないことを確認
- [ ] 出力されたカードの `source` から、元動画の該当秒数を再生して発言が一致する
- [ ] わざと ffmpeg を失敗させて、再実行で復帰できる
