---
name: fix-bug
description: Use when fixing a bug in the 推しポート demo app. Enforces root-cause analysis before patching and keeps the fix minimal.
---

# fix-bug

このリポジトリのバグを直すときの手順。

## 最重要

**原因が分からないままパッチを重ねないこと。**

「これで直るかもしれない」を試して動いたように見えた修正は、別の場所を壊しているか、たまたま症状が隠れているだけのことが多い。このアプリは状態が変わるたび全画面を再描画するため、1 箇所の変更が別画面に波及しやすい。

原因を特定できない場合は、**推測で修正せずに、調べた範囲と分かっていないことを報告する。**

## 手順

### 1. 症状を確定させる

- 何が起きるか（期待する挙動と実際の挙動）
- どの画面・どの操作か
- 毎回起きるか、条件付きか

### 2. 再現手順を確定させる

**リロードすると必ずチュートリアルから始まる**（永続化していないため）。再現手順は「起動直後から何をクリックしたか」で書く。

```bash
npm start                     # → http://localhost:3000
# チュートリアルを飛ばすなら http://localhost:3000/?screen=post
```

DevTools の Console から状態を直接見られる。

```js
AppState.getState()            // 現在の状態を丸ごと確認
AppState.getState().route      // 今どの画面か
AppState.getState().items      // 個数・出品状態
AppState.setRoute('assets')    // 任意の画面へ飛ぶ（再現の短縮）
```

**再現できないまま直さない。** 再現手順が確定していない段階での修正は、直ったかどうかを判定できない。

### 3. 関連コードを追う

症状の種類から当たりをつける。

| 症状 | 最初に見る場所 |
| --- | --- |
| 表示される数値がおかしい | `js/state.js` の `getTotal` / `getTutorialTotal`、`data.js` の該当アイテム |
| ボタンが反応しない | 該当画面の `bind()`。`data-*` 属性名と `querySelectorAll` のセレクタが一致しているか |
| 操作しても画面が変わらない | ミューテータが `notify()` を呼んでいるか。screen から `state` を直接書き換えていないか |
| 画面遷移しない・戻れない | `js/router.js` の `render`、`AppState.setRoute` |
| 相場が出ない / 出てしまう | `js/screen-goods.js` の `goodsRow`。トグル(`state.showPrices`)と `status === 'listed'` の両方が要る |
| 特定の画面だけ真っ白 | Console のエラー。`Screens.<route>` が登録されているか（未登録だと `Screens.home` にフォールバックする） |
| クリック後に入力内容が消える | ミューテータが `notify()` を呼び、input が再描画で作り直されている |
| 画像が出ない | 参照パスの綴り。下記の実在チェックコマンド |

`js/router.js` は毎回 `innerHTML` を丸ごと置き換える。**DOM 要素への参照を再描画を跨いで保持していると必ず壊れる。**

### 4. 根本原因を特定する

「どの行が、どの条件で、期待と違う値を作っているか」を 1 文で書けるまで掘る。書けないなら、まだ特定できていない。

### 5. 最小の安全な修正を書く

- 原因の行だけを直す。周辺のリファクタをしない
- `AGENTS.md` の Coding Rules に従う（`var` と `function`、render は文字列、状態変更は `state.js`）
- `data.js` のスキーマを変えない
- 症状を隠すだけの修正（try/catch で握りつぶす、条件を緩める）をしない

### 6. リグレッションを確認する

修正した画面だけでなく、影響が波及しうる範囲を見る。

- `state.js` を触った → **全画面**を開き直す
- `data.js` を触った → グッズ一覧の点数、チュートリアルの関門通過（缶バッジ 2 個）、TL のタグ表示
- `router.js` を触った → 全 route の遷移とタブバー
- `styles.css` を触った → クラス名が他画面と共有されていないか（`grep -n "\.クラス名" styles.css js/*.js`）

**デモの核は毎回通す**: 投稿タブ → 画像選択 → 投稿 → 「2個目を検出」通知 → 継承ドラフト → 出品する → グッズ一覧に「出品中」バッジ。

### 7. 検証する

```bash
node --check data.js && for f in js/*.js; do node --check "$f" || echo "NG: $f"; done && echo OK

grep -ohE "assets/img/[A-Za-z0-9_.-]+" index.html data.js js/*.js styles.css \
  | sort -u | while read -r p; do [ -f "$p" ] || echo "MISSING: $p"; done
```

### 8. 報告する

- **症状** / **再現手順** / **根本原因（どの行がなぜ）** / **修正内容**
- 確認したリグレッション範囲と、**確認していない範囲**
- ブラウザで見ていないなら「未確認」と明記する
- 原因が特定できなかった場合は、調べた範囲・除外できた仮説・残っている仮説を書く
