# AGENTS.md

このリポジトリで作業する全 AI coding agent の共通ルール。**作業開始前に本ファイルと [TASKS.md](TASKS.md) を必ず読むこと。**

---

## Project Overview

**推しポート** — ハッカソン（Mercari Hack Team C）のデモ用プロトタイプ。推し活グッズの投稿がそのまま資産ポートフォリオになり、重複グッズだけメルカリ出品へ誘導する推し活 SNS のモックアプリ。

- **リリースしない。** 審査員に見せる 90 秒デモと、ブラウザで触れる実物が成果物
- 仕様の唯一の正: [specs/推しポート要件定義.md](specs/推しポート要件定義.md)
- 動いて見えることが最優先。設計の美しさ・拡張性・網羅性は評価されない

---

## Tech Stack

コードから確認した実態（推測なし）。

| 項目 | 実態 |
| --- | --- |
| 言語 | 素の JavaScript（ES5 相当の書き方。`var` + `function`）、HTML、CSS |
| ビルド | **なし。** バンドラ・トランスパイラ・package.json すべて不在 |
| モジュール | **ES modules 不使用。** 素の `<script>` + `window` グローバル名前空間 |
| 依存 | CDN 2 本のみ: Chart.js 4.4.7（資産チャート）、Tailwind Play CDN（**実質未使用**、後述） |
| CSS | `styles.css` 1 枚の手書き（189 クラス）。独自リセット込みで自己完結 |
| バックエンド | **なし。** DB なし、HTTP API 呼び出しゼロ、環境変数ゼロ |
| 状態 | インメモリのみ。`localStorage` 等の永続化なし（リロードで初期化） |
| パッケージマネージャ | **なし** |
| lint / typecheck / test / build | **いずれも未整備。**「Commands」節の代替手段を使う |

`node_modules/`、`server/`、`.env` が作業ツリーにあるが、**いずれも現在のアプリは参照していない**（別ブランチの残骸）。触らないこと。

---

## Repository Structure

```
index.html            エントリポイント。script の読み込み順を固定（変更禁止）
styles.css            全画面ぶんの CSS（189 クラス）
data.js               仕込みデータ。ITEMS / POSTS / USERS / AI_RESULTS / EVENTS
js/
├── state.js          唯一の状態保持と更新。DOM に触れない
├── router.js         画面切替・タブバー・トースト描画。最後に読み込み、起動も担当
├── screen-home.js    ホーム TL / 探す / 簡易プロフィール（Screens.home / .explore / .profile）
├── screen-post.js    投稿フロー（Screens.post）
├── screen-assets.js  資産タブ + Chart.js 描画（Screens.assets）
├── screen-mypage.js  マイページ + 祭壇カード（Screens.mypage）
├── screen-tutorial.js 初回チュートリアル（Screens.tutorial）
└── screen-listing.js メルカリ風出品モック（Screens.listing）
assets/img/           グッズ・アバター画像（SVG）
specs/                要件定義書。仕様の唯一の正
design/               デザインカンプ・ワイヤーフレーム。**アプリ本体とは別物、実行されない**
docs/                 ARCHITECTURE / API / DECISIONS / LISTING-DESIGN
.agents/skills/       タスク別ワークフロー
```

---

## Architecture Rules

依存は一方向。逆流させない。詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

```
index.html (script 読み込み順で依存を固定)
     │
     ▼
data.js          読み取り専用の定数（window.ITEMS 等）
     │
     ▼
state.js         window.AppState — 状態変更はすべてここを経由
     │
     ▼
screen-*.js      window.Screens.<route> に render/bind/afterRender を登録
     │
     ▼
router.js        Screens を呼んで描画。AppState.subscribe(render) で再描画
```

必ず守る境界:

1. **screen-\*.js 同士を直接参照しない。** 画面間のやりとりは `AppState` 経由のみ。4 人並行編集で衝突しないための設計
2. **状態を変更してよいのは `state.js` だけ。** screen から `state.items` や `ITEMS` を直接書き換えない。読み取りは可（`POSTS` / `AI_RESULTS` / `HISTORY_LABELS` は screen が直読みしている）
3. **`state.js` は DOM に触れない。** `document` を参照しないこと（現状 0 件）
4. **`data.js` のスキーマを変更しない。** 複数画面が同じ形を前提にしている。扱いにくい場合はスキーマを変えず変換関数を足す
5. **ES modules / `import` / `export` を導入しない。** `file://` 直開きで動く必要がある
6. **`index.html` の script 読み込み順を変えない。** `data.js` → `state.js` → `screen-*.js` → `router.js`
7. **新しい外部通信を足さない。** HTTP API 呼び出しは現在ゼロ件。会場の回線が不安定でも動く必要がある

---

## Coding Rules

既存コードから確認した慣習。新規コードもこれに合わせる。

- **IIFE でラップする。** 全ファイルが `(function (global) { 'use strict'; ... }(window));` の形
- **`var` と `function` 宣言を使う。** `const` / `let` / アロー関数 / テンプレートリテラル / class は既存コードに 1 件もない。混ぜない
- **render は HTML 文字列を返す。** DOM API で要素を組み立てない。配列 `.join('')` で連結する既存パターンに従う
- **イベントは `bind(root)` 内で `data-*` 属性を `querySelectorAll` して登録。** インライン `onclick` を使わない
- **Chart.js の生成は `afterRender` で。** `render` の時点では canvas が DOM に入っていない
- **命名**: ファイル `screen-<route>.js` / 状態キーと itemId は kebab-case（`stella-acsta`）/ CSS クラスも kebab-case
- **ユーザー入力を HTML に埋めるときは `escapeHtml` を通す**（`js/screen-post.js` に実装あり）
- **金額は `AppState.formatYen()` を使う。** `¥` の手書き連結をしない
- **非同期は `setTimeout` の演出のみ。** Promise / async-await は既存コードに存在しない。AI 解析の 1.5 秒スピナーが唯一の非同期
- **エラーハンドリングは最低限。** 落ちなければよい。ただし `getItem` のように null を返す関数は呼び出し側で必ずガードする

---

## AI Agent Rules

1. 作業開始前に **AGENTS.md と TASKS.md を読む**
2. 変更前に**関連コードを読む**。特に `state.js` と、触る画面の `screen-*.js`
3. **既存の実装パターンを優先する。** 上の Coding Rules に反する「モダンな書き方」を持ち込まない
4. **必要以上の refactor をしない。** 動いているコードの書き換えは、依頼された変更に必要な範囲だけ
5. **タスク外のコードを変更しない**
6. **他の担当者のファイルを不用意に変更しない。** TASKS.md で別タスクに割り当てられたファイルを触る前に、オーナーと調整する
7. **依存を追加しない。** CDN も npm も。既にあるもので書く
8. **secret / API key をコミットしない。** `.env` は `.gitignore` 済み
9. **不明な仕様を大規模実装で補完しない。** 仕様書にないことはやらない。判断が必要なら最も単純な実装を選び、**選んだ内容を報告に列挙する**
10. **嘘の完了報告をしない。** ブラウザで確認できない立場なら「未確認」と書く。「正常に動作します」と推測で書かない
11. **作業の記録を `docs/` に自分で書く。** 許可を求めない。報告は1行で済ませる。粒度と行き先は次節

---

## Documentation Rules

**作業の記録は `docs/` に自分で書く。許可を求めない。報告は1行で済ませる。**

「ドキュメントに書きましょうか?」と聞かない。書いたうえで、報告には `docs/XXX.md に記録` の1行だけ添える。**ドキュメントの中身を報告文に転記しない。**

| 書いたもの | 行き先 |
| --- | --- |
| なぜそう作ったかの判断（採用案・却下案・その結果） | `docs/DECISIONS.md` に追記 |
| 1画面 / 1機能の作りの詳細（構成・トークン・クラス対応・既知の問題） | `docs/<NAME>.md` を新規作成し、README.md と本ファイルの一覧に追加 |
| 仕様そのものの変更 | `specs/推しポート要件定義.md` の該当節を改訂 |
| データフロー・境界・画面間依存の変化 | `docs/ARCHITECTURE.md` を更新 |
| `AppState` / `Screens` の契約の変化 | `docs/API.md` を更新 |
| 完了したタスク | `TASKS.md` の Completed へ |

### 粒度

- **1画面 or 1機能につき1ファイル。** 変更のたびにファイルを作らない。同じ画面を再び触ったら既存ファイルを更新する
- 変更履歴ではなく**リファレンス**として書く。「何を変えたか」ではなく「いまどうなっているか」。差分は git log が持っている
- **実物の値を書く。** 色は16進数、クラス名は実名、参照先は実パス。あとで grep できる形にする
- **未確認のこと・既知の問題を必ず節として残す。** 隠さない
- 推測は「推測」と明記する（`docs/DECISIONS.md` の `Reason not documented yet.` と同じ扱い）

参考: [docs/LISTING-DESIGN.md](docs/LISTING-DESIGN.md) がこの粒度の実例。

---

## Commands

このリポジトリにビルド系のコマンドは存在しない。以下が実際に動作する全て（すべて追加インストール不要）。

```bash
# 開発サーバ（推奨。http://localhost:5173 を開く）
python3 -m http.server 5173

# file:// 直開きでも動く（ES modules も fetch も使っていないため）
open index.html

# 構文チェック（lint / typecheck の代替。全 JS が構文エラーなしか）
node --check data.js && for f in js/*.js; do node --check "$f" || echo "NG: $f"; done && echo OK

# 参照している画像がすべて実在するか（デモ落ちの主要因の検出）
grep -ohE "assets/img/[A-Za-z0-9_.-]+" index.html data.js js/*.js styles.css \
  | sort -u | while read -r p; do [ -f "$p" ] || echo "MISSING: $p"; done
```

`npm install` / `npm run dev` / `npm run build` / `npm test` は**存在しない**。提案もしないこと。

---

## Definition of Done

タスク終了前に全項目を確認する。

1. 依頼されたタスクが実装されている
2. `node --check` が全 JS で通る（上記コマンド）
3. 参照画像の実在チェックで `MISSING` が出ない
4. **ブラウザで対象画面を開いて動作を確認した** — できない場合は**「未確認」と明記して報告する**
5. デモの核（投稿 → 2 個目検出通知 → 出品モック）を壊していない
6. `data.js` のスキーマ、`index.html` の script 順、screen 間の非参照を壊していない
7. secret / `.env` / `node_modules` をコミットしていない
8. 変更したファイルを列挙し、それぞれ何を変えたか説明できる
9. 仕様になくて自分で決めたことを、報告に全て列挙した
10. **`docs/` に記録を書いた**（上記 Documentation Rules）。報告は1行で済ませた
