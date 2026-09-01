# ARCHITECTURE

このリポジトリのコードを初めて読む人・AI agent 向けの全体像。ルールは [../AGENTS.md](../AGENTS.md)、仕様は [../specs/推しポート要件定義.md](../specs/推しポート要件定義.md) を参照。

---

## 1. System Overview

**ビルド工程を持たない単一ページの静的アプリ。** `index.html` を開くと、素の `<script>` タグで 10 本の JS が順に読み込まれ、`window` 上のグローバルを介して協調する。サーバもデータベースも外部 API 呼び出しも存在しない。

390×844 のスマートフォン枠（CSS で描画したベゼル）を PC ブラウザの中央に置き、その中だけを 1 つのアプリとして描画する。

### 主要コンポーネント

| コンポーネント | 実体 | 責務 |
| --- | --- | --- |
| データ層 | `data.js` | 仕込みデータを `window` に公開。読み取り専用の定数 |
| 状態層 | `js/state.js` | `window.AppState`。アプリ状態の保持と、状態を変更する全メソッド。DOM に触れない |
| 画面層 | `js/screen-*.js` | `window.Screens.<route>` に `{ render, bind?, afterRender? }` を登録 |
| ルータ層 | `js/router.js` | 現在の route に対応する画面を描画。タブバー・ステータスバー・トーストの共通クロームを担当。最後に読み込まれ、起動も行う |
| スタイル | `styles.css` | 全画面ぶんの CSS。独自リセットを含み自己完結 |

---

## 2. Directory Structure

```
index.html              エントリポイント。script 読み込み順を固定
styles.css              全画面ぶんの CSS（189 クラス）
data.js                 ITEMS / POSTS / USERS / AI_RESULTS / EVENTS / HISTORY_LABELS
js/
├── state.js            AppState（状態 + 全ミューテータ）
├── router.js           描画ループと共通クローム。起動担当
├── screen-home.js      Screens.home / Screens.explore / Screens.profile
├── screen-post.js      Screens.post
├── screen-assets.js    Screens.assets（Chart.js 使用）
├── screen-mypage.js    Screens.mypage
├── screen-tutorial.js  Screens.tutorial
└── screen-listing.js   Screens.listing
assets/img/             グッズ・アバター画像（SVG 17 枚）
specs/                  要件定義書（仕様の唯一の正）
design/                 デザインカンプ・ワイヤーフレーム。アプリからは参照されず実行もされない
docs/                   本ドキュメント群
.agents/skills/         タスク別ワークフロー
```

---

## 3. Data Flow

状態が変わると**画面全体を再描画する**。差分更新は行わない。

```
ユーザー操作（クリック / 入力 / file 選択）
   │
   ▼
screen-*.js の bind() で登録したハンドラ
   │   （data-* 属性を querySelectorAll して addEventListener）
   ▼
AppState.<ミューテータ>()          ← 状態を変更してよい唯一の場所
   │   例: toggleLike / submitPost / prepareListing
   ▼
notify()  →  購読者を全て呼ぶ
   │
   ▼
router.js の render()
   │   1. state.route から Screens.<route> を取得
   │   2. screen.render() が返す HTML 文字列を #app に innerHTML で差し込む
   │   3. bindNavigation(app) でタブバーを結線
   │   4. screen.bind(app) で画面固有のイベントを結線
   │   5. 同一 route なら .screen-scroll のスクロール位置を復元
   │   6. screen.afterRender(app) を呼ぶ（Chart.js の生成はここ）
   │   7. renderToast(state) でトーストを描画
   ▼
DOM 更新
```

### 起動シーケンス

`router.js` の末尾で `AppState.subscribe(render)` してから `render()` を 1 回呼ぶ。初期 route は `state.js` の `route: 'tutorial'`。

### 注意点

- `render()` は毎回 `innerHTML` を丸ごと置き換える。**DOM 要素への参照を跨いで保持しない**
- `render()` の時点では canvas はまだ DOM に入っていない。**Chart.js の生成は必ず `afterRender` で行う**
- スクロール位置は `.screen-scroll` クラスを持つ要素からのみ復元される

---

## 4. External API Integration

**外部 HTTP API の呼び出しは 1 件も存在しない。** 詳細と根拠は [API.md](API.md)。

- AI（Gemini 等）の**ライブ呼び出しはない**。「AI が解析中…」は `setTimeout` 1.5 秒の演出で、認識結果は `data.js` の `AI_RESULTS` にハードコードされている
- 唯一の外部依存は `index.html` が読む CDN 2 本（Chart.js、Tailwind Play CDN）

```
Browser
   │
   ├── index.html / styles.css / js/*.js / assets/img/*  ← すべてローカル
   │
   └── CDN（描画の補助のみ。データ取得はしない）
        ├── cdn.jsdelivr.net  … Chart.js 4.4.7   ← 失敗時は自前の drawFallback へ退避
        └── cdn.tailwindcss.com … Tailwind Play  ← 実質未使用（ユーティリティクラス 0 件）
```

---

## 5. State Management

単一の可変オブジェクト + 購読者リスト。ライブラリなし。

`state.js` の `state` が保持するキー:

| キー | 意味 |
| --- | --- |
| `route` | 現在の画面。`tutorial` / `home` / `explore` / `profile` / `post` / `assets` / `mypage` / `listing` |
| `tutorialComplete` | チュートリアル完了フラグ |
| `tutorial` | `{ stage, selected, counts }`。stage は `welcome` → `capture` → `analyzing` → `review` → `value` → `done` |
| `items` | 保有アイテム。`ITEMS` から `pendingDemo` を除いた**クローン**。個数・出品状態はここを更新する |
| `likedPosts` | postId → boolean |
| `requestSent` | 「欲しい」送信済みフラグ |
| `selectedProfile` | 表示中の他人プロフィールの handle |
| `post` | `{ stage, selected, count, giveaway, caption }`。stage は `select` → `analyzing` → `result` → `complete` |
| `createdPosts` | 投稿フローで作られた投稿（マイページのグリッドに反映） |
| `postedDemo` | デモ投稿済みフラグ |
| `listing` | `{ itemId, stage }`。stage は `form` / `success` |
| `assetDetailItemId` | 資産詳細モーダルの対象。`stella-card` のみ開く |
| `shrineCardOpen` | 祭壇カードモーダルの開閉 |
| `toast` | `{ message, token }`。3.2 秒後に token 一致なら自動で消える |

**永続化しない。** リロードで全て初期状態に戻り、必ずチュートリアルから始まる。

### 派生値（保存せず都度計算する）

- `getTotal()` — `items` の `marketPrice × count` の総和。資産タブのヘッダーと祭壇カードが使う
- `getTutorialTotal()` — `AI_RESULTS['saidan.svg']` の `price × tutorial.counts` の総和

---

## 6. Important Boundaries

| 境界 | ルール | 破ると起きること |
| --- | --- | --- |
| screen ↔ screen | **直接参照しない。** `AppState` 経由のみ | 並行編集で衝突する。読み込み順に依存した壊れ方をする |
| screen → 状態 | **書き換えない。** 変更は `AppState` のミューテータ経由 | 再描画が走らず画面が更新されない |
| `state.js` → DOM | **触らない。** `document` 参照は現在 0 件 | 描画タイミングに依存したバグが状態層に漏れる |
| `data.js` のスキーマ | **変更しない。** 変換関数で対応する | 同じ形を前提にした他画面が全滅する |
| script 読み込み順 | `data.js` → `state.js` → `screen-*.js` → `router.js`。**変えない** | 起動時に未定義参照で落ちる |
| モジュール形式 | **ES modules を導入しない** | `file://` 直開きが CORS で動かなくなる |
| 外部通信 | **新規に足さない** | 会場の回線障害でデモが止まる |

### 現状の読み取り依存（許容されている直読み）

screen は以下のグローバルを**読み取りのみ**直接参照している。書き換えは禁止。

| ファイル | 直読みしているデータ |
| --- | --- |
| `screen-home.js` | `POSTS` |
| `screen-assets.js` | `HISTORY_LABELS` |
| `screen-post.js` | `AI_RESULTS` |
| `screen-listing.js` | `AI_RESULTS` |
| `screen-tutorial.js` | `AI_RESULTS` |
| `screen-mypage.js` | （なし） |

---

## 7. Feature 間の依存関係

画面は独立しているが、**共有 state を通じて一方向に影響する**。下図の矢印は「左の操作が右の表示を変える」。

```
チュートリアル ──（items[].count を確定）──▶ 資産タブ（総額 ¥81,000）
                                              │
投稿フロー ──（stella-acsta の count +1）─────┤ 総額 ¥84,200 / ×2 バッジ
     │                                        │
     └──（createdPosts に追加）──▶ マイページのグリッド
     │
     └──（prepareListing）──▶ 出品モック ──（status='listed'）──▶ 資産タブ「出品中」バッジ
                                  ▲
資産タブの [売る] ボタン ──────────┘
（詳細モーダルの [売る] も同じ入口）

ホーム TL ──（openProfile）──▶ 簡易プロフィール    ※ tappable な mio_stella のみ
探す ── 静的グリッド。他画面へ影響しない
マイページ ──（getTotal を読む）── 祭壇カードの金額
```

### デモの核（絶対に壊してはいけない経路）

```
投稿タブ → 画像選択 → AI 結果カード → 投稿 → 「2個目を検出」通知カード
        → [出品ドラフトを見る] → メルカリ風出品モック → 出品する
        → 資産タブに「出品中」バッジ
```

この経路に関わるのは `screen-post.js` / `screen-listing.js` / `screen-assets.js` と `state.js` の
`startPostAnalysis` / `submitPost` / `prepareListing` / `submitListing` / `finishListing`。

### 数値の整合（仕様で固定。変更するとデモ台本と食い違う）

| 場面 | 値 | 根拠 |
| --- | --- | --- |
| チュートリアル確定後の総額 | ¥81,000 | 7 アイテム、缶バッジのみ 2 個 |
| デモ投稿で加算 | +¥3,200 | ステラ アクリルスタンドの相場 |
| 投稿後の総額 | ¥84,200 | 資産タブヘッダーの表示と一致させる |
| 急騰イベント | 8/21 +18% | ステラのトレカ。チャートにマーカー |
