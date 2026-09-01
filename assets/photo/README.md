# assets/photo/ — 実写真の差し替え口

ここに **`<スロット名>.png`** を置くだけで、アプリ内の該当する既定画像(SVG/PNG)が実写真に自動で切り替わります。
コード変更・リロード以外の作業は不要です(js/photo-slot.js が起動時に存在確認して差し替え)。

| ファイル名 | 用途 |
| --- | --- |
| `saidan.png` | チュートリアルの祭壇写真(解析対象のメイン写真) |
| `acsta2.png` | 投稿フローで解析するアクリルスタンド写真 |
| `tl-post.png` | ホームタイムラインの投稿写真 |
| `item-acsta.png` | グッズ: アクリルスタンド |
| `item-album.png` | グッズ: アルバム |
| `item-badge.png` | グッズ: 缶バッジ |
| `item-card.png` | グッズ: トレカ |
| `item-hoodie.png` | グッズ: パーカー |
| `item-penlight.png` | グッズ: ペンライト |
| `item-plush.png` | グッズ: ぬいぐるみ |

- 形式: PNG(推奨)。正方形〜4:3程度だとレイアウトが崩れにくい
- アバター6点は `assets/img/avatar-*.png` のImageGen生成プロフィール写真を直接参照するため、この自動差し替えの対象外
