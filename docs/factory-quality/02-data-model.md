# チケット #02: データモデル設計

## 設計方針

- **Firestore** をメインDB、**Firebase Storage** を動画・音声・画像の保管庫にする
- ナレッジは**大きなマニュアル文書ではなく、小さなカードに割る**。検索・承認・更新・多言語化の
  すべてがカード単位でできるようになる
- **ベクトル検索は Firestore の vector field ＋ `findNearest`(COSINE)** を使う。
  数万チャンクまではこれで十分で、専用ベクトルDBは要らない

> 既存 `contract-management` の `functions-ai/main.py` は FAISS をインメモリで持っているが、
> **この方式は採らない。** Function インスタンスが揮発するとインデックスが消えるため。

---

## コレクション一覧

| コレクション | 役割 |
|---|---|
| `captures` | 録画・録音の1本。すべての起点 |
| `cards` | 観点カード（ナレッジの最小単位） |
| `cards/{id}/versions` | カードの版履歴 |
| `equipment` | 設備マスタ |
| `processes` | 工程マスタ |
| `checklists` | 工程ごとのチェックリスト（Phase 2 で突合に使う） |
| `workReports` | 作業者の動画点呼と突合結果（Phase 2） |
| `botSessions` | ボットの会話ログ |
| `knowledgeGaps` | ボットが答えられなかった質問＝次の収録テーマ |
| `users` | 従業員（母語・担当工程・認定バッジ） |

---

## `captures`

```jsonc
{
  "id": "cap_...",
  "role": "patrol | maintenance | work_report",   // 出口の振り分けはこれだけ
  "recordedBy": "uid",
  "recordedAt": "timestamp",
  "target": { "line": "L2", "equipment": "eq_...", "process": "proc_..." },
  "media": {
    "type": "video | audio",
    "storagePath": "captures/{yyyy-MM}/{captureId}/original.mp4",
    "durationSec": 132,
    "sizeBytes": 84000000
  },
  "status": "uploaded | extracting | transcribing | structuring | ready | failed",
  "transcript": {
    "language": "ja",              // STT の自動判定結果
    "segments": [ { "startSec": 0.0, "endSec": 4.2, "speaker": "S1", "text": "..." } ]
  },
  "frames": [ { "sec": 12, "storagePath": "..." } ],
  "error": null,
  "retentionPolicy": "original_90d"
}
```

- `status` は必ず1本道で進む。失敗したら `failed` ＋ `error` を残し、再実行できるようにする
- `transcript.segments` の**タイムコードは必須**。カードの出典として使う

---

## `cards` — 観点カード

**このスキーマがシステム全体の中心。** 正本は `appendix-a-card-schema.json`。

```jsonc
{
  "id": "card_...",
  "type": "inspection_point | procedure_step | maintenance_point | judgment_rule",
  "title": "充填後の重量チェックは3個連続で見る",
  "target": { "line": "L2", "equipment": "eq_filler_03", "process": "proc_filling" },
  "observe": "何を見るか",
  "senses": ["見る", "測る"],                       // 見る/聞く/触る/嗅ぐ/測る
  "criteria": "OK/NGの境界。数値・状態で書く",
  "why": "なぜそうするか。過去に何が起きたか",        // ← 本人の思考。最重要
  "onNg": "NGのときの処置と、誰に言うか",
  "frequency": "タイミング・頻度",
  "source": {
    "captureId": "cap_...",
    "startSec": 132, "endSec": 168,
    "quote": "発言の原文そのまま",
    "speaker": "社長"
  },
  "translations": { "vi": { "title": "...", "criteria": "..." } },
  "confidence": 0.82,
  "status": "draft | approved | archived",
  "version": 3,
  "approvedBy": "uid", "approvedAt": "timestamp",
  "embedding": [ /* vector field, 768次元 */ ],
  "embeddingUpdatedAt": "timestamp"
}
```

### 設計上の要点

1. **`source` のタイムコードと `quote` は必須。** これが無いカードは検証できず、承認もできない
2. **`why` を必ず埋めさせる。** 「何をするか」だけのマニュアルは守られない。
   「なぜ」が付くと守られる確率が上がり、ボットの回答も本人の思考に似る
3. `confidence` が低いもの・`why` が空のものを承認画面の先頭に出す
4. **`status: approved` のカードだけ**がボットとマニュアルに反映される
5. `translations` はカード単位。全文翻訳ではなくカード単位なので、差分更新が安い

---

## `checklists` / `workReports`（Phase 2）

```jsonc
// checklists/{processId}
{
  "processId": "proc_filling",
  "items": [
    { "id": "it_1", "text": "手袋を新しいものに交換した", "cardId": "card_...", "required": true },
    { "id": "it_2", "text": "充填量を3個連続で測った",   "cardId": "card_...", "required": true }
  ],
  "version": 4
}

// workReports/{id}
{
  "captureId": "cap_...",
  "workerId": "uid", "processId": "proc_filling",
  "checklistVersion": 4,
  "results": [
    { "itemId": "it_1", "verdict": "mentioned | not_mentioned | contradicted",
      "evidence": "根拠となる発言の引用", "startSec": 22 }
  ],
  "flagged": true,                 // not_mentioned か contradicted が1つでもあれば true
  "reviewStatus": "pending | reviewed | resolved",
  "reviewedBy": "uid", "reviewNote": "..."
}
```

**`verdict` は「疑い」であって違反認定ではない。** この位置づけを #08 で規程に落とす。

---

## `knowledgeGaps` — ループを閉じる仕掛け

```jsonc
{
  "question": "冷却機の霜取りは何分回すのが正解？",
  "askedBy": "uid", "askedAt": "timestamp",
  "askedCount": 4,                       // 同じ趣旨の質問が何回来たか
  "status": "open | scheduled | answered",
  "resolvedByCardId": null
}
```

ボットが答えられなかった質問がここに溜まる。**これが次に録るテーマのリストになる。**
`askedCount` の多い順に収録すれば、優先順位を考えなくてよい。

---

## インデックス

| コレクション | インデックス |
|---|---|
| `cards` | `status` + `target.process`、`status` + `target.equipment`、`embedding`（vector, COSINE, 768） |
| `captures` | `role` + `recordedAt desc`、`status` |
| `workReports` | `flagged` + `reviewStatus` + `createdAt desc`、`workerId` + `createdAt desc` |
| `knowledgeGaps` | `status` + `askedCount desc` |

---

## 権限設計（Firestore Rules）

既存 `firestore.rules` の `isAuthenticated()` / `isAdmin()` の書式を踏襲する。ロールは3つ。

| ロール | できること |
|---|---|
| `worker` | 自分の `workReports` の作成・自分の分の閲覧、`approved` カードの閲覧、ボット利用 |
| `manager` | 上記＋全 `workReports` の閲覧・レビュー、`captures` 作成、カード起案 |
| `owner` | 上記＋**カードの承認**、マスタ編集、全データ閲覧 |

```js
function role() { return request.auth.token.role; }
function isOwner()   { return role() == 'owner'; }
function isManager() { return role() in ['owner', 'manager']; }

match /cards/{cardId} {
  allow read:   if isAuthenticated() &&
                   (resource.data.status == 'approved' || isManager());
  allow create: if isManager();
  allow update: if isManager() &&
                   // status を approved に変えられるのは owner だけ
                   (request.resource.data.status != 'approved' || isOwner());
  allow delete: if false;                  // 削除しない。archived にする
}

match /workReports/{id} {
  allow read:   if isManager() || resource.data.workerId == request.auth.uid;
  allow create: if request.resource.data.workerId == request.auth.uid;
  allow update: if isManager();            // レビュー結果の書き込み
}
```

**カードは削除しない。** `archived` にして履歴を残す。「なぜ変わったか」が追えなくなると、
#01 §6 の変更管理が成立しない。

---

## 完了条件

- [ ] `appendix-a-card-schema.json` から Firestore のコレクションとインデックスが作れる
- [ ] ロール3種のカスタムクレーム設定方法が決まっている（既存 `functions/src/routes/auth.ts` を踏襲）
- [ ] Rules のユニットテスト（`@firebase/rules-unit-testing`）で worker が他人の記録を読めないことを確認
