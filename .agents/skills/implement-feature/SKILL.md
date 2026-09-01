---
name: implement-feature
description: Use when implementing a new feature or screen in the 推しポート demo app. Covers the required reading order, the existing patterns to follow, and the verification steps before reporting done.
---

# implement-feature

このリポジトリで新機能・新画面を実装するときの手順。

## 最重要

**既存アーキテクチャを無視して新しいパターンを勝手に導入しないこと。**

このリポジトリはビルドなし・ES modules なし・`var` と `function` のみ・render は HTML 文字列を返す、という統一された書き方で全ファイルが書かれている。「より良い書き方」を持ち込むと、他のファイルと噛み合わなくなり、並行作業している人の変更と衝突する。改善案は実装せず、報告に書くだけにする。

新しいライブラリ・CDN・npm パッケージも追加しない（サーバの既存 4 つで足りている）。

## 手順

### 1. 読む

1. `AGENTS.md` — 共通ルール。特に Architecture Rules と Coding Rules
2. `TASKS.md` — **自分が触るファイルが他の active タスクに割り当てられていないか確認する。** 割り当てられていたらオーナーと調整してから着手
3. `specs/推しポート要件定義.md` — 該当画面の節。**仕様書にないことは実装しない**
4. `docs/ARCHITECTURE.md` — データフローと境界

### 2. 類似実装を探す

ゼロから設計しない。作るものに一番近い既存ファイルを読んで、その構造をなぞる。

| 作るもの | 参考にするファイル |
| --- | --- |
| 新しい画面 | `js/screen-mypage.js`（最も小さい。render + bind の最小形） |
| 多段階フロー（stage で分岐） | `js/screen-post.js` / `js/screen-tutorial.js` |
| モーダル | `js/screen-assets.js` の `detailModal` と bind のオーバーレイ処理 |
| チャート描画 | `js/screen-assets.js` の `afterRender`（**`render` ではなく `afterRender`**） |
| 状態の追加 | `js/state.js` の `state` オブジェクトとミューテータ群 |

### 3. 実装計画を立てる

着手前に、以下を短く書き出してから始める。

- 触るファイルの一覧（`TASKS.md` に書いたものと一致しているか）
- `state.js` に状態やミューテータを足す必要があるか（足すなら**共有ファイルなので周知が必要**）
- 新しい route を足すか（足すなら `Screens.<route>` の登録と、タブバーに出すかの判断）
- 仕様書に書かれていない細部で、自分が決めることになる点

### 4. 実装する

守る規約（詳細は `AGENTS.md` の Coding Rules）:

- ファイル全体を `(function (global) { 'use strict'; ... }(window));` で包む
- `var` と `function` を使う。`const` / `let` / アロー関数 / テンプレートリテラル / class は使わない
- `render()` は HTML **文字列**を返す。配列 `.join('')` で組み立てる
- イベントは `bind(root)` の中で `data-*` 属性を `querySelectorAll` して登録。インライン `onclick` を書かない
- 状態変更は必ず `AppState` のミューテータに書く。screen から `state` を直接書き換えない
- 他の `screen-*.js` を参照しない
- 金額は `AppState.formatYen()` を通す
- ユーザー入力を HTML に埋めるときは `escapeHtml`（`js/screen-post.js` にある実装をコピーする）
- `data.js` のスキーマを変えない。必要なら変換関数を足す
- 新しい画面ファイルを足したら `index.html` の script タグに追加する（**`router.js` より前**）

**最小限の変更で実装する。** ついでのリファクタ・ついでのアニメーション・ついでの機能追加をしない。

### 5. 検証する

```bash
# 構文チェック
node --check data.js && for f in js/*.js; do node --check "$f" || echo "NG: $f"; done && echo OK

# 参照画像の実在チェック
grep -ohE "assets/img/[A-Za-z0-9_.-]+" index.html data.js js/*.js styles.css \
  | sort -u | while read -r p; do [ -f "$p" ] || echo "MISSING: $p"; done

# ブラウザで確認
npm start                     # → http://localhost:3000
# チュートリアルを飛ばすなら http://localhost:3000/?screen=post
```

ブラウザでは次を必ず見る。

1. 作った画面が表示され、置いたボタンが反応するか
2. **デモの核が壊れていないか**: 投稿タブ → 画像選択 → 投稿 → 「2個目を検出」通知 → 出品ドラフト → 出品する → 資産タブに「出品中」バッジ
3. 資産タブの総額が仕様どおりか（チュートリアル後 ¥81,000 → 投稿後 ¥84,200）
4. DevTools の Console にエラーが出ていないか

リロードすると必ずチュートリアルから始まる。特定画面へ飛ぶには Console で `AppState.setRoute('assets')`。

### 6. 報告する

- **変更したファイルと、それぞれ何を変えたか**
- **動作確認できたこと / 未確認のこと** — ブラウザで見ていないなら「未確認」と書く。推測で「正常に動作します」と書かない
- **仕様になくて自分で決めたこと**を全て列挙
- 壊れている・詰まっている箇所があれば隠さず書く
- 実装しなかった改善案があればここに書く
