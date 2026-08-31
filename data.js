(function (global) {
  'use strict';

  var IMG = 'assets/img/';
  var HISTORY_LABELS = [
    '8/3', '8/4', '8/5', '8/6', '8/7', '8/8', '8/9', '8/10', '8/11', '8/12',
    '8/13', '8/14', '8/15', '8/16', '8/17', '8/18', '8/19', '8/20', '8/21', '8/22',
    '8/23', '8/24', '8/25', '8/26', '8/27', '8/28', '8/29', '8/30', '8/31', '9/1'
  ];

  // 7種類の初期資産 + 投稿デモ用の2個目1件。pendingDemo は初期一覧には出さない。
  var ITEMS = [
    {
      id: 'stella-acsta',
      name: 'ステラ アクリルスタンド',
      shortName: 'ステラのアクスタ',
      thumb: IMG + 'item-acsta.svg',
      marketPrice: 3200,
      count: 1,
      trend7d: 4.6,
      history30d: [2700, 2740, 2750, 2780, 2800, 2840, 2820, 2860, 2890, 2910, 2950, 2930, 2980, 3010, 2990, 3040, 3070, 3050, 3100, 3140, 3120, 3160, 3180, 3150, 3190, 3200, 3180, 3210, 3200, 3200],
      status: 'hold',
      duplicate: false,
      category: 'タレントグッズ > アクリルスタンド',
      condition: '未使用に近い'
    },
    {
      id: 'stella-card',
      name: 'ステラのトレカ',
      shortName: 'ステラのトレカ',
      thumb: IMG + 'item-card.svg',
      marketPrice: 18000,
      count: 1,
      trend7d: 18,
      history30d: [15250, 15280, 15300, 15260, 15320, 15350, 15310, 15380, 15400, 15370, 15420, 15400, 15450, 15420, 15480, 15450, 15380, 15250, 18000, 18050, 18100, 18080, 18040, 18020, 18060, 18030, 17980, 18020, 18010, 18000],
      status: 'hold',
      duplicate: false,
      category: 'タレントグッズ > トレーディングカード',
      condition: '目立った傷や汚れなし'
    },
    {
      id: 'stella-badge',
      name: 'ステラ 缶バッジ',
      shortName: 'ステラの缶バッジ',
      thumb: IMG + 'item-badge.svg',
      marketPrice: 6500,
      count: 2,
      trend7d: -1.8,
      history30d: [6720, 6700, 6680, 6710, 6690, 6660, 6650, 6670, 6640, 6620, 6610, 6590, 6600, 6580, 6570, 6560, 6550, 6540, 6560, 6530, 6520, 6500, 6510, 6490, 6500, 6480, 6500, 6490, 6510, 6500],
      status: 'hold',
      duplicate: true,
      category: 'タレントグッズ > 缶バッジ',
      condition: '未使用に近い'
    },
    {
      id: 'stella-plush',
      name: 'ステラ マスコットぬい',
      shortName: 'ステラのぬい',
      thumb: IMG + 'item-plush.svg',
      marketPrice: 11800,
      count: 1,
      trend7d: 3.1,
      history30d: [10800, 10850, 10900, 10920, 10980, 11000, 11080, 11120, 11090, 11150, 11200, 11220, 11300, 11280, 11350, 11400, 11420, 11480, 11500, 11520, 11580, 11600, 11620, 11680, 11700, 11680, 11720, 11750, 11780, 11800],
      status: 'hold',
      duplicate: false,
      category: 'タレントグッズ > ぬいぐるみ',
      condition: '目立った傷や汚れなし'
    },
    {
      id: 'stellight-penlight',
      name: 'STELLIGHT ペンライト',
      shortName: '公式ペンライト',
      thumb: IMG + 'item-penlight.svg',
      marketPrice: 9800,
      count: 1,
      trend7d: 6.2,
      history30d: [8500, 8580, 8620, 8650, 8700, 8750, 8780, 8820, 8870, 8900, 8940, 8990, 9050, 9080, 9140, 9180, 9220, 9280, 9340, 9380, 9420, 9480, 9520, 9570, 9610, 9650, 9680, 9740, 9770, 9800],
      status: 'hold',
      duplicate: false,
      category: 'タレントグッズ > ペンライト',
      condition: 'やや傷や汚れあり'
    },
    {
      id: 'stellight-hoodie',
      name: 'STELLIGHT ツアーパーカー',
      shortName: 'ツアーパーカー',
      thumb: IMG + 'item-hoodie.svg',
      marketPrice: 15200,
      count: 1,
      trend7d: -2.4,
      history30d: [16000, 15980, 15920, 15880, 15850, 15820, 15780, 15750, 15720, 15680, 15650, 15620, 15580, 15550, 15520, 15480, 15450, 15420, 15400, 15380, 15350, 15320, 15300, 15280, 15250, 15220, 15200, 15180, 15220, 15200],
      status: 'hold',
      duplicate: false,
      category: 'タレントグッズ > アパレル',
      condition: '目立った傷や汚れなし'
    },
    {
      id: 'stellight-album',
      name: 'STELLIGHT 1stアルバム限定盤',
      shortName: '1stアルバム限定盤',
      thumb: IMG + 'item-album.svg',
      marketPrice: 10000,
      count: 1,
      trend7d: 0.8,
      history30d: [9600, 9620, 9650, 9670, 9700, 9720, 9740, 9760, 9750, 9780, 9800, 9820, 9840, 9830, 9860, 9880, 9900, 9920, 9910, 9940, 9960, 9970, 9980, 9960, 9990, 10000, 9980, 10020, 10010, 10000],
      status: 'hold',
      duplicate: false,
      category: 'CD > K-POP',
      condition: '未使用に近い'
    },
    {
      id: 'stella-acsta-demo',
      name: 'ステラ アクリルスタンド',
      shortName: 'ステラのアクスタ',
      thumb: IMG + 'acsta2.svg',
      marketPrice: 3200,
      count: 1,
      trend7d: 4.6,
      history30d: [2700, 2740, 2750, 2780, 2800, 2840, 2820, 2860, 2890, 2910, 2950, 2930, 2980, 3010, 2990, 3040, 3070, 3050, 3100, 3140, 3120, 3160, 3180, 3150, 3190, 3200, 3180, 3210, 3200, 3200],
      status: 'hold',
      duplicate: true,
      category: 'タレントグッズ > アクリルスタンド',
      condition: '未開封',
      pendingDemo: true,
      consolidatesInto: 'stella-acsta'
    }
  ];

  var USERS = [
    { handle: 'rina_oshi', name: 'りな', avatar: IMG + 'avatar-rina.svg', tappable: false },
    { handle: 'mio_stella', name: 'みお', avatar: IMG + 'avatar-mio.svg', tappable: true },
    { handle: 'yuna_blue', name: 'ゆな', avatar: IMG + 'avatar-yuna.svg', tappable: false },
    { handle: 'sora_light', name: 'そら', avatar: IMG + 'avatar-sora.svg', tappable: false },
    { handle: 'noa_kira', name: 'のあ', avatar: IMG + 'avatar-noa.svg', tappable: false },
    { handle: 'mei_starry', name: 'めい', avatar: IMG + 'avatar-mei.svg', tappable: false }
  ];

  var POSTS = [
    { id: 'post-1', user: 'yuna_blue', avatar: IMG + 'avatar-yuna.svg', image: IMG + 'tl-post.svg', caption: '今日の祭壇、淡いブルーでまとめたよ🫧 ずっと眺めていられる…！', likes: 128, tags: ['ステライト 祭壇'], giveaway: false },
    { id: 'post-2', user: 'mio_stella', avatar: IMG + 'avatar-mio.svg', image: IMG + 'item-acsta.svg', caption: 'ステラのアクスタが重なったので、次のステラ推しさんへ継承したいです💫', likes: 86, tags: ['ステラ アクリルスタンド'], giveaway: true },
    { id: 'post-3', user: 'sora_light', avatar: IMG + 'avatar-sora.svg', image: IMG + 'item-card.svg', caption: 'ツアービジュのステラ、光の入り方まで最高。大切に保管します。', likes: 214, tags: ['ステラのトレカ'], giveaway: false },
    { id: 'post-4', user: 'noa_kira', avatar: IMG + 'avatar-noa.svg', image: IMG + 'item-plush.svg', caption: 'ぬいとカフェ巡り☕ ラベンダーのリボンをおそろいにしたよ。', likes: 73, tags: ['ステラ マスコットぬい'], giveaway: false },
    { id: 'post-5', user: 'mei_starry', avatar: IMG + 'avatar-mei.svg', image: IMG + 'item-penlight.svg', caption: '日本ツアー発表おめでとう！このペンライトをまた振れる日が来る🌟', likes: 302, tags: ['STELLIGHT ペンライト'], giveaway: false },
    { id: 'post-6', user: 'rina_oshi', avatar: IMG + 'avatar-rina.svg', image: IMG + 'item-badge.svg', caption: '缶バッジを並べ替え。左右対称って落ち着く…🫶', likes: 95, tags: ['ステラ 缶バッジ'], giveaway: false },
    { id: 'post-7', user: 'yuna_blue', avatar: IMG + 'avatar-yuna.svg', image: IMG + 'item-hoodie.svg', caption: 'STELLIGHTのツアーパーカー、秋の現場コーデに決定！', likes: 64, tags: ['STELLIGHT ツアーパーカー'], giveaway: false },
    { id: 'post-8', user: 'sora_light', avatar: IMG + 'avatar-sora.svg', image: IMG + 'item-album.svg', caption: '1stアルバム発売から1年。今日も大事な一枚です💿', likes: 147, tags: ['STELLIGHT 1stアルバム限定盤'], giveaway: false }
  ];

  var AI_RESULTS = {
    'saidan.svg': [
      { itemId: 'stella-acsta', name: 'ステラ アクリルスタンド', price: 3200, count: 1 },
      { itemId: 'stella-card', name: 'ステラのトレカ', price: 18000, count: 1 },
      { itemId: 'stella-badge', name: 'ステラ 缶バッジ', price: 6500, count: 1 },
      { itemId: 'stella-plush', name: 'ステラ マスコットぬい', price: 11800, count: 1 },
      { itemId: 'stellight-penlight', name: 'STELLIGHT ペンライト', price: 9800, count: 1 },
      { itemId: 'stellight-hoodie', name: 'STELLIGHT ツアーパーカー', price: 15200, count: 1 },
      { itemId: 'stellight-album', name: 'STELLIGHT 1stアルバム限定盤', price: 10000, count: 1 }
    ],
    'acsta2.svg': {
      itemId: 'stella-acsta',
      name: 'ステラ アクリルスタンド',
      price: 3200,
      tags: ['アクスタ', 'ステラ', 'STELLIGHT'],
      state: '未開封',
      image: IMG + 'acsta2.svg'
    }
  };

  // 撮影実素材へ同名差し替えする場合にも使えるフォールバック別名。
  AI_RESULTS['saidan.jpg'] = AI_RESULTS['saidan.svg'];
  AI_RESULTS['acsta2.jpg'] = AI_RESULTS['acsta2.svg'];

  var EVENTS = [
    { date: '8/21', label: 'ステライト 日本ツアー発表', impact: '+18%', itemId: 'stella-card' }
  ];

  global.HISTORY_LABELS = HISTORY_LABELS;
  global.ITEMS = ITEMS;
  global.POSTS = POSTS;
  global.USERS = USERS;
  global.AI_RESULTS = AI_RESULTS;
  global.EVENTS = EVENTS;
}(window));
