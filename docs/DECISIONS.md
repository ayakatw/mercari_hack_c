# DECISIONS

このリポジトリの設計判断の記録（ADR-lite）。**新しい判断をしたら追記する。**

出典が要件定義書のものは `specs/推しポート要件定義.md` の該当節を示す。**コードから理由が読み取れないものは推測で埋めず `Reason not documented yet.` と書く。**

---

## Decision: ビルド工程を持たず、素の HTML / CSS / JS で作る

**Status**: Accepted
**Date**: 2026-09-01（要件定義書 §6 で確定）

### Context

ハッカソンのデモ用プロトタイプで、締切は当日 13:00。成果物は 90 秒の録画デモと、審査員がブラウザで触れる実物。リリースはしない。

### Decision

バンドラ・トランスパイラ・パッケージマネージャを一切導入しない。`index.html` を開けば動く状態を保つ。

### Why

- ビルドが壊れた瞬間にデモが止まる。締切直前の環境トラブルが最大のリスク
- 4 人が並行編集するため、ビルド設定の共有・同期のコストを避けたい
- 静的ファイルのみなら会場の PC でも `open index.html` で確実に動く

### Alternatives

Vite + React 等の一般的な構成。却下理由は上記のリスクに対して得るものが少ないため（拡張性・型安全性はこのプロジェクトでは評価されない）。

### Consequences

- lint / typecheck / test / build のコマンドが存在しない。品質の担保は目視と `node --check` に頼る
- npm パッケージを使えない。Chart.js は CDN で読む
- `const` / アロー関数等も使えるが、既存コードが `var` + `function` で統一されているため、混在を避けるルールを [../AGENTS.md](../AGENTS.md) に置いた

---

## Decision: ES modules を使わず、`window` グローバル名前空間で協調する

**Status**: Accepted
**Date**: 2026-09-01（要件定義書 §6）

### Context

ビルドなしで複数ファイルに分割する必要がある。デモ環境では `file://` での直開きもあり得る。

### Decision

全ファイルを IIFE でラップし、`window.AppState` / `window.Screens` / `window.Router` と `data.js` の定数群を介して連携する。`index.html` の `<script>` タグの順序で依存を固定する。

### Why

`type="module"` は `file://` で CORS エラーになり、ローカルサーバなしでは動かない。

### Alternatives

ローカルサーバ必須にして ES modules を使う。却下理由は「会場の PC で確実に開ける」ことを優先したため。

### Consequences

- 読み込み順が依存関係そのもの。`index.html` の script 順は変更禁止
- グローバル汚染が起きるが、名前空間を 3 つ（`AppState` / `Screens` / `Router`）+ データ定数に限定して許容する
- 静的解析ツールが依存関係を追えない。境界は文書（AGENTS.md）とレビューでのみ担保される

---

## Decision: 画面間の直接参照を禁止し、`state.js` を唯一の状態変更点にする

**Status**: Accepted
**Date**: 2026-09-01（要件定義書 §6）

### Context

4 人が同時に別々の画面を実装する。

### Decision

各 `screen-*.js` は `Screens.<route> = { render, bind?, afterRender? }` を登録するだけで、他の screen を参照しない。状態の変更は `AppState` のミューテータ経由に限る。

### Why

画面ファイル同士が独立していれば、並行編集で衝突しない。状態変更が 1 ファイルに集まっていれば、値がおかしいときの調査範囲が `state.js` に限定される。

### Alternatives

Reason not documented yet.

### Consequences

- 画面をまたぐ機能（投稿 → 資産タブへの反映など）は必ず state を経由するため、追加時は `state.js` を触ることになり、そこだけが競合点になる
- 状態が変わるたび全画面を `innerHTML` で再描画する。DOM 参照を跨いで保持できない

---

## Decision: AI をデモ中に呼び出さず、認識結果を `data.js` に焼き込む

**Status**: ~~Accepted~~ → **Superseded**（2026-09-01「Gemini をライブ呼び出しする」により置き換え）
**Date**: 2026-09-01（要件定義書 §0, §6, §8-8）

> **この判断は後で覆された。** 現在は投稿フローで Gemini を実際に呼び出す。
> ただし失敗・遅延時に `AI_RESULTS` へ退避する仕組みは残っており、
> 本節が挙げたリスクへの備えとしていまも機能している。詳細は末尾の新しい判断を参照。

### Context

デモの見せ場が「祭壇写真の一括認識」と「2 個目の検出」であり、そこが失敗すると発表が成立しない。

### Decision

Gemini 等のライブ呼び出しを行わない。`gemini.js` は作らない。認識結果は `AI_RESULTS` に定数として持ち、`setTimeout` 1.5 秒のスピナーで解析中の演出だけを行う。Gemini での検証は開発中に手動で実施し、スクリーンショットを Q&A 用に保存する。

### Why

会場の回線・API のレイテンシ・レート制限・レスポンスのぶれのいずれかでデモが止まるリスクを、演出の説得力より重く見た。

### Alternatives

デモ中に実際に API を呼ぶ。却下理由は上記。

### Consequences

- API キーも環境変数も不要になり、鍵の漏洩リスクが消えた
- 「AI は本当に動くのか」という質問には、コードではなく検証スクショで答える必要がある（想定 Q&A に記載済み）
- 認識結果は画像ファイル名がキー。実写に差し替える場合は `AI_RESULTS` のキーを合わせる（`.svg` / `.jpg` の別名は登録済み）

---

## Decision: 状態を永続化しない

**Status**: Accepted
**Date**: 2026-09-01（要件定義書 §6）

### Context

デモは録画とその場の操作。ユーザーのデータを跨いで保持する必要がない。

### Decision

`localStorage` / `sessionStorage` / Cookie を使わない。状態はインメモリのみで、リロードすると必ずチュートリアルの最初から始まる。

### Why

リロードで確実に初期状態へ戻るため、デモを何度でも同じ手順でやり直せる。

### Alternatives

Reason not documented yet.

### Consequences

- デモのリハーサルが容易。逆に、作業中に画面を確認するときは毎回チュートリアルを通す必要がある
- 特定画面を直接開く URL は存在しない。開発中は DevTools から `AppState.setRoute('assets')` 等で飛ぶ

---

## Decision: 金額は本人の画面にのみ表示する

**Status**: Accepted
**Date**: 2026-09-01（要件定義書 §1 UX 原則 2, §8-1）

### Context

推し活グッズに値札が付いて見えることへの心理的な抵抗が、プロダクトの前提を壊しかねない。

### Decision

相場・総額は資産タブ・通知・投稿フォームなど本人の画面にのみ出す。ホーム TL・プロフィール・マイページなどの公開面には出さない。例外は本人が任意で生成する「祭壇カード」のみ。

### Why

売却圧を本命グッズにかけない、というプロダクトの根幹。公開面に金額が出ると「推しを換金している」体験になる。

### Alternatives

Reason not documented yet.

### Consequences

新しい画面や UI を足すとき、その画面が公開面か本人画面かを先に判断してから金額表示の可否を決める必要がある。

---

## Decision: チュートリアルの通過条件を「缶バッジ 2 個かつ合計 ¥81,000」で固定する

**Status**: Accepted（ただし実装に既知の問題あり）
**Date**: 2026-09-01（要件定義書 §2.7, §3.3）

### Context

「AI の候補を人が確認して確定させる」という思想を見せるため、チュートリアルでユーザーに 1 箇所だけ個数を直させる。確定後の総額は ¥81,000 に固定する必要がある（以降のデモの数値が全てここから積み上がるため）。

### Decision

`js/state.js` の `confirmTutorialItems()` で、`counts['stella-badge'] === 2` かつ合計が `81000` のときのみ次へ進める。満たさない場合はトーストを出して止める。

### Why

数値がずれると、投稿後の ¥84,200 や資産タブの表示がデモ台本と食い違う。

### Alternatives

Reason not documented yet.

### Consequences

- 初期値は全 7 件が 1 個で ¥74,500。缶バッジ（¥6,500）を 1 回 ＋ すると ちょうど ¥81,000 になり通過できる
- **既知の問題**: 2 つの失敗条件に同じトースト文言を出しているため、缶バッジ以外の個数を増やしたユーザーは「缶バッジを 2 個にしてください」と言われ続けて詰む（缶バッジは既に 2 個なので直しようがなく、他を 1 個に戻す必要があることが画面から分からない）。台本どおりの操作では踏まない。対応は [../TASKS.md](../TASKS.md) の Backlog
- `data.js` の価格を変えると通過条件が成立しなくなる。価格変更時は `81000` の定数も合わせる必要がある

---

## Decision: Tailwind Play CDN を読み込んでいるが実際には使っていない

**Status**: Accepted（現状の記録。積極的な決定ではない）
**Date**: 2026-09-01（コードから確認）

### Context

要件定義書 §6 に「CDN: Tailwind + Chart.js」とある。

### Decision

`index.html` は Tailwind Play CDN を読み込んでいる。一方、スタイルは `styles.css`（189 クラス、独自リセット込み）が全て担っており、**Tailwind のユーティリティクラスはコード中に 1 件も使われていない**。

### Why

Reason not documented yet. 当初 Tailwind で書く前提だったが、実装が手書き CSS に寄った結果と思われるが、記録がない。

### Alternatives

削除する / 実際に使う。**未判断。**

### Consequences

- 使っていない CDN スクリプトを 1 本読んでいる
- Tailwind Play CDN は読み込み時に Preflight（CSS リセット）を注入するため、**外すと見た目が変わる可能性がある。未検証**
- オフライン耐性を上げたい場合、この 1 行の除去可否の検証が先に必要（[demo-check skill](../.agents/skills/demo-check/SKILL.md)）

---

## Decision: Gemini をライブ呼び出しする（最小バックエンドを追加）

**Status**: Accepted
**Date**: 2026-09-01

### Context

「AI をデモ中に呼び出さず、認識結果を `data.js` に焼き込む」で決めた仕込みデータ方式では、
どんな写真を撮っても「ステラ アクリルスタンド」しか出ない。
デモの訴求が「AI が商品を認識して出品情報を作る」ことである以上、
実際に動いて見えることを優先する判断に切り替えた。

### Decision

投稿フロー（`Screens.post`）の画像解析だけを Gemini の実呼び出しにする。
API キーをブラウザへ出せないため、静的配信を兼ねる最小の Node サーバ（`server.js`）を追加する。

- `POST /api/analyze` … multipart で画像を受け、出品情報を JSON で返す
- プロンプトと JSON Schema は `server/gemini.js` に置く（サーバ側で管理）
- 公式 SDK `@google/genai` を使い、Structured Output で応答形式を固定する
- キーは `GEMINI_API_KEY`。`.env` は `.gitignore` 済み

**チュートリアルの祭壇スキャンは仕込みデータのまま**にした。
あちらは「合計 ¥81,000 ちょうど・缶バッジ2個」を関門にしてデモが進む作りで、
実結果に置き換えると関門が成立しなくなるため。

### Why

解析が落ちても既存フローが壊れない退避経路（`AI_RESULTS`）を残せる見通しが立ったため、
旧判断が避けたかったリスクを負わずにライブ呼び出しの説得力を得られると判断した。

### Alternatives

- 仕込みデータのまま続ける → 撮った物と表示が一致せず、デモの主張が成立しない
- フロントから直接 Gemini を呼ぶ → API キーがブラウザに露出するため却下

### Consequences

- **フロントはビルド工程なしのまま**だが、`npm install` / `npm start` が必要になった。
  `file://` 直開きでも動くが、その場合 `/api/analyze` に届かず仕込みデータへ退避する
- `js/state.js` に初めて `fetch` と Promise が入った（従来は `setTimeout` の演出のみ）
- 撮った商品が既存グッズと同定されなければ、新規資産として `state.items` に追加される。
  相場は Gemini の `estimatedPrice` を使う（既存グッズに同定された場合は既存の相場を優先）
- API キーの管理責任が発生した。`.env` を絶対にコミットしないこと

---

## Decision: 画像解析には lite 系モデルを使い、タイムアウトで打ち切る

**Status**: Accepted
**Date**: 2026-09-01

### Context

Gemini 側の負荷でモデルの応答時間が大きく振れる。実測で `gemini-3.6-flash` が
同じ画像に対し **2.2 秒のときと 81.9 秒のとき**があった。
デモ中に数十秒待たされるのは成立しない。

### Decision

主モデルを `gemini-3.5-flash-lite`（実測 1.6〜1.9 秒）にする。
SDK は遅いだけでは失敗しないため、`server/gemini.js` 側でタイムアウトを実装する
（主 12 秒 → 退避先 `gemini-3.1-flash-lite` 20 秒）。
`GEMINI_MODEL` 環境変数で上書きできる。

### Why

デモでは精度より速度が効く。lite 系でも出品情報の生成には実用上足りている。

### Consequences

- 当日 Gemini が空いていれば `GEMINI_MODEL=gemini-3.6-flash` の方が結果は良い
- 両モデルとも落ちた場合は 502 を返し、フロントは仕込みデータへ退避する
- **モデル名は陳腐化が速い。** `gemini-2.5-flash` は開発中に提供終了して 404 を返すようになった。
  動かなくなったら `GET https://generativelanguage.googleapis.com/v1beta/models` で現行モデルを確認する
