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
