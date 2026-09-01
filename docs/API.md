# API

このリポジトリの API 面をまとめる。全体像は [ARCHITECTURE.md](ARCHITECTURE.md)。

---

## 1. 外部 API: 存在しない

**このアプリは HTTP リクエストを一切発行しない。**

コードで確認した根拠:

- `fetch(` / `XMLHttpRequest` / `axios` — `index.html` `data.js` `js/*.js` に **0 件**
- API キー・トークンを読む箇所 — **0 件**
- 環境変数を参照する箇所 — **0 件**

### AI API について

要件定義書 §6 の決定により、**Gemini 等の AI API はデモ中に呼び出さない。** 該当する実装は存在しない。

| 質問 | 実態 |
| --- | --- |
| model | 呼び出していないため該当なし。開発中の検証は Gemini アプリ / AI Studio で手動実施し、結果をスクショ保存（Q&A 用） |
| prompt 生成箇所 | **存在しない。** `gemini.js` は仕様上「作らない」と決定済み |
| API client | **存在しない** |
| response parsing | **存在しない。** 認識結果は `data.js` の `AI_RESULTS` に定数として焼き込み済み |

「AI が解析中…」の演出は `js/state.js` の `setTimeout` 1500ms（`startTutorialAnalysis` / `startPostAnalysis`）で、その後 `AI_RESULTS` から固定の結果を読むだけ。**AI の失敗・遅延・レート制限はデモ中に発生し得ない。**

`AI_RESULTS` のキーは画像ファイル名。`.svg` と `.jpg` の両方が同じ結果を指すよう別名登録されている（`data.js` 末尾）ため、実写画像へ差し替えてもコード変更は不要。

---

## 2. 外部依存: CDN 2 本

`index.html` の `<head>` で読み込む。**データ取得ではなく描画の補助**にのみ使う。

| # | URL | 用途 | 呼び出し箇所 | 失敗時の挙動 |
| --- | --- | --- | --- | --- |
| 1 | `https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js` | 資産タブの 30 日ライン、詳細モーダルのチャート | `js/screen-assets.js` の `createLineChart()` | **フォールバックあり。** `global.Chart` が未定義なら `drawFallback()` が Canvas 2D で簡易ラインを描く |
| 2 | `https://cdn.tailwindcss.com` | （実質未使用） | なし | **未検証。** 後述 |

### Tailwind Play CDN について

読み込まれてはいるが、**Tailwind のユーティリティクラスはコード中に 1 件も使われていない。** レイアウトは `styles.css`（189 クラス、`* { box-sizing }` と `body { margin: 0 }` の独自リセット込み）が全て担っている。

ただし Tailwind Play CDN は読み込み時に Preflight（CSS リセット）を注入する。**これが外れたときに見た目が変わるかどうかは未検証。** オフライン耐性を確認する場合は、DevTools でこの 1 行をブロックして全画面を目視すること（[demo-check skill](../.agents/skills/demo-check/SKILL.md) 参照）。

---

## 3. Internal API

外部 API がない代わり、**`window` 上のグローバルがモジュール間の契約**になっている。ここを変えると全画面に影響する。

### 3.1 `window.AppState`（`js/state.js`）

状態を変更してよい唯一の入口。screen からはこれだけを呼ぶ。

**購読・参照**

| メソッド | 返り値 | 用途 |
| --- | --- | --- |
| `subscribe(listener)` | 解除関数 | 状態変更時に呼ばれる。`router.js` のみが使用 |
| `getState()` | state オブジェクト（**参照。複製ではない**） | 描画時の読み取り |
| `getItem(itemId)` | item または `null` | 呼び出し側で null ガードが必要 |
| `getUser(handle)` | user または `null` | 同上 |
| `getTotal()` | number | 保有総額 |
| `getTutorialTotal()` | number | チュートリアル画面の合計 |
| `formatYen(value)` | string | `¥84,200` 形式。金額表示は必ずこれを通す |

**ミューテータ**（呼ぶと `notify()` が走り全画面が再描画される）

| メソッド | 効果 |
| --- | --- |
| `setRoute(route)` | 画面遷移。詳細モーダルと祭壇カードを閉じる |
| `openProfile(handle)` | `tappable: true` のユーザーのみプロフィールへ遷移 |
| `startTutorialCapture()` / `startTutorialAnalysis()` | チュートリアルの stage を進める（後者は 1.5 秒後に `review` へ） |
| `adjustTutorialCount(itemId, delta)` | 個数を 1〜5 の範囲で増減 |
| `confirmTutorialItems()` | 条件を満たせば `value` へ。満たさなければトースト |
| `completeTutorial()` | `tutorial.counts` を `items[].count` に反映し資産タブへ |
| `toggleLike(postId)` | いいねのトグル |
| `sendRequest()` | 「欲しい」送信。トーストのみ |
| `startPostAnalysis()` | 1.5 秒後に投稿フローを `result` へ |
| `adjustPostCount(delta)` / `togglePostGiveaway()` / `setPostCaption(caption)` | 投稿フォームの入力（`setPostCaption` のみ `notify()` を呼ばない。理由は明文化されていないが、再描画すると input の値と caret が失われるため意図的と思われる） |
| `submitPost()` | `stella-acsta` の count を加算、`createdPosts` に追加、`complete` へ |
| `resetPost()` | 投稿フォームを初期化 |
| `prepareListing(itemId)` | 出品モックへ遷移。存在しない itemId なら何もしない |
| `submitListing()` | 対象を `status: 'listed'` にして完了画面へ |
| `finishListing()` | 資産タブへ戻る |
| `openAssetDetail(itemId)` | **`stella-card` のときのみ**モーダルを開く（仕様どおり） |
| `closeAssetDetail()` / `setShrineCardOpen(isOpen)` / `shareShrineCard()` | モーダル・シェアの制御 |
| `showToast(message)` | 3.2 秒で自動的に消えるトースト |

### 3.2 `window.Screens`（各 `js/screen-*.js` が登録）

各画面は `Screens.<route> = { ... }` の形で自己登録する。router が route 名で引く。

| キー | 必須 | 契約 |
| --- | --- | --- |
| `render()` | **必須** | HTML **文字列**を返す。DOM を組み立てない。この時点で要素はまだ DOM に無い |
| `bind(root)` | 任意 | `render` の結果が DOM に入った後に呼ばれる。イベント登録はここで |
| `afterRender(root)` | 任意 | `bind` の後に呼ばれる。**Chart.js の生成はここ**（canvas が DOM に入っている必要があるため） |

登録済みの route: `home` / `explore` / `profile` / `post` / `assets` / `mypage` / `tutorial` / `listing`。
未登録の route が指定された場合、router は `Screens.home` にフォールバックする。

### 3.3 `window.Router`（`js/router.js`）

| メソッド | 用途 |
| --- | --- |
| `go(route)` | `AppState.setRoute` の薄いラッパ |
| `render()` | 強制再描画。通常は購読経由で走るので直接呼ぶ必要はない |

### 3.4 `data.js` が公開する定数

`HISTORY_LABELS` / `ITEMS` / `POSTS` / `USERS` / `AI_RESULTS` / `EVENTS`。
**すべて読み取り専用**として扱う。スキーマは要件定義書 §3.2 で固定されており変更禁止。

---

## 4. Environment Variables

**このアプリが必要とする環境変数は 0 件。** 参照箇所がコード中に存在しない。

作業ツリーに `.env`（`DATABASE_URL` / `PORT`）が残っているが、**現在のアプリはこれを読まない。** 別ブランチで試みたバックエンド（`server/`）の残骸で、いまは参照されていない。詳細は [../.env.example](../.env.example)。

**secret を本ドキュメントや `.env.example` に書かないこと。** `.env` は `.gitignore` 済み。
