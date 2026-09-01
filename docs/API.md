# API

このリポジトリの API 面をまとめる。全体像は [ARCHITECTURE.md](ARCHITECTURE.md)。

---

## 1. 外部 API: Gemini（画像解析）

**投稿フローの画像解析だけが実 API を呼ぶ。** それ以外の画面に HTTP 呼び出しは無い。

```
js/screen-post.js（file 選択）
   ↓
js/state.js  startPostAnalysis(file)
   ↓ POST /api/analyze （multipart/form-data）
server.js
   ↓
server/gemini.js  → @google/genai → Gemini
   ↓ Structured Output（JSON Schema で固定）
server.js  → { success, data }
   ↓
js/state.js  state.post.analysis に格納
   ↓
js/screen-post.js / js/screen-listing.js が描画
```

**API キーはサーバプロセスにのみ存在する。** `index.html` / `data.js` / `js/*.js` に
キーを書いてはいけない（ブラウザへ配信されるため）。

### 1.1 `POST /api/analyze`

| 項目 | 内容 |
| ------------ | ----------------------------------------------------------------------------------- |
| Content-Type | `multipart/form-data` |
| `image` | 商品画像。**複数可**（最大 4 枚、1 枚あたり 8MB）。同一商品の別カットとして扱われる |
| `items` | 任意。登録済みグッズの `[{id, name}]` を JSON 文字列で。既存グッズとの同定に使う |

対応形式は JPEG / PNG / WebP / HEIC。**SVG は非対応**（Gemini が受け付けない）。

**成功時**

```json
{
  "success": true,
  "data": {
    "title": "Champion グレー プルオーバーパーカー",
    "category": "トップス",
    "brand": "Champion",
    "color": "グレー",
    "condition": "目立った傷や汚れなし",
    "description": "Championのグレーのプルオーバーパーカーです。",
    "missingFields": ["size"],
    "confidence": 0.87,
    "estimatedPrice": 4800,
    "matchedItemId": null
  }
}
```

| フィールド | 意味 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `brand` | 判別できない場合は `null` |
| `missingFields` | ユーザー確認が必要な項目キー（`size` / `condition` など）。画面では日本語に変換して表示 |
| `confidence` | 0〜1 |
| `estimatedPrice` | 想定売却価格（円）。**新規資産の相場に使う**。100〜1,000,000 に丸められる |
| `matchedItemId` | 既存グッズと同一と判断された場合その id。**実在する id だけを通す検証がサーバ側にある** |

**失敗時**

```json
{ "success": false, "error": "AI分析に失敗しました。手動で入力してください。" }
```

| HTTP | 状況 |
| ---- | --------------------------------- |
| 400 | 画像なし / 非対応形式 / 8MB 超 |
| 503 | `GEMINI_API_KEY` 未設定 |
| 502 | Gemini 呼び出し失敗・タイムアウト |

**Gemini の生のエラー文はユーザーへ返さない。** サーバのログにのみ出す。

### 1.2 プロンプトとモデル

`server/gemini.js` が単独で持つ。**フロントにプロンプトを置かない。**

Gemini は「フリマアプリへの出品情報を作る Agent」として指示されており、
画像から確認できないことを断定しない・ブランド不明なら `null` にする・
判断できない項目は `missingFields` に入れる、という制約が system prompt に入っている。

応答形式は `responseSchema`（Structured Output）で固定しているため、
自由文を `JSON.parse` する不安定さには依存しない。ただしサーバ側で
値域チェックと正規化（`normalize()`）を通してからフロントへ返す。

| 項目 | 値 |
| ------------ | ---------------------------------------------------- |
| 主モデル | `gemini-3.5-flash-lite`（`GEMINI_MODEL` で上書き可） |
| 退避モデル | `gemini-3.1-flash-lite` |
| タイムアウト | 主 12 秒 → 退避 20 秒 |
| thinking | `thinkingLevel: 'low'` |

モデル選定の理由と実測値は [DECISIONS.md](DECISIONS.md) を参照。**モデル名は陳腐化が速い。**

### 1.3 失敗時のフォールバック（重要）

**AI が落ちても既存の出品フローは壊れない。** 解析に失敗すると:

1. `state.post.analysisError` にメッセージが入る
2. 画面は `data.js` の `AI_RESULTS['acsta2.png']`（仕込みデータ）へ退避する
3. ユーザーは手入力で投稿を続けられる
4. `submitPost()` は従来どおり `stella-acsta` に加算する（デモ台本が成立する）

`file://` 直開きや、サーバ未起動でも同じ経路で退避する。
開発者向けの失敗理由は `console.error` に出る（画面には出さない）。

### 1.4 チュートリアルは AI を呼ばない

`startTutorialAnalysis()` は**従来どおり `setTimeout` 1.5 秒の演出**で、
結果は `AI_RESULTS['saidan.png']` の固定 7 件。ここに HTTP 呼び出しは無い。
理由は [DECISIONS.md](DECISIONS.md)。

---

## 2. 外部依存: CDN 1 本

`index.html` の `<head>` で読み込む。**データ取得ではなく描画の補助**にのみ使う。

| # | URL | 用途 | 呼び出し箇所 | 失敗時の挙動 |
| --- | --- | --- | --- | --- |
| 1 | `https://cdn.tailwindcss.com` | （実質未使用） | なし | **未検証。** 後述 |

Chart.js は**撤去済み**（グッズ一覧からチャートを外したため）。

### Tailwind Play CDN について

読み込まれてはいるが、**Tailwind のユーティリティクラスはコード中に 1 件も使われていない。** レイアウトは `styles.css`（189 クラス、`* { box-sizing }` と `body { margin: 0 }` の独自リセット込み）が全て担っている。

ただし Tailwind Play CDN は読み込み時に Preflight（CSS リセット）を注入する。**これが外れたときに見た目が変わるかどうかは未検証。** オフライン耐性を確認する場合は、DevTools でこの 1 行をブロックして全画面を目視すること（[demo-check skill](../.agents/skills/demo-check/SKILL.md) 参照）。

---

## 3. Internal API

**`window` 上のグローバルがモジュール間の契約**になっている。ここを変えると全画面に影響する。

### 3.1 `window.AppState`（`js/state.js`）

状態を変更してよい唯一の入口。screen からはこれだけを呼ぶ。

**購読・参照**

| メソッド | 返り値 | 用途 |
| --------------------- | -------------------------------------------- | -------------------------------------------- |
| `subscribe(listener)` | 解除関数 | 状態変更時に呼ばれる。`router.js` のみが使用 |
| `getState()` | state オブジェクト（**参照。複製ではない**） | 描画時の読み取り |
| `getItem(itemId)` | item または `null` | 呼び出し側で null ガードが必要 |
| `getUser(handle)` | user または `null` | 同上 |
| `getTotal()` | number | 保有総額 |
| `getTutorialTotal()` | number | チュートリアル画面の合計 |
| `formatYen(value)` | string | `¥84,200` 形式。金額表示は必ずこれを通す |

**ミューテータ**（呼ぶと `notify()` が走り全画面が再描画される）

| メソッド | 効果 |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setRoute(route)` | 画面遷移。詳細モーダルと祭壇カードを閉じる |
| `openProfile(handle)` | `tappable: true` のユーザーのみプロフィールへ遷移 |
| `startTutorialCapture()` / `startTutorialAnalysis()` | チュートリアルの stage を進める（後者は 1.5 秒後に `review` へ） |
| `adjustTutorialCount(itemId, delta)` | 個数を 1〜5 の範囲で増減 |
| `confirmTutorialItems()` | 「缶バッジ 2 個かつ他は 1 個」なら `value` へ。満たさなければトースト（**金額では判定しない**） |
| `completeTutorial()` | `tutorial.counts` を `items[].count` に反映しグッズ一覧タブへ |
| `toggleLike(postId)` | いいねのトグル |
| `sendRequest()` | 「欲しい」送信。トーストのみ |
| `startPostAnalysis(file)` | 選択された `File` を `/api/analyze` へ POST し、結果を `post.analysis` に入れて `result` へ。**解析中の再呼び出しは無視する**（二重送信防止）。失敗時は `post.analysisError` を立てて仕込みデータへ退避。`file` 省略時や `fetch` 不在時は従来の `setTimeout` 演出のみ。スピナーが一瞬で消えないよう最低 1.2 秒は `analyzing` を保つ |
| `adjustPostCount(delta)` / `togglePostGiveaway()` / `setPostCaption(caption)` | 投稿フォームの入力（`setPostCaption` のみ `notify()` を呼ばない。理由は明文化されていないが、再描画すると input の値と caret が失われるため意図的と思われる） |
| `submitPost()` | Gemini が既存グッズと同定（`matchedItemId`）していればその count を加算、していなければ**解析結果から新規アイテムを作って `items` に追加**。解析結果が無い場合は従来どおり `stella-acsta` に加算。投稿先を `postedItemId` に記録し、`createdPosts` に追加して `complete` へ |
| `resetPost()` | 投稿フォームを初期化 |
| `prepareListing(itemId)` | 出品モックへ遷移。存在しない itemId なら何もしない |
| `submitListing()` | 対象を `status: 'listed'` にして完了画面へ |
| `finishListing()` | グッズ一覧タブへ戻る |
| `setShrineCardOpen(isOpen)` / `shareShrineCard()` | 祭壇カードモーダル・シェアの制御 |
| `toggleShowPrices()` | グッズ一覧の相場トグル。ON かつ `status === 'listed'` のグッズにだけ金額が出る |
| `showToast(message)` | 3.2 秒で自動的に消えるトースト |

`state.post.analysis` は `/api/analyze` のレスポンス `data` がそのまま入る（失敗時は `null`）。
形は §1.1 を参照。`screen-post.js` と `screen-listing.js` が読む。

### 3.2 `window.Screens`（各 `js/screen-*.js` が登録）

各画面は `Screens.<route> = { ... }` の形で自己登録する。router が route 名で引く。

| キー | 必須 | 契約 |
| ------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `render()` | **必須** | HTML **文字列**を返す。DOM を組み立てない。この時点で要素はまだ DOM に無い |
| `bind(root)` | 任意 | `render` の結果が DOM に入った後に呼ばれる。イベント登録はここで |
| `afterRender(root)` | 任意 | `bind` の後に呼ばれる。DOM 挿入後でないとできない処理はここで。現在使っている画面は無い |

登録済みの route: `home` / `explore` / `profile` / `post` / `goods` / `mypage` / `tutorial` / `listing`。
未登録の route が指定された場合、router は `Screens.home` にフォールバックする。

**開発用**: `?screen=post` / `?screen=goods` のように URL クエリで初期画面を指定できる（`router.js` の `applyInitialScreen`）。
チュートリアルを済ませた状態から始まる。クエリが無ければ従来どおりチュートリアルから。

### 3.3 `window.Router`（`js/router.js`）

| メソッド | 用途 |
| ----------- | ------------------------------------------------------ |
| `go(route)` | `AppState.setRoute` の薄いラッパ |
| `render()` | 強制再描画。通常は購読経由で走るので直接呼ぶ必要はない |

### 3.4 `data.js` が公開する定数

`HISTORY_LABELS` / `ITEMS` / `POSTS` / `USERS` / `AI_RESULTS` / `EVENTS`。
**すべて読み取り専用**として扱う。スキーマは要件定義書 §3.2 で固定されており変更禁止。

---

## 4. Environment Variables

**サーバプロセスのみが読む。ブラウザへは 1 つも渡らない。**

| 変数 | 必須 | 用途 |
| ---------------- | -------- | ------------------------------------------------------------------------------- |
| `GEMINI_API_KEY` | **必須** | 画像解析。未設定だと `/api/analyze` が 503 を返し、画面は仕込みデータへ退避する |
| `GEMINI_MODEL` | 任意 | 解析モデルの上書き。省略時 `gemini-3.5-flash-lite` |
| `PORT` | 任意 | 待ち受けポート。省略時 3000 |

キーの取得は https://aistudio.google.com/apikey 。雛形は [../.env.example](../.env.example)。

**secret を本ドキュメントや `.env.example` に書かないこと。** `.env` は `.gitignore` 済み。
`index.html` / `data.js` / `js/*.js` はブラウザへ配信されるため、**絶対にキーを書かない。**

`server.js` は `.env` や `server.js` 自身がブラウザから取得されないよう、
ドットファイルと `server/` `node_modules/` `package*.json` の配信を拒否している。
