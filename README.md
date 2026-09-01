# 推しポート

推し活グッズの投稿が、そのまま資産ポートフォリオになる推し活 SNS のデモアプリ。
重複したグッズだけを検出してメルカリ出品へ誘導する導線を持つ。

Mercari Hack Team C のハッカソン用プロトタイプ。**リリースはしない。** 成果物は 90 秒のデモ録画と、ブラウザで触れる実物。

- 仕様の唯一の正: [specs/推しポート要件定義.md](specs/推しポート要件定義.md)
- AI agent 向けの共通ルール: [AGENTS.md](AGENTS.md)
- 作業中のタスク: [TASKS.md](TASKS.md)

---

## Prerequisites

**ビルドツールもパッケージマネージャも不要。** 必要なのは以下だけ。

| 用途 | 必要なもの | 備考 |
| --- | --- | --- |
| アプリを開く | モダンなブラウザ | Chrome での確認を想定 |
| 開発サーバ | Python 3（`python3 -m http.server`） | macOS には標準で入っている |
| 構文チェック | Node.js（`node --check`） | 任意。無くてもアプリは動く |

`npm install` は**不要**。`package.json` は存在しない。

## Setup

```bash
git clone <repo-url>
cd mercari_hack_c
```

以上。インストール手順は無い。

## Environment Variables

**不要。** このアプリは環境変数を 1 つも参照しない。詳細は [.env.example](.env.example) と [docs/API.md](docs/API.md)。

## Development

```bash
# 開発サーバ（推奨）
python3 -m http.server 5173
# → http://localhost:5173

# file:// 直開きでも動く（ES modules も fetch も使っていないため）
open index.html
```

リロードすると**必ずチュートリアルの最初から**始まる（状態を永続化していない）。
特定の画面へ直接飛ぶ URL は無い。開発中は DevTools の Console から:

```js
AppState.setRoute('assets')              // 資産タブへ
AppState.prepareListing('stella-acsta')  // 出品モックへ
AppState.getState()                      // 現在の状態を確認
```

### 検証

lint / typecheck / test / build のコマンドは**存在しない**。代わりに以下を使う。

```bash
# 構文チェック
node --check data.js && for f in js/*.js; do node --check "$f" || echo "NG: $f"; done && echo OK

# 参照している画像がすべて実在するか
grep -ohE "assets/img/[A-Za-z0-9_.-]+" index.html data.js js/*.js styles.css \
  | sort -u | while read -r p; do [ -f "$p" ] || echo "MISSING: $p"; done
```

デモ前の総点検は [.agents/skills/demo-check/SKILL.md](.agents/skills/demo-check/SKILL.md)。

## Build

**ビルド工程は無い。** 追跡されているファイルがそのまま成果物。理由は [docs/DECISIONS.md](docs/DECISIONS.md)。

---

## Repository Overview

```
index.html            エントリポイント。script 読み込み順を固定（変更禁止）
styles.css            全画面ぶんの CSS
data.js               仕込みデータ（ITEMS / POSTS / USERS / AI_RESULTS / EVENTS）
js/
├── state.js          状態と全ミューテータ。状態を変えてよい唯一の場所
├── router.js         画面切替・共通クローム。最後に読み込み、起動も担当
└── screen-*.js       各画面。Screens.<route> に自己登録する
assets/img/           グッズ・アバター画像
specs/                要件定義書
design/               デザインカンプ。アプリ本体とは別物で実行されない
docs/                 アーキテクチャ / API / 設計判断 / 出品モックのデザイン仕様
.agents/skills/       タスク別ワークフロー
```

アーキテクチャの詳細（データフロー、境界、feature 間の依存）は **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** を参照。

## Documentation

| ファイル | 内容 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | AI agent / 開発者の共通ルール。**作業前に必ず読む** |
| [TASKS.md](TASKS.md) | 作業中のタスクと担当範囲 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 全体像・データフロー・境界・feature 間依存 |
| [docs/API.md](docs/API.md) | 外部依存（CDN）と内部 API 契約（AppState / Screens） |
| [docs/DECISIONS.md](docs/DECISIONS.md) | 設計判断の記録（ADR-lite） |
| [docs/LISTING-DESIGN.md](docs/LISTING-DESIGN.md) | 出品モックのデザイン仕様（実物メルカリの完コピ範囲・トークン・クラス対応） |
| [specs/推しポート要件定義.md](specs/推しポート要件定義.md) | 要件定義書。仕様の唯一の正 |

### Workflows

| Skill | 使うとき |
| --- | --- |
| [implement-feature](.agents/skills/implement-feature/SKILL.md) | 新機能・新画面を実装する |
| [fix-bug](.agents/skills/fix-bug/SKILL.md) | バグを直す |
| [code-review](.agents/skills/code-review/SKILL.md) | 他の人の変更をレビューする |
| [demo-check](.agents/skills/demo-check/SKILL.md) | デモ・発表の直前に総点検する |
