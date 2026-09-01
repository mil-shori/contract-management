# チケット #03: iPad 収録・アップロード・PWA

## 1. カメラ起動は「ネイティブ呼び出し」で行う

```html
<input type="file" accept="video/*" capture="environment" />
```

**MediaRecorder は使わない**（主手段としては）。理由：

- iPadOS Safari の MediaRecorder は挙動が不安定で、長尺・音質・コーデックで詰まりやすい
- ネイティブのカメラアプリが起動すれば、手ブレ補正・音声処理・ストレージ管理をOSに任せられる
- 現場の人が「いつも使っているカメラ」と同じ操作になる

**MediaRecorder の使い所**：異音の録音など「音声だけ短く残したい」場面。
`audio/mp4` で30秒程度。これは安定して動く。

---

## 2. 収録ルール：1本1〜3分・1テーマ1本

**30分の巡回を1本で撮ってはいけない。**

| 問題 | 理由 |
|---|---|
| 上がらない | 1080p で数GB。工場Wi-Fiでは現実的でない |
| 見返せない | どこに何があるか分からない |
| 切り出せない | カードの `source` 区間を特定できない |
| 高い | STT も Storage も分数・容量に比例する |

**720p 推奨**を運用ルールにする。1080p の長回しが容量の主因になる。

---

## 3. 撮影画面に「前回記録」を出す

**これが記録の質を決める。**

- その設備・工程の**前回のカードと前回の発言**を画面に出す
- 撮る人は「前回こう言った。今日はどうか」を口に出せる
- 差分を言わせることが、暗黙知を引き出す最も安いやり方

---

## 4. アップロード：オフラインキュー必須

工場は電波が切れる。**撮った直後に上がる前提で作らない。**

```
撮影 → IndexedDB にファイル参照＋メタデータを積む
     → オンライン検知で uploadBytesResumable を再開
     → 完了したらキューから消す
     → 画面に「未送信 3件」を常時表示
```

- Firebase Storage の `uploadBytesResumable` を使う（中断・再開が効く）
- **未送信件数を必ず可視化する。** 「送ったつもり」が一番怖い
- 送信完了を Firestore の `captures.status = uploaded` で確認してからキューを消す

---

## 5. PWA（iPadホーム画面アプリ化）

既存 `frontend/vite.config.ts` の `VitePWA` ブロックをそのまま流用できる。変更点のみ：

```ts
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
  manifest: {
    name: '工場品質システム',
    short_name: '品質',
    display: 'standalone',      // ← ホーム画面から開くとアプリになる
    orientation: 'portrait',
    theme_color: '#1976d2',
    background_color: '#ffffff',
    start_url: '/',
    icons: [ /* 192 / 512 */ ]
  }
})
```

- **App Store 配布もネイティブアプリも不要。** Safari で開いて「ホーム画面に追加」するだけ
- `apple-touch-icon.png`（180×180）を必ず置く。無いとホーム画面のアイコンが崩れる
- MDM を入れているなら、ホーム画面追加を配布時に済ませておく

---

## 6. 現場向けUIの原則

| 原則 | 具体 |
|---|---|
| 手袋・濡れた手で操作できる | タップ領域は最低 **60×60pt**、隣接ボタンは16pt以上離す |
| 選択肢を減らす | 1画面の主要アクションは1つ。「撮る」だけ |
| 文字を減らす | ピクトグラム＋短い母語テキスト |
| 明るい場所でも見える | コントラスト比 4.5:1 以上、白背景を基本 |
| 押したことが分かる | 触覚フィードバックの代わりに、明確な色変化＋音 |

---

## 7. 保存ライフサイクル（コストが破綻しないように）

| 対象 | 保持 |
|---|---|
| 原本動画 | **90日で Nearline → 1年で削除**（Storage ライフサイクルルール） |
| 抜粋クリップ（カードの `source` 区間） | 長期保存 |
| 代表静止画（フレーム） | 長期保存 |
| 文字起こしテキスト | 長期保存（軽い） |

Storage のライフサイクルルールで自動化する。手動運用にすると必ず溜まる。

```jsonc
// gsutil lifecycle 設定の例
{ "rule": [
  { "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
    "condition": {"age": 90, "matchesPrefix": ["captures/"]} },
  { "action": {"type": "Delete"},
    "condition": {"age": 365, "matchesPrefix": ["captures/"]} }
]}
```

**削除は #08 の保存期間規程と必ず一致させる。** 規程で「1年保存」と書いたなら、
ライフサイクルもそうする。ここがズレると監査で説明できない。

---

## 8. Storage Rules

既存 `storage.rules` の書式を踏襲。動画はサイズ上限を上げる必要がある。

```js
match /captures/{yyyymm}/{captureId}/{fileName} {
  allow read:  if isAuthenticated() && isManager();
  allow write: if isAuthenticated() &&
                  request.resource.size <= 500 * 1024 * 1024 &&        // 500MB
                  request.resource.contentType.matches('video/.*|audio/.*');
  allow delete: if false;        // ライフサイクルルールに任せる
}
```

---

## 完了条件

- [ ] iPad 実機で、工場のWi-Fi下で1〜3分の動画が Storage に上がる
- [ ] 機内モードで撮影 → オンライン復帰で自動送信される
- [ ] ホーム画面に追加してアイコンから開くと、Safari のUIが出ずアプリとして開く
- [ ] 手袋をした状態で全操作ができる（実際に手袋をして試す）
- [ ] ライフサイクルルールが設定され、テストオブジェクトで動作確認済み
