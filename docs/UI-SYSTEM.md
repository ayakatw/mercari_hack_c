# UI-SYSTEM

推しポート本体（出品モックを除く全画面）のタイポグラフィ・余白・シェイプ・モーションの決まり。**色は扱わない** — 色は `js/theme.js` と `styles.css` の `[data-theme]` ブロックが管理する別系統。

アイコンは [ICONS.md](ICONS.md)、出品モックは [LISTING-DESIGN.md](LISTING-DESIGN.md)。

---

## 0. 適用範囲

| 対象 | 本ドキュメントのスケール |
| --- | --- |
| ホーム / 探す / プロフィール / 投稿 / 資産 / マイページ / チュートリアル | **適用する** |
| 出品モック（`.ml-*` / `.mercari-*`） | **適用しない。** 実物メルカリの完コピであり、意図的に別アプリの見た目を持つ |
| スマホ枠（`.phone-frame` / `.phone-speaker`） | 適用しない。アプリ外の演出 |
| 色・影の色相 | 適用しない。テーマ側の管轄 |

---

## 1. 左右インセット: 16px

**画面の左右余白は 16px。** ここが揃っていないと、タブを切り替えるたびに本文の開始位置が数 px 動いて画面がガタつく。

以前は `0, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20px` の **14 種類**が混在していた。16px は 8pt グリッドに乗り、iOS の標準画面マージン（16pt）とも一致する。

適用済み: `.feed-intro` / `.feed-card` / `.search-faux` / `.topic-chips` / `.portfolio-hero` / `.asset-section-head` / `.asset-list` / `.my-profile` / `.post-select-wrap` / `.post-form-scroll` / `.tutorial-welcome` / `.tutorial-head` / `.shrine-upload` / `.tutorial-tip` / `.shrine-scan` / `.review-hint` / `.recognition-list` / `.review-footer` / `.tutorial-value`

**例外**: `.explore-grid` は 0px。写真を画面端まで敷き詰めるのは意図した演出なので残す。ただし前後の `.search-faux` / `.topic-chips` は 16px に揃えてある。

---

## 2. タイポグラフィ

### 下限は 9px

**7px を本文・注記に使わない。** 390px 幅で日本語の漢字を 7px で描くとストロークが潰れる。免責文（`.asset-footnote` / `.chart-disclaimer`）や「メルカリのあんしん取引へ移動します」のような文章が 7px だった。すべて 9px 以上に引き上げ済み。

**唯一の例外**は `.status-bar .battery`（`●` 1文字の装飾）。文字を読ませる要素ではないので 7px のまま。

### `<p>` の本文は 10px 以上

`.asset-section-head p` / `.share-copy p` / `.recognition-status p` / `.review-hint p` / `.recognition-copy p` / `.asset-copy p` が 8px だった。10px に引き上げ済み。

### 行送り

見出し 20 個のうち **17 個に `line-height` が無く**、UA 既定の `normal`（約 1.15）に落ちていた。日本語では詰まって見える。

```css
h1, h2, h3 { line-height: 1.3; }
.value-copy h1, .portfolio-hero > h2 { line-height: 1.1; }  /* 金額の1行表示 */
```

個別に指定しているルール（`.post-lead h2` の 1.35 等）はクラス詳細度で勝つため影響を受けない。

### 日本語の折り返し

指定が **1 件も無かった**。

```css
body { line-break: strict; overflow-wrap: break-word; }
h1, h2, h3 { text-wrap: balance; }   /* 2行見出しの行長を揃える */
p { text-wrap: pretty; }
```

`text-wrap` は未対応ブラウザでは単に無視される。手動 `<br>` が 7 箇所（マイページ 1 / チュートリアル 3 / 投稿 3）残っており、**フォントサイズを変えると崩れる**。

### 字間

**日本語の文章に見出し級のトラッキングを当てない。**

| 箇所 | 変更前 | 変更後 | 理由 |
| --- | --- | --- | --- |
| `.feed-intro p` | 0.05em | 0.02em | 本文段落に見出し級の字間が掛かっていた |
| `.review-head > div > span` | 0.13em | 0.04em | 「7件を認識しました」という文章にバッジ用の値が転用されていた |

英字ラベル（`.top-app-bar .eyebrow` の 0.16em 等）の広いトラッキングは欧文の慣習として妥当なので残す。

### ブランド表記

**「推しポート」の字間は 0.09em。** 3 画面で 0.09 / 0.08 / 0.11em とバラバラだった（`.wordmark` / `.share-brand` / `.welcome-logo`）。

**未解決**: 同じ「推しポート」の `font-weight` が画面によって 800 / 900 / 900 と割れている。800 と 900 の使い分けに規則性は見つからなかった。

### 明朝体

`.feed-intro h2` / `.post-lead h2` / `.welcome-copy h1` とポートフォリオの装飾に Hiragino Mincho ProN が当たっている。日本語では感情的な見出しに明朝を使うのは正統な作法なので**残す**（欧文の「creative brief = serif」とは事情が違う）。

**未解決**: どの見出しに明朝を当てるかの基準が明文化されていない。同格の `.top-app-bar h1` / `.share-copy h2` / `.review-head h1` はゴシックのまま。

---

## 3. シェイプ

**バッジ・チップは pill（`999px`）。** `.duplicate-badge` / `.listed-badge` だけが `5px` の外れ値だった。他 6 個は元から pill。

| 役割 | 値 |
| --- | --- |
| 円（アバター / アイコンボタン / ドット） | `50%` |
| バッジ・チップ・主要 CTA | `999px` |
| ボタン（非 pill） | `12px` |
| カード・パネル | `16px` |
| 入力欄 | `10px` |
| 小サムネイル | `10px` |
| 入れ子の内側要素（`.event-callout` 等） | `12px` |

カードは `14 / 16 / 18 / 20px` の 4 値、ボタンは `8 / 11 / 12px` の 3 値が混在していた。それぞれ 1 値に集約済み。

**未解決**: 影の不透明度に段階が無い（`.05` から `.85` まで実測で 19 種類）。弱・中・強の 3 トークンに集約する余地がある。またライトテーマの影は色相付き、ダークは素の黒という非対称がある（テーマ側の管轄なので触っていない）。

---

## 4. モーション

**すべて `transform` と `opacity` のみを動かす。** `top` / `width` / `height` はレイアウト再計算を起こすので使わない。

| 用途 | 値 |
| --- | --- |
| すべての `transition` の duration | `0.18s ease`（`0.16 / 0.18 / 0.2s` が混在していた） |
| 画面の入場 | `screenEnter 0.22s ease both` |
| タップの押し込み | `scale(0.97)` |

### 画面遷移

**`router.js` が「画面が変わったとき」だけ `.screen-host` に `is-entering` を付ける。**

`render()` はいいね 1 つ、ステッパー 1 押しでも走る。ここで絞らないと**操作のたびに全画面が再アニメーションする**。

画面の同一性は `route` に加えて、screen が任意で実装する **`key(state)`** で判定する。

```js
var screenKey = route + (typeof screen.key === 'function' ? ':' + screen.key(state) : '');
```

`key()` を持つのは `Screens.post`（`post.stage`）/ `Screens.tutorial`（`tutorial.stage`）/ `Screens.listing`（`listing.stage`）の 3 つ。これがないと、投稿フローやチュートリアルの段階が進んでも route が変わらないため演出が出ない。**`key()` は `Screens` 契約の任意メンバー**（[API.md](API.md) §3.2 参照）。

### hover は PC 前提

**`:hover` が 0 件だった。** 審査員は実機ではなく **PC ブラウザ**でこの 390px 枠を触るため、hover が無いとマウス操作で無反応に見える。

色を変えず不透明度だけで応答する。タッチ端末で hover 状態が張り付かないよう `@media (hover: hover) and (pointer: fine)` で囲ってある。

### reduced-motion

`@media (prefers-reduced-motion: reduce)` がワイルドカード + `!important` で全アニメーション・全トランジションを潰している。**新しくアニメーションを足しても自動的にカバーされる。**

---

## 5. タップターゲット

**44×44px を下回るボタンが 13 箇所あった。** 見た目の大きさを変えるとレイアウトが動くため、**疑似要素で当たり判定だけを広げる**（レイアウト影響ゼロ）。

```css
.like-button::after { position: absolute; inset: -9px; content: ""; }
```

適用済み: `.like-button`(26px) / `.modal-close`(29px) / `.settings-close`(22px) / `.back-button`(36px) / `.sell-button`(約25px) / `.stepper button`(34×32px) / `.mini-stepper button`(27×28px)

ステッパーは `±` が近接しているので横の張り出しを `-4px` に抑えてある。

**未解決**: `.switch`（高さ 26px）と `.want-button`（約 29px）は未対応。

---

## 6. 検証状況

`node --check` 全ファイル通過、CSS の波括弧対応 OK、参照画像の MISSING なし。

**ブラウザでの目視は未実施。** 次を必ず見ること。

1. **左右 16px 統一で崩れた画面がないか。** 20 箇所を機械的に変えているので、ここが最大のリスク
2. 画面遷移の入場演出が、**いいねやステッパー操作では再生されない**こと（再生されるなら `key()` の判定が誤っている）
3. 7px → 9px、8px → 10px で**テキストが折り返して 1 行増えていないか**（特に `.asset-footnote` の長い免責文）
4. `h1,h2,h3` の `line-height: 1.3` で見出しの高さが増え、**はみ出した箇所がないか**
5. PC で hover したときの不透明度変化が過剰でないか
6. デモの核が通るか（投稿 → 2個目検出 → 出品 → グッズ一覧タブの「出品中」）
