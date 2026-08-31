/**
 * シードの素材。seed.ts と scripts/generate-images.ts が共有する。
 * 値はすべて固定。ここを変えない限り毎回同じデータになる。
 */

export const OSHI = [
  { key: 'hoshifuri', name: '星降ハーモニクス' },
  { key: 'melty', name: 'MELTY CIRCUS' },
  { key: 'aoiro', name: '藍色スペクトル' },
  { key: 'karen', name: '花蓮ロジック' },
  { key: 'nocturne', name: 'NOCTURNE9' },
  { key: 'citruspop', name: 'シトラスポップ' },
  { key: 'lumina', name: 'Lumina Bell' },
  { key: 'kagerou', name: '陽炎アンサンブル' },
  { key: 'mintlab', name: 'ミントラボ' },
  { key: 'ruri', name: '瑠璃ノ雫' },
] as const

export type OshiKey = (typeof OSHI)[number]['key']

export const OSHI_NAME: Record<OshiKey, string> = Object.fromEntries(
  OSHI.map((o) => [o.key, o.name]),
) as Record<OshiKey, string>

export type SeedUser = {
  handle: string
  displayName: string
  initial: string
  bio: string
  oshi: OshiKey[]
  /** 投稿数の重み。1 が平均的、3 だと 3 倍投稿する。 */
  activity: number
}

/**
 * 推し棚はわざと偏らせる。星降ハーモニクスが最大勢力で、瑠璃ノ雫は 1 人だけ。
 * デモで「同じ推しの人だけが並ぶ」「フォロー相手で画面が変わる」が見えるようにするため。
 */
export const SEED_USERS: SeedUser[] = [
  { handle: 'nagi_hoshi', displayName: 'なぎ', initial: 'な', bio: '星降ハーモニクス担。現場は関東中心、遠征もします。', oshi: ['hoshifuri'], activity: 3 },
  { handle: 'mikan_0210', displayName: 'みかん', initial: 'み', bio: 'アクスタ写真ばかり撮ってる。グッズ交換はDMまで。', oshi: ['hoshifuri', 'citruspop'], activity: 3 },
  { handle: 'suzu_stellar', displayName: 'すず', initial: 'す', bio: '星降 / 5年目。セトリの話が長い。', oshi: ['hoshifuri'], activity: 2 },
  { handle: 'kotori_ne', displayName: 'ことり', initial: 'こ', bio: 'ぬい活してます。自作ぬい服の記録。', oshi: ['hoshifuri', 'lumina'], activity: 2 },
  { handle: 'haru_1123', displayName: 'はる', initial: 'は', bio: '星降ハーモニクスと藍スペ。ライブ後は必ずカフェ。', oshi: ['hoshifuri', 'aoiro'], activity: 2 },
  { handle: 'yuzuki_live', displayName: 'ゆづき', initial: 'ゆ', bio: '現場記録用。ペンラの色替え研究中。', oshi: ['hoshifuri'], activity: 2 },
  { handle: 'aki_no_hako', displayName: 'あき', initial: 'あ', bio: '推し棚の整理が趣味。無限に増える。', oshi: ['hoshifuri', 'melty'], activity: 1 },
  { handle: 'rin_hoshizora', displayName: 'りん', initial: 'り', bio: '星降担 / トレカ収集。ダブりは交換します。', oshi: ['hoshifuri'], activity: 2 },
  { handle: 'nanase_pj', displayName: 'ななせ', initial: 'な', bio: '週末だけ現場。平日は写真の現像。', oshi: ['hoshifuri'], activity: 1 },
  { handle: 'tsumugi_h', displayName: 'つむぎ', initial: 'つ', bio: '星降ハーモニクス / 名古屋。', oshi: ['hoshifuri', 'kagerou'], activity: 1 },
  { handle: 'sora_to_hoshi', displayName: 'そら', initial: 'そ', bio: '推しの誕生日は毎年ケーキを焼く。', oshi: ['hoshifuri'], activity: 1 },

  { handle: 'melo_candy', displayName: 'めろ', initial: 'め', bio: 'MELTY CIRCUS 一筋。ピンク集めがち。', oshi: ['melty'], activity: 3 },
  { handle: 'chiaki_mc', displayName: 'ちあき', initial: 'ち', bio: 'メルティ担 / 缶バッジは全種そろえる派。', oshi: ['melty'], activity: 2 },
  { handle: 'popo_circus', displayName: 'ぽぽ', initial: 'ぽ', bio: 'カフェコラボ全通したい。', oshi: ['melty', 'citruspop'], activity: 2 },
  { handle: 'sana_bloom', displayName: 'さな', initial: 'さ', bio: 'メルティとルミナ。物販の待機列が好き。', oshi: ['melty', 'lumina'], activity: 2 },
  { handle: 'yui_melt', displayName: 'ゆい', initial: 'ゆ', bio: '大阪。遠征の記録を残しています。', oshi: ['melty'], activity: 1 },
  { handle: 'kanade_mc', displayName: 'かなで', initial: 'か', bio: 'MELTY CIRCUS / ぬい撮り。', oshi: ['melty'], activity: 1 },
  { handle: 'noa_sugar', displayName: 'のあ', initial: 'の', bio: 'グッズの開封動画をよく上げます。', oshi: ['melty', 'hoshifuri'], activity: 1 },

  { handle: 'ao_spectrum', displayName: 'あお', initial: 'あ', bio: '藍色スペクトル。青いものを買いがち。', oshi: ['aoiro'], activity: 3 },
  { handle: 'minato_blue', displayName: 'みなと', initial: 'み', bio: '藍スペ担 / 音源の話しかしない。', oshi: ['aoiro'], activity: 2 },
  { handle: 'ren_indigo', displayName: 'れん', initial: 'れ', bio: 'ライブ写真とレコード。', oshi: ['aoiro', 'nocturne'], activity: 2 },
  { handle: 'shiho_umi', displayName: 'しほ', initial: 'し', bio: '藍色スペクトル / 福岡から通ってます。', oshi: ['aoiro'], activity: 1 },
  { handle: 'kai_wave', displayName: 'かい', initial: 'か', bio: '青と海。ツアー全通中。', oshi: ['aoiro', 'ruri'], activity: 1 },

  { handle: 'yoru_n9', displayName: 'よる', initial: 'よ', bio: 'NOCTURNE9。ライブハウスの床が好き。', oshi: ['nocturne'], activity: 2 },
  { handle: 'itsuki_n9', displayName: 'いつき', initial: 'い', bio: 'ノクターン担 / Tシャツばかり増える。', oshi: ['nocturne'], activity: 2 },
  { handle: 'mizuki_night', displayName: 'みずき', initial: 'み', bio: '夜の現場専門。', oshi: ['nocturne', 'kagerou'], activity: 1 },
  { handle: 'kaoru_9', displayName: 'かおる', initial: 'か', bio: 'NOCTURNE9 / セトリ考察。', oshi: ['nocturne'], activity: 1 },

  { handle: 'karen_logic', displayName: 'かれん', initial: 'か', bio: '花蓮ロジック担当。ペンライト自作。', oshi: ['karen'], activity: 2 },
  { handle: 'mei_hana', displayName: 'めい', initial: 'め', bio: '花蓮ロジックとミントラボ。', oshi: ['karen', 'mintlab'], activity: 1 },
  { handle: 'towa_lumi', displayName: 'とわ', initial: 'と', bio: 'Lumina Bell / 花蓮ロジック。物販は開店ダッシュ。', oshi: ['lumina', 'karen'], activity: 1 },
]

/** アイテムタグに使うグッズのカタログ。価格は実在しそうな帯にする。 */
export const ITEM_CATALOG = [
  { label: 'アクリルスタンド', priceYen: 1800, keyword: 'アクリルスタンド' },
  { label: 'ペンライト（公式）', priceYen: 3500, keyword: 'ペンライト' },
  { label: '缶バッジ 5個セット', priceYen: 2200, keyword: '缶バッジ セット' },
  { label: 'ラバーバンド', priceYen: 700, keyword: 'ラバーバンド' },
  { label: 'トレーディングカード', priceYen: 1200, keyword: 'トレカ' },
  { label: 'ぬいぐるみ S', priceYen: 3200, keyword: 'ぬいぐるみ' },
  { label: 'ツアーTシャツ', priceYen: 4500, keyword: 'ツアーTシャツ' },
  { label: 'マフラータオル', priceYen: 2500, keyword: 'マフラータオル' },
  { label: 'ライブパンフレット', priceYen: 2800, keyword: 'ライブパンフレット' },
  { label: 'アクリルキーホルダー', priceYen: 1100, keyword: 'アクリルキーホルダー' },
  { label: 'コラボカフェ ランチョンマット', priceYen: 900, keyword: 'ランチョンマット' },
  { label: 'クリアファイル 2枚', priceYen: 600, keyword: 'クリアファイル' },
  { label: 'ブロマイド', priceYen: 800, keyword: 'ブロマイド' },
  { label: 'CD 初回限定盤', priceYen: 3900, keyword: 'CD 初回限定盤' },
  { label: 'トートバッグ', priceYen: 2600, keyword: 'トートバッグ' },
] as const

/** 画像テンプレートごとのキャプション。すべて実際に書かれそうな文にする。 */
export const CAPTIONS: Record<string, string[]> = {
  stage: [
    '{oshi} 東京公演、無事に終わりました。最後のMCで泣いてしまった。',
    '今日のセトリ、完全に優勝でした。{oshi} 本当にありがとう。',
    '{oshi} ツアー初日。1曲目のイントロで会場がどよめいたの忘れられない。',
    '2階席からでもペンライトの海がきれいだった。{oshi} 最高。',
    'アンコール3曲。{oshi} のライブは毎回体力を持っていかれる。',
    '{oshi} 大阪遠征、行ってよかった。新曲の生音がすごい。',
    '今日で {oshi} ツアー全通達成しました。長かった〜',
  ],
  acrylic: [
    '新しいアクスタ届いた。{oshi} の衣装の再現度が高すぎる。',
    '{oshi} アクスタ、ようやく全種そろいました。並べると圧巻。',
    '外出先で撮るアクスタ、背景選びが一番むずかしい。{oshi}',
    'アクスタ用の背景ボード買ったら世界が変わった。{oshi}',
    '{oshi} の新アクスタ、光にかざすとラメが見える仕様。',
    '机の上が {oshi} で埋まってきた。まだ増える予定。',
  ],
  penlight: [
    'ペンラの色、{oshi} のメンバーカラーに合わせて設定し直した。',
    '{oshi} 公式ペンライト、第3弾が一番軽くて振りやすい。',
    '電池入れ替え忘れて開演前に焦った話。{oshi} の現場あるある。',
    '{oshi} のライブ用にペンラ2本体制にしました。腕が死ぬ。',
    '暗転してペンラが一斉に光る瞬間がいちばん好き。{oshi}',
  ],
  cafe: [
    '{oshi} コラボカフェ行ってきました。ランチョンマットは推しでした。',
    'コラボメニュー全制覇。{oshi} のドリンク、味も普通においしい。',
    '{oshi} カフェ、平日の夕方が狙い目です。待ち時間ゼロだった。',
    '推しのケーキ、食べるのがもったいなくて15分眺めてた。{oshi}',
    '{oshi} コラボ、特典のコースターがランダムなのが罪深い。',
  ],
  photocard: [
    '{oshi} のトレカ、ダブったので交換希望です。',
    '初回盤の封入トレカ、狙ってた子が一発で出た。{oshi} ありがとう。',
    '{oshi} ブロマイドをスリーブに入れて保管派です。',
    'トレカ整理してたら1時間経ってた。{oshi} の沼は深い。',
    '{oshi} の新トレカ、加工がホロで写真に撮りにくい。',
  ],
  plush: [
    '{oshi} のぬい、服を自作しました。初めてにしては上出来かも。',
    'ぬい連れて遠征。{oshi} と一緒に新幹線。',
    '{oshi} ぬい、洗ったらふわふわに戻った。うれしい。',
    'ぬい撮り用の小物が増えていく。{oshi} のせい。',
    '{oshi} の新作ぬい、サイズ感がちょうどいい。カバンに入る。',
  ],
}
