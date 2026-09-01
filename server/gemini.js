'use strict';

// Gemini 呼び出しとプロンプト管理。API キーはここ（サーバ側）にのみ存在する。

var genai = require('@google/genai');
var GoogleGenAI = genai.GoogleGenAI;
var Type = genai.Type;

// デモでは速度が最優先。
// 当日賢いモデルを試したいときは GEMINI_MODEL で上書きできる。
var MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
var FALLBACK_MODEL = 'gemini-3.1-flash-lite';

var TIMEOUT_MS = 12000;
var FALLBACK_TIMEOUT_MS = 20000;


// ─────────────────────────────────────────────
// Timeout
// ─────────────────────────────────────────────

function withTimeout(promise, ms, label) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () {
      reject(
        new Error(
          'TIMEOUT ' +
          label +
          ' が ' +
          ms +
          'ms 以内に応答しませんでした'
        )
      );
    }, ms);

    promise.then(
      function (value) {
        clearTimeout(timer);
        resolve(value);
      },
      function (error) {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}


// ─────────────────────────────────────────────
// System Prompt
// ─────────────────────────────────────────────

var SYSTEM_PROMPT = [
  'あなたは日本のフリマアプリの出品アシスタントAgentです。',
  '出品者がアップロードした商品写真を見て、そのまま出品フォームに入れられる情報を作成します。',
  '単なる物体認識ではなく、「売るための出品情報を整える担当者」として振る舞ってください。',
  '',

  '## 絶対に守るルール',
  '',
  '- 画像から実際に確認できることだけを断定する。',
  '- 写り込んでいない情報を推測で埋めない。',
  '- ブランドはロゴ・タグ・刻印などで明確に判別できる場合のみ記入する。',
  '- ブランドを判別できなければ brand は null。',
  '- サイズ・型番・素材・付属品など画像だけでは判断できない項目は missingFields に入れる。',
  '- 推測と確認済み情報を混同しない。',
  '- description に憶測を事実として書かない。',
  '',

  '## condition',
  '',
  '- condition は画像から明確に読み取れる場合のみ具体的に書く。',
  '- 傷や汚れが見えないだけで「美品」と断定しない。',
  '- 判断できない場合は「写真からは判断できません」とする。',
  '- 判断できない場合は missingFields に condition を入れる。',
  '',

  '## 各項目の作り方',
  '',
  '- title:',
  '  フリマアプリの商品タイトル。40文字以内。',
  '  「ブランド + 色 + アイテム名」のように簡潔にする。',
  '  煽り文句や過度な記号は入れない。',
  '',
  '- category:',
  '  日本のフリマアプリで使われる一般的なカテゴリ名。',
  '  例: トップス / バッグ / 食器 / フィギュア / アクセサリー / その他',
  '',
  '- brand:',
  '  明確に判別できたブランド名。不明なら null。',
  '',
  '- color:',
  '  主な色を日本語で簡潔に。',
  '',
  '- condition:',
  '  画像から言える範囲の商品状態。',
  '',
  '- description:',
  '  自然な日本語の出品説明文。2〜4文。',
  '  画像から分かる特徴を中心に丁寧語で書く。',
  '',
  '- missingFields:',
  '  出品前にユーザー本人への確認が必要な項目。',
  '  英語の短いキーで返す。',
  '  例: size, condition, brand, material, accessories, model',
  '',
  '- confidence:',
  '  出品情報全体の確信度を0〜1で返す。',
  '',


  // ───────────────────────────────────────
  // 価格判定
  // ───────────────────────────────────────

  '## 価格判定',
  '',
  'estimatedPrice は実際の中古市場価格を検索・推測して決めるのではありません。',
  'このデモでは、以下の「簡易価格表」を正しい基準として価格を決定してください。',
  '',
  'ブランド価値、希少性、人気、実際の市場相場は価格に反映しません。',
  '必ず以下のルールを優先してください。',
  '',

  '### 商品カテゴリ別の基本価格',
  '',
  '- マグカップ: 2000円',
  '- Tシャツ: 2500円',
  '- シャツ: 2500円',
  '- パーカー: 4000円',
  '- スウェット: 4000円',
  '- ジャケット: 5000円',
  '- バッグ: 3500円',
  '- リュック: 3500円',
  '- ぬいぐるみ: 1500円',
  '- マスコット: 1500円',
  '- フィギュア: 2000円',
  '- ポスター: 2000円',
  '- 額装品: 3000円',
  '- キーホルダー: 1000円',
  '- その他の小物: 1000円',
  '',

  '### サイズによる価格ルール',
  '',
  '商品カテゴリを明確に判断できない場合のみ、',
  '画像から分かるおおまかな大きさを使って価格を決めてください。',
  '',
  '- 手のひらサイズ程度: 1000円',
  '- マグカップ程度: 2000円',
  '- Tシャツ程度: 2500円',
  '- リュック程度: 3500円',
  '- 大きな衣類程度: 5000円',
  '',
  '商品カテゴリを判定できる場合は、サイズルールではなくカテゴリルールを優先してください。',
  '',
  '画像だけでは絶対的なサイズを判断できない場合は、',
  '周囲の物との相対的な大きさから無理のない範囲で分類してください。',
  '',

  '### 状態による価格補正',
  '',
  '状態を画像から明確に判定できる場合のみ、以下を適用してください。',
  '',
  '- 未使用・新品だと明確に確認できる: 基本価格 × 1.2',
  '- 通常の中古品: 基本価格 × 1.0',
  '- 明確な傷・汚れ・破損がある: 基本価格 × 0.7',
  '',
  '状態を判断できない場合は補正しません。',
  'つまり基本価格 × 1.0 としてください。',
  '',

  '### 価格の丸め',
  '',
  '- 最終価格は100円単位に丸める。',
  '- 例: 2040円 → 2000円',
  '- 例: 2460円 → 2500円',
  '',

  '### 価格判定で禁止すること',
  '',
  '- ブランドだから高くする',
  '- 大学・芸能人・キャラクター関連だから高くする',
  '- レアそうだから高くする',
  '- ネット上の相場を知っている前提で価格を決める',
  '- 出品者の既存商品の価格を参考にする',
  '- 理由なく基本価格から変更する',
  '',

  'priceRule には、実際に使ったルールを短く返してください。',
  '',
  '例:',
  '- mug',
  '- tshirt',
  '- hoodie',
  '- bag',
  '- mascot',
  '- small_item',
  '- size_mug',
  '- size_hand',
  '',
  'priceReason には、価格を決めた理由を日本語で1文で書いてください。',
  '',
  'priceConfidence は、価格ルールをどれだけ明確に適用できたかを0〜1で返してください。',
  '商品カテゴリが明確なら高く、カテゴリもサイズも曖昧なら低くしてください。',
  '',


  // ───────────────────────────────────────
  // Few-shot examples
  // ───────────────────────────────────────

  '## 価格判定の例',
  '',

  '例1:',
  '画像: 白いマグカップ',
  '商品カテゴリ: マグカップ',
  '状態: 写真から判断できない',
  '',
  '→ マグカップの基本価格を使用する。',
  'estimatedPrice = 2000',
  'priceRule = "mug"',
  'priceReason = "マグカップの基本価格2,000円を適用しました。"',
  'priceConfidence = 0.98',
  '',

  '例2:',
  '画像: えんじ色のTシャツ',
  '商品カテゴリ: Tシャツ',
  '状態: 写真から判断できない',
  '',
  '→ Tシャツの基本価格を使用する。',
  'estimatedPrice = 2500',
  'priceRule = "tshirt"',
  'priceReason = "Tシャツの基本価格2,500円を適用しました。"',
  'priceConfidence = 0.95',
  '',

  '例3:',
  '画像: 小型のマスコット',
  '商品カテゴリ: マスコット',
  '状態: 写真から判断できない',
  '',
  '→ マスコットの基本価格を使用する。',
  'estimatedPrice = 1500',
  'priceRule = "mascot"',
  'priceReason = "マスコットの基本価格1,500円を適用しました。"',
  'priceConfidence = 0.95',
  '',

  '例4:',
  '画像: 商品カテゴリは不明だが、マグカップ程度の大きさの小物',
  '',
  '→ カテゴリを特定できないためサイズルールを使用する。',
  'estimatedPrice = 2000',
  'priceRule = "size_mug"',
  'priceReason = "カテゴリを特定できないため、マグカップ程度のサイズ基準2,000円を適用しました。"',
  'priceConfidence = 0.65',
  '',

  '例5:',
  '画像: パーカー',
  '状態: 明確な汚れあり',
  '',
  '→ パーカーの基本価格4,000円 × 0.7。',
  'estimatedPrice = 2800',
  'priceRule = "hoodie"',
  'priceReason = "パーカーの基本価格4,000円に、明確な汚れによる0.7倍の補正を適用しました。"',
  'priceConfidence = 0.90',
  '',

  '例6:',
  '画像: 大学ロゴが入った白いマグカップ',
  '',
  '→ 大学ロゴや希少性は価格に反映しない。',
  '→ 通常のマグカップとして扱う。',
  'estimatedPrice = 2000',
  'priceRule = "mug"',
  'priceReason = "ロゴや希少性は考慮せず、マグカップの基本価格2,000円を適用しました。"',
  'priceConfidence = 0.98',
  '',


  // ───────────────────────────────────────
  // existing item matching
  // ───────────────────────────────────────

  '## matchedItemId',
  '',
  '- matchedItemId は、出品者が登録済みの商品と同一商品だと確信できる場合のみ設定する。',
  '- 少しでも別物の可能性があれば null。',
  '- 色違い・別バージョン・似ているだけの商品は別物として扱う。',
  '- matchedItemId の判断と価格判定は独立して行う。',
  '- 登録済み商品だから価格を変更してはいけない。'

].join('\n');


// ─────────────────────────────────────────────
// User Prompt
// ─────────────────────────────────────────────

function buildUserPrompt(ownedItems) {
  var lines = [
    'この商品写真をフリマアプリへ出品するための情報を作成してください。',
    '',
    '画像認識 → 出品情報生成 → 簡易価格ルールによる価格決定、の順で処理してください。',
    '',
    'estimatedPrice は実際の市場価格を推測せず、',
    'System Prompt に記載された簡易価格表だけを使って決定してください。',
    '',
    '複数枚ある場合は同一商品の別カットとして扱い、まとめて1件の出品情報にしてください。'
  ];

  if (ownedItems.length) {
    lines.push('');
    lines.push('出品者がすでに登録しているグッズ一覧:');

    ownedItems.forEach(function (item) {
      lines.push(
        '- id: ' +
        item.id +
        ' / 名前: ' +
        item.name
      );
    });

    lines.push('');
    lines.push(
      '写真の商品がこの中の商品と同一商品だと確信できる場合のみ、matchedItemId にその id を入れてください。'
    );

    lines.push(
      '登録済み商品の名前や存在は estimatedPrice の判断には使用しないでください。'
    );
  }

  return lines.join('\n');
}


// ─────────────────────────────────────────────
// Structured Output
// ─────────────────────────────────────────────

var RESPONSE_SCHEMA = {
  type: Type.OBJECT,

  properties: {
    title: {
      type: Type.STRING,
      description: '出品用の商品タイトル（40文字以内）'
    },

    category: {
      type: Type.STRING,
      description: '商品カテゴリ'
    },

    brand: {
      type: Type.STRING,
      nullable: true,
      description: '判別できたブランド。不明なら null'
    },

    color: {
      type: Type.STRING,
      description: '主な色'
    },

    condition: {
      type: Type.STRING,
      description: '画像から言える範囲の商品状態'
    },

    description: {
      type: Type.STRING,
      description: '自然な日本語の出品説明文'
    },

    missingFields: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING
      },
      description: 'ユーザーへの確認が必要な項目キー'
    },

    confidence: {
      type: Type.NUMBER,
      description: '出品情報全体の確信度 0〜1'
    },

    estimatedPrice: {
      type: Type.NUMBER,
      description: '簡易価格ルールから決定した推奨価格（円、整数）'
    },

    priceRule: {
      type: Type.STRING,
      description: '価格決定に使ったルール。例: mug, tshirt, hoodie, mascot, size_mug'
    },

    priceReason: {
      type: Type.STRING,
      description: '価格を決定した理由を日本語で1文'
    },

    priceConfidence: {
      type: Type.NUMBER,
      description: '価格ルール適用への確信度 0〜1'
    },

    matchedItemId: {
      type: Type.STRING,
      nullable: true,
      description: '既存登録グッズと同一ならその id。なければ null'
    }
  },

  required: [
    'title',
    'category',
    'brand',
    'color',
    'condition',
    'description',
    'missingFields',
    'confidence',
    'estimatedPrice',
    'priceRule',
    'priceReason',
    'priceConfidence',
    'matchedItemId'
  ],

  propertyOrdering: [
    'title',
    'category',
    'brand',
    'color',
    'condition',
    'description',
    'missingFields',
    'confidence',
    'estimatedPrice',
    'priceRule',
    'priceReason',
    'priceConfidence',
    'matchedItemId'
  ]
};


// ─────────────────────────────────────────────
// Gemini Client
// ─────────────────────────────────────────────

var client = null;

function getClient() {
  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  return client;
}


function toText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}


// ─────────────────────────────────────────────
// Normalize
// ─────────────────────────────────────────────

function normalize(raw, ownedItems) {

  var missing = Array.isArray(raw.missingFields)
    ? raw.missingFields
        .map(toText)
        .filter(Boolean)
        .slice(0, 6)
    : [];


  var confidence = Number(raw.confidence);

  if (!isFinite(confidence)) {
    confidence = 0;
  }


  var priceConfidence = Number(raw.priceConfidence);

  if (!isFinite(priceConfidence)) {
    priceConfidence = 0;
  }


  // デモ用価格なので100円単位に丸める。
  var price = Number(raw.estimatedPrice);

  if (!isFinite(price) || price <= 0) {
    price = null;
  } else {
    price = Math.round(price / 100) * 100;
    price = Math.max(
      100,
      Math.min(1000000, price)
    );
  }


  // 実在しない ID を Gemini が返した場合は null にする。
  var matchedItemId =
    toText(raw.matchedItemId) || null;

  if (
    matchedItemId &&
    !ownedItems.some(function (item) {
      return item.id === matchedItemId;
    })
  ) {
    matchedItemId = null;
  }


  return {
    title:
      toText(raw.title) ||
      '商品',

    category:
      toText(raw.category) ||
      '未分類',

    brand:
      toText(raw.brand) ||
      null,

    color:
      toText(raw.color) ||
      '',

    condition:
      toText(raw.condition) ||
      '',

    description:
      toText(raw.description) ||
      '',

    missingFields:
      missing,

    confidence:
      Math.max(
        0,
        Math.min(1, confidence)
      ),

    estimatedPrice:
      price,

    priceRule:
      toText(raw.priceRule) ||
      'unknown',

    priceReason:
      toText(raw.priceReason) ||
      '簡易価格ルールから価格を決定しました。',

    priceConfidence:
      Math.max(
        0,
        Math.min(1, priceConfidence)
      ),

    matchedItemId:
      matchedItemId
  };
}


// ─────────────────────────────────────────────
// Analyze
// ─────────────────────────────────────────────

/**
 * @param {Array<{buffer: Buffer, mimetype: string}>} files
 *   multer のメモリ上ファイル
 *
 * @param {Array<{id: string, name: string}>} ownedItems
 *   出品者が登録済みのグッズ
 *
 * @returns {Promise<object>}
 *   正規化済みの出品情報
 */
function analyzeImages(files, ownedItems) {

  ownedItems =
    Array.isArray(ownedItems)
      ? ownedItems
      : [];


  var parts = files.map(function (file) {
    return {
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString('base64')
      }
    };
  });


  parts.push({
    text: buildUserPrompt(ownedItems)
  });


  function callModel(model) {

    return getClient().models.generateContent({
      model: model,

      contents: [
        {
          role: 'user',
          parts: parts
        }
      ],

      config: {
        systemInstruction: SYSTEM_PROMPT,

        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,

        temperature: 0.2,

        // デモでは速度優先。
        thinkingConfig: {
          thinkingLevel: 'low'
        }
      }

    }).then(function (response) {

      var text = response.text;

      if (!text) {
        throw new Error('EMPTY_RESPONSE');
      }

      return normalize(
        JSON.parse(text),
        ownedItems
      );
    });
  }


  return withTimeout(
    callModel(MODEL),
    TIMEOUT_MS,
    MODEL
  ).catch(function (error) {

    console.warn(
      '[gemini] ' +
      MODEL +
      ' 失敗。' +
      FALLBACK_MODEL +
      ' で再試行:',
      error && error.message
    );

    return withTimeout(
      callModel(FALLBACK_MODEL),
      FALLBACK_TIMEOUT_MS,
      FALLBACK_MODEL
    );
  });
}


module.exports = analyzeImages;