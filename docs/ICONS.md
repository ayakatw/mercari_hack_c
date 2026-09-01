# ICONS

このアプリのアイコンの持ち方。ルールは [../AGENTS.md](../AGENTS.md)、判断の経緯は [DECISIONS.md](DECISIONS.md) を参照。

---

## 1. 方針

**アイコンは Ionicons の SVG を markup に直書きする。CDN も npm も使わない。**

`fill` / `stroke` を `currentColor` にしてあるので、`js/theme.js` の 3 テーマ（蒼 / 霞 / 陽）× light / dark の **6 通り全部に自動で追随する**。色を足す必要はない。

### ライセンス

Ionicons は **MIT License**（Copyright (c) 2015-present Ionic, http://ionic.io/）。
埋め込んでいるのはパスデータのみだが、出典表記は `js/router.js` の `ICONS` 定義の直上コメントに置いてある。**このコメントを消さないこと。**

---

## 2. いま SVG 化されているもの

**タブバーの 5 つだけ。** 定義は `js/router.js` の `ICONS`、描画は同ファイルの `icon(name, solid)`。

`ICONS` のキーは Ionicons 名に合わせてあり、ルート名（`assets` など）とは独立している。`tabButton(route, iconName, label, current)` の第 2 引数で紐づける。

| タブ | Ionicons 名 | 非アクティブ | アクティブ |
| --- | --- | --- | --- |
| ホーム | `home` | `home-outline` | `home`（塗り） |
| 探す | `search` | `search-outline` | `search`（塗り） |
| 投稿 | `add` | `add` | 同じ（丸ボタンの中身） |
| グッズ | `cube` | `cube-outline` | `cube`（塗り） |
| マイページ | `person` | `person-outline` | `person`（塗り） |

**非アクティブ = outline / アクティブ = solid** は Ionicons 本来の使い分け。`tabButton()` が `is-active` と同じ判定で出し分ける。

### サイズ

`styles.css` の `.tab-glyph` が持つ。viewBox は `0 0 512 512` 固定。

| セレクタ | サイズ | 線の太さ |
| --- | --- | --- |
| `.tab-glyph` | 24 × 24px | `stroke-width: 32px`（Ionicons 標準） |
| `.post-tab .tab-glyph` | 27 × 27px | `stroke-width: 44px`（グラデ丸ボタンの上で細く見えるため太くした） |

`stroke-width` の px は SVG のユーザー単位なので、512 の viewBox に対する値。表示サイズを変えても線の比率は保たれる。

---

## 3. 追加のしかた

1. https://ionic.io/ionicons で名前を調べる
2. `curl -sfL https://raw.githubusercontent.com/ionic-team/ionicons/main/src/svg/<name>.svg`
3. `<svg>` タグを剥がし、outline 版は `style="fill:none;stroke:#000;…"` 属性を**全部削る**（`icon()` が `<svg>` 側で塗りを指定するため）
4. 中身に `'` が含まれていないことを確認して（Ionicons は `"` を使うので通常は問題ない）、`ICONS` に足す

**やってはいけないこと**: `<svg>` に色を直書きする（テーマに追随しなくなる）／CDN で読む（AGENTS.md の依存追加禁止に抵触）。

---

## 4. まだテキストグリフのままのもの

タブ以外は手を付けていない。**37 種類の記号グリフ**が残っている。

### そのままでよいもの

`✦ ✧ ⋆`（29 / 6 / 5 回）はブランドの装飾で、`js/theme.js` の `THEMES[].deco` もテーマごとに持っている（蒼 `✦✧⋆` / 霞 `❋✼·` / 陽 `✺✵⁕`）。**アイコンではないので SVG 化しない。**

`✓ › ‹ × − ⋯` も一般的な記号で、どのフォントにも入っている。問題ない。

### 差し替えを検討すべきもの

**フォントに存在しない可能性がある記号**。会場の PC で豆腐（□）になるリスクがある。

| グリフ | 実体 | 場所 |
| --- | --- | --- |
| `♡` `♥` | U+2661 / U+2665 HEART SUIT | ホームのいいねボタン、マイページ |
| `⌁` | U+2301 ELECTRIC ARROW | ステータスバーの Wi-Fi 代用（`js/router.js` の `statusBar()`） |
| `▦` `▤` | SQUARE WITH … FILL | マイページのグリッド切替、出品のテンプレート |
| `◎` `◐` `☝` | — | チュートリアル、出品、ホーム |

いずれも `.like-button` などで `font-family: Arial` を指定しているが、**Arial にこれらの字形は無い**。実際は OS のフォント置換に落ちており、何で描かれるかは環境依存。

いいねのハートは Ionicons に `heart` / `heart-outline` があるので置き換えられる。ただし `icon()` は `js/router.js` の IIFE 内にあり、screen からは呼べない。**やるなら `js/icons.js` を新設して `window.Icons` として出し、`index.html` の script に `router.js` より前で足す**（screen 同士の直接参照にはならない）。**未着手。**

### カラー絵文字

`🛡`（ホームのあんしん決済注記）`💐`（出品完了）`✨`（投稿の既定キャプション）は**テーマに追随しない**。ダークで浮く可能性がある。`🛡` と `💐` は意味を持つので、置き換えるなら SVG 化が要る。**未検証。**

---

## 5. 検証状況

`node --check` 通過、`ICONS` の全 10 定義が整形式 SVG であること、`stroke:#000` と `style=` が残っていないことを確認済み。

**ブラウザでの目視は未実施。** 次を必ず見ること。

1. タブ 5 つのサイズと縦位置が揃っているか（旧グリフは字形ごとにベースラインがバラバラだった）
2. アクティブ時に塗りアイコンへ切り替わり、色が `var(--purple)` になるか
3. **3 テーマ × light/dark の 6 通りでアイコンが見えるか**（`theme-test.html` が使える）
4. 投稿タブの `add` が丸ボタンの中で細すぎないか（`stroke-width: 44` で調整済み）
