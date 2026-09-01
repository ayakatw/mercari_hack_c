---
name: code-review
description: Use when reviewing another developer's or agent's changes in the 推しポート demo app. Prioritizes correctness, regressions, and architecture violations over style.
---

# code-review

他の developer / agent の変更をレビューするときの手順。

## 前提

**スタイルの細かい指摘より、バグと設計上の問題を優先する。** これはハッカソンのデモ用プロトタイプで、締切が固定されている。命名の好みやフォーマットの揺れは指摘しない。ただし**既存パターンからの逸脱**は、他ファイルとの整合が崩れるため指摘する（下記の Architecture violation）。

## 手順

### 1. 変更の範囲を把握する

```bash
git diff main...HEAD --stat
git diff main...HEAD
```

- `TASKS.md` を見て、**この変更が担当タスクの範囲内か**確認する。範囲外のファイルが含まれていたら指摘する
- 変更されたファイルが他の active タスクのものでないか確認する

### 2. 重点的に見る観点

優先度の高い順。

#### Correctness

- ロジックが仕様（`specs/推しポート要件定義.md`）どおりか
- **固定値の整合**: チュートリアル後 ¥81,000 / 投稿後 ¥84,200 / 急騰 +18%。`data.js` の価格を変えた場合、`js/state.js` の `81000` 判定と食い違わないか
- `getItem()` / `getUser()` は `null` を返しうる。呼び出し側にガードがあるか
- 個数の範囲（1〜5）のクランプが効いているか

#### Regressions

- **デモの核を壊していないか**: 投稿 → 2個目検出通知 → 出品モック → 資産タブの「出品中」バッジ
- `js/state.js` / `data.js` / `index.html` / `styles.css` は共有ファイル。変更があれば**全画面への影響**を確認する
- `index.html` の script 読み込み順が変わっていないか（`data.js` → `state.js` → `screen-*.js` → `router.js`）
- `styles.css` に追加したクラス名が既存クラスと衝突していないか

#### Architecture violation

`AGENTS.md` の Architecture Rules に違反していないか。静的解析で検出できないため、レビューが唯一の防波堤。

- `screen-*.js` が別の `screen-*.js` を参照していないか
- screen が `state` や `ITEMS` を**直接書き換えて**いないか（読み取りは可）
- `js/state.js` が `document` を参照していないか
- `import` / `export` / `type="module"` が入っていないか
- `data.js` のスキーマ（キーの追加・削除・型変更）が変わっていないか
- 新しい CDN・npm パッケージ・外部通信が追加されていないか（外部通信は `/api/analyze` の 1 本だけ）
- **API キーがブラウザ配信コードに混入していないか**（`index.html` / `data.js` / `js/*.js`）
- **AI 依存が必須になっていないか。** 解析が失敗しても仕込みデータへ退避して完走するか
- `const` / `let` / アロー関数 / テンプレートリテラル / class が混入していないか（既存コードは `var` + `function` で統一）
- Chart.js の生成が `render` の中で行われていないか（**`afterRender` でなければ canvas がまだ DOM にない**）

#### Duplicate logic

- 既にある関数の再実装がないか（`AppState.formatYen` / `getTotal` / `escapeHtml`）
- 同じ HTML 生成が複数箇所にコピーされていないか

#### Error handling

- null / undefined を返しうる関数の戻り値をそのまま使っていないか
- 症状を隠すだけの try/catch がないか
- 未定義の route を追加していないか（`Screens` に登録がないと `home` に落ちる）

#### Type safety

TypeScript を使っていないため型検査は存在しない。代わりに:

- `data.js` のアイテムに必要なキーが揃っているか（`id` / `name` / `thumb` / `marketPrice` / `count` / `trend7d` / `history30d` / `status` / `duplicate`）
- 数値と文字列の取り違え（`marketPrice` を文字列連結していないか）
- `history30d` の長さが `HISTORY_LABELS`（30 件）と一致しているか

#### Security

- **ユーザー入力を `escapeHtml` を通さずに HTML 文字列へ埋めていないか**（`render` が文字列連結なので XSS が直接入る）
- 外部から取得した値を `innerHTML` に入れていないか

#### Secrets

- API キー・トークン・パスワードがコードやコミットに含まれていないか
- `.env` / `node_modules/` / `server/` がコミットされていないか

#### Unnecessary complexity

- 依頼された範囲を超えた変更（ついでのリファクタ、ついでの機能追加）が入っていないか
- 抽象化が必要ないところに抽象化が入っていないか。このプロジェクトでは拡張性は評価されない

### 3. 動かして確認する

```bash
node --check data.js && for f in js/*.js; do node --check "$f" || echo "NG: $f"; done && echo OK

grep -ohE "assets/img/[A-Za-z0-9_.-]+" index.html data.js js/*.js styles.css \
  | sort -u | while read -r p; do [ -f "$p" ] || echo "MISSING: $p"; done

npm start                     # → http://localhost:3000
# チュートリアルを飛ばすなら http://localhost:3000/?screen=post
```

変更された画面と、デモの核の一通りを実際に触る。

### 4. 指摘をまとめる

重大度で分けて出す。

- **Blocker** — デモの核を壊す / 画面が動かない / secret が入っている
- **Should fix** — 仕様との相違、境界違反、リグレッションの恐れ
- **Nit** — それ以外。締切が近ければ「直さない」判断でよいことを明記する

各指摘には**ファイル名と行番号、なぜ問題か、どう直すか**を書く。動作確認できていない指摘は「未検証の懸念」と明記する。
