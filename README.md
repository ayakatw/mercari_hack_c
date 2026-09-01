# 推しポート

推し活グッズの投稿が、そのまま資産ポートフォリオになる推し活 SNS のデモアプリ。
重複したグッズだけを検出してメルカリ出品へ誘導する導線を持つ。

Mercari Hack Team C のハッカソン用プロトタイプ。**リリースはしない。** 成果物は 90 秒のデモ録画と、ブラウザで触れる実物。

- 仕様の唯一の正: [specs/推しポート要件定義.md](specs/推しポート要件定義.md)
- AI agent 向けの共通ルール: [AGENTS.md](AGENTS.md)
- 作業中のタスク: [TASKS.md](TASKS.md)

---

## Prerequisites

**フロントはビルド不要のまま。** ただし画像解析に Gemini を使うため、最小の Node サーバが付く。

| 用途 | 必要なもの | 備考 |
| --- | --- | --- |
| アプリを開く | モダンなブラウザ | Chrome での確認を想定 |
| 開発サーバ + 画像解析 | Node.js 20 以上 | `npm start` |
| Gemini API キー | [AI Studio](https://aistudio.google.com/apikey) で取得 | 無くてもアプリは動く（仕込みデータへ退避） |

## Setup

```bash
git clone <repo-url>
cd mercari_hack_c
npm install
cp .env.example .env    # GEMINI_API_KEY を書く
```

## Environment Variables

**サーバプロセスのみが読む。ブラウザへは 1 つも渡らない。**

| 変数 | 必須 | 用途 |
| --- | --- | --- |
| `GEMINI_API_KEY` | **必須** | 画像解析。未設定でもアプリは動くが、解析は仕込みデータになる |
| `GEMINI_MODEL` | 任意 | 解析モデルの上書き。省略時 `gemini-3.5-flash-lite` |
| `PORT` | 任意 | 省略時 3000 |

`.env` は `.gitignore` 済み。**`.env.example` と `js/*.js` に実キーを書かないこと。**
詳細は [docs/API.md](docs/API.md)。

## Development

```bash
npm start
# → http://localhost:3000
```

サーバのターミナルにログが出る。**ページを開けば `[req] GET /`、画像を選べば
`[req] POST /api/analyze` と `[analyze] ...`。何も出ないならブラウザがこのサーバを見ていない。**

リロードすると**必ずチュートリアルの最初から**始まる（状態を永続化していない）。
チュートリアルは「ステラ 缶バッジ」を 2 個にしないと先へ進めない（合計 ¥81,000 が条件）。
開発中はこれを飛ばせる:

```
http://localhost:3000/?screen=post      # 投稿画面から。チュートリアル済みの状態になる
http://localhost:3000/?screen=assets    # 資産タブから
```

DevTools の Console からも操作できる:

```js
AppState.setRoute('assets')              // 資産タブへ
AppState.prepareListing('stella-acsta')  // 出品モックへ
AppState.getState()                      // 現在の状態を確認
```

### AI 抜きで動かす

`python3 -m http.server 5173` や `open index.html` でも起動はする。
`/api/analyze` に届かないので解析は仕込みデータへ退避するが、**それ以外の画面は全て動く。**

### 検証

lint / typecheck / test / build のコマンドは**存在しない**。代わりに以下を使う。

```bash
# 構文チェック
node --check data.js && for f in js/*.js server.js server/gemini.js; do node --check "$f" || echo "NG: $f"; done && echo OK

# 参照している画像がすべて実在するか
grep -ohE "assets/img/[A-Za-z0-9_.-]+" index.html data.js js/*.js styles.css \
  | sort -u | while read -r p; do [ -f "$p" ] || echo "MISSING: $p"; done

# ブラウザへ配信されるコードに API キーが混入していないか
grep -rniE "gemini_api_key|AIza" index.html data.js js/ styles.css assets/ && echo "NG: 漏洩" || echo OK

# 解析 API の疎通（サーバ起動中に。JPEG/PNG/WebP/HEIC。SVG は非対応）
curl -s -X POST -F "image=@path/to/photo.jpg" http://localhost:3000/api/analyze
```

デモ前の総点検は [.agents/skills/demo-check/SKILL.md](.agents/skills/demo-check/SKILL.md)。

## Build

**ビルド工程は無い。** 追跡されているファイルがそのまま成果物（`npm install` はサーバの依存を入れるだけで、
フロントは一切変換されない）。理由は [docs/DECISIONS.md](docs/DECISIONS.md)。

---

## Repository Overview

```
index.html            エントリポイント。script 読み込み順を固定（変更禁止）
styles.css            全画面ぶんの CSS
data.js               仕込みデータ（ITEMS / POSTS / USERS / AI_RESULTS / EVENTS）
server.js             静的配信 + POST /api/analyze（Node。ブラウザへは配信されない）
server/gemini.js      プロンプト / JSON Schema / Gemini 呼び出し。API キーはここだけ
package.json          サーバの依存（@google/genai, express, multer, dotenv）
js/
├── state.js          状態と全ミューテータ。状態を変えてよい唯一の場所
├── router.js         画面切替・共通クローム。最後に読み込み、起動も担当
└── screen-*.js       各画面。Screens.<route> に自己登録する
assets/img/           グッズ・アバター画像
specs/                要件定義書
design/               デザインカンプ。アプリ本体とは別物で実行されない
docs/                 アーキテクチャ / API / 設計判断
.agents/skills/       タスク別ワークフロー
```

アーキテクチャの詳細（データフロー、境界、feature 間の依存）は **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** を参照。

## Documentation

| ファイル | 内容 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | AI agent / 開発者の共通ルール。**作業前に必ず読む** |
| [TASKS.md](TASKS.md) | 作業中のタスクと担当範囲 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 全体像・データフロー・境界・feature 間依存 |
| [docs/API.md](docs/API.md) | Gemini 連携（`POST /api/analyze`）、外部依存、内部 API 契約（AppState / Screens） |
| [docs/DECISIONS.md](docs/DECISIONS.md) | 設計判断の記録（ADR-lite） |
| [specs/推しポート要件定義.md](specs/推しポート要件定義.md) | 要件定義書。仕様の唯一の正 |

### Workflows

| Skill | 使うとき |
| --- | --- |
| [implement-feature](.agents/skills/implement-feature/SKILL.md) | 新機能・新画面を実装する |
| [fix-bug](.agents/skills/fix-bug/SKILL.md) | バグを直す |
| [code-review](.agents/skills/code-review/SKILL.md) | 他の人の変更をレビューする |
| [demo-check](.agents/skills/demo-check/SKILL.md) | デモ・発表の直前に総点検する |
