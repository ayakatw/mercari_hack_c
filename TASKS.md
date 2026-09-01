# TASKS.md

複数の developer / AI agent が並行作業するための軽量タスクボード。

## 運用ルール

- **作業を始める前にこのファイルを読み、自分のタスクを追記する。** Files / directories 欄に触る予定のファイルを書く
- **他の active なタスクに割り当てられたファイルを変更する前に、そのタスクの Owner と調整する。** 無断で触らない
  （Before modifying files assigned to another active task, coordinate with the task owner.）
- 作業が終わったら Status を `Done` にし、**Completed** 節へ移す
- Status は `Not started` / `In progress` / `Blocked` / `In review` / `Done` のいずれか
- 1 タスク = 1 ブランチ = 1 画面 or 1 機能。複数画面を同時に着手しない

## 競合しやすいファイル（要調整）

複数タスクが同時に触ると壊れやすい共有ファイル。ここを変更するタスクは、必ず事前に周知すること。

| ファイル | 理由 |
| --- | --- |
| `js/state.js` | 全画面が依存。状態変更の唯一の経路 |
| `data.js` | スキーマ変更は禁止。値の追加でも複数画面に影響 |
| `index.html` | script 読み込み順が固定。順序を壊すと全画面が動かなくなる |
| `styles.css` | 1 枚で全画面ぶん。クラス名の重複に注意 |

`js/screen-*.js` は画面ごとに独立しているため、別々のタスクが並行して触っても衝突しにくい。

---

# Active Tasks

## Codex

### アバター6点をリアルなSNSプロフィール写真へ差し替え

- **Status**: In progress
- **Owner**: Codex
- **Branch**: current worktree
- **Files / directories**: `assets/img/avatar-*.png`, `data.js`, `js/screen-home.js`, `js/screen-mypage.js`, `assets/photo/README.md`, `docs/DECISIONS.md`
- **Goal**: 既存6ユーザーのイラストアバターに対応する、判別しやすいリアルなSNS風プロフィール写真をImageGenで生成して参照を差し替える

**Notes**: 既存SVGはフォールバック用に残す。共有作業ツリーの既存変更を保持し、対象の画像参照行だけを変更する。

## Haruto + Claude (Fable)

### チュートリアルに推しカラーAI推定UXを追加

- **Status**: In review
- **Owner**: Haruto / Claude Fable
- **Branch**: feat/tutorial-theme-ux（base: feat/listing-mercari-redesign）
- **Files / directories**: `js/screen-tutorial.js`
- **Goal**: 祭壇解析中に「推しカラーを推定中…」を出し、認識結果画面にAI推定verdict+テーマ選択（`Theme.THEMES` / `.theme-option` 再利用、`AppState.setTheme`）を置く。エンジンは `js/theme.js` の data-theme 方式をそのまま使用

**Notes**: 旧4色CSS変数エンジン(feat/personalized-tutorial-theme)はこのdata-theme方式に置き換えられたため破棄予定。ブラウザ検収済み。

## Claude

### タブアイコンの Ionicons 化 + フィードカードの再デザイン

- **Status**: In review
- **Owner**: Claude
- **Branch**: feat/listing-mercari-redesign
- **Files / directories**: `js/router.js`（ICONS 定義・タブバー）, `styles.css`（`.tab-icon` / `.tab-glyph` / `.feed-*`）, `docs/ICONS.md`, `docs/DECISIONS.md`
- **Goal**: タブの記号グリフ（`⌂⌕⌁♙`）を Ionicons の SVG に置き換え、フィードカードを `design/名称未設定.png` に寄せる

**Notes**: **ブラウザ未確認。** 確認すべき点は [docs/ICONS.md](docs/ICONS.md) §5 と [docs/DECISIONS.md](docs/DECISIONS.md) の該当節。
`js/theme.js` 等、別エージェントの変更が同じ作業ツリーに未コミットで同居している。**`git checkout` で戻すと相手の作業も消えるので使わないこと。**

---

<!-- 以下をコピーして使う -->

## <Developer / Agent name>

### <Task name>

- **Status**: Not started
- **Owner**:
- **Branch**:
- **Files / directories**:
- **Goal**:

**Notes**:

---

# Backlog

担当者未定。着手する人はここから Active Tasks へ移す。

### チュートリアルの確定ボタンのトースト文言が誤解を招く

- **Status**: Not started
- **Owner**: 未定
- **Branch**: 未定
- **Files / directories**: `js/state.js`
- **Goal**: `confirmTutorialItems` が 2 つの失敗条件（缶バッジが 2 個でない / 合計が ¥81,000 でない）に同一のトーストを出しているため、缶バッジ以外の個数を増やしたユーザーが「缶バッジを 2 個にしてください」と言われ続けて先へ進めない。条件ごとにメッセージを分ける

**Notes**: 再現手順とコード位置は [docs/DECISIONS.md](docs/DECISIONS.md) の「チュートリアルの通過条件」を参照。デモ台本どおりに操作すれば踏まないため、優先度は低い。

---

# Completed

（完了したタスクをここへ移す）

## Claude

### 出品モックを実物メルカリのダークUIに完コピ

- **Status**: Done
- **Owner**: Claude
- **Branch**: main
- **Files / directories**: `js/screen-listing.js`, `styles.css`（`/* Mercari listing */` セクション全面 + `.status-bar.mercari-status` + `.mercari-runtime .home-indicator`）, `specs/推しポート要件定義.md`（§2.6 改訂）, `docs/DECISIONS.md`
- **Goal**: 自作の赤ヘッダー版だった出品モックを、実物メルカリの出品画面（ダーク）と出品完了モーダル（ライト）に完コピする。値は空にせず必ずプレフィルしたまま

**Notes**: 判断の根拠は [docs/DECISIONS.md](docs/DECISIONS.md) の「出品モックを実物メルカリのダークUIに完コピし、赤ヘッダーを廃止する」。仕様書 §2.6 は実装に合わせて改訂済み。**ブラウザでの目視は未実施（このセッションではブラウザを操作できなかった）。** 構文チェック・参照画像チェック・Node 上での render 実行・全7アイテムでのフォーム生成は確認済み。
