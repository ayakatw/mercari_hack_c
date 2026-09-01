'use strict';

// Gemini 呼び出しとプロンプト管理。API キーはここ（サーバ側）にのみ存在する。

var genai = require('@google/genai');
var GoogleGenAI = genai.GoogleGenAI;
var Type = genai.Type;

// デモでは速度が最優先。Gemini 側の負荷でモデルの応答時間は日によって大きく振れる
// （gemini-3.6-flash は 2.2秒 → 81.9秒 の実測差があった）ため、
// 速い lite 系を主にし、遅い場合はエラーを待たずタイムアウトで切って退避する。
// 当日賢いモデルを試したいときは GEMINI_MODEL で上書きできる。
var MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
var FALLBACK_MODEL = 'gemini-3.1-flash-lite';
var TIMEOUT_MS = 12000;
var FALLBACK_TIMEOUT_MS = 20000;

// SDK 自体は遅延で失敗しないので、こちらで打ち切る。
function withTimeout(promise, ms, label) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () {
      reject(new Error('TIMEOUT ' + label + ' が ' + ms + 'ms 以内に応答しませんでした'));
    }, ms);
    promise.then(
      function (value) { clearTimeout(timer); resolve(value); },
      function (error) { clearTimeout(timer); reject(error); }
    );
  });
}

// 「フリマアプリの出品情報を作る Agent」としての役割定義。
var SYSTEM_PROMPT = [
  'あなたは日本のフリマアプリの出品アシスタントAgentです。',
  '出品者がアップロードした商品写真を見て、そのまま出品フォームに入れられる情報を作成します。',
  '単なる物体認識ではなく、「売るための出品情報を整える担当者」として振る舞ってください。',
  '',
  '絶対に守るルール:',
  '- 画像から実際に確認できることだけを断定する。写り込んでいない情報を推測で埋めない。',
  '- ブランドはロゴ・タグ・刻印などで明確に判別できる場合のみ記入する。判別できなければ null。',
  '- サイズ・型番・素材・付属品など画像だけでは判断できない項目は missingFields に入れる。',
  '- condition は画像から明確に読み取れる場合のみ具体的に書く。判断できない場合は',
  '  「写真からは判断できません」のように断定を避け、missingFields にも condition を入れる。',
  '- 推測と確認済み情報を混同しない。description に憶測を事実として書かない。',
  '',
  '各項目の作り方:',
  '- title: フリマアプリの商品タイトル。40文字以内。「ブランド + 色 + アイテム名」のように簡潔に。',
  '  煽り文句・記号の装飾・「美品！」のような断定的な状態表現は入れない。',
  '- category: 日本のフリマアプリで使われる一般的なカテゴリ名（例: トップス / アクセサリー / フィギュア）。',
  '- brand: 判別できたブランド名。できなければ null。',
  '- color: 主な色を日本語で1語（例: グレー、ネイビー）。',
  '- condition: 「未使用に近い」「目立った傷や汚れなし」など、画像から言える範囲の状態。',
  '- description: 自然な日本語の出品説明文。2〜4文。画像から分かる特徴を中心に、丁寧語で書く。',
  '  最後に、画像から確認できない点があれば「サイズは商品タグをご確認ください」のように補足してよい。',
  '- missingFields: 出品前に出品者本人の確認が必要な項目名を英語の短いキーで挙げる',
  '  （例: size, condition, brand, material, accessories, model）。無ければ空配列。',
  '- confidence: 分析全体の確信度を 0〜1 の小数で。断定できない要素が多いほど低くする。',
  '- estimatedPrice: 日本のフリマアプリで売れそうな価格の目安（円、整数）。',
  '  相場が読めない場合も、状態と種類から妥当な中央値を1つ出す。0 や極端な値は出さない。',
  '- matchedItemId: 出品者がすでに登録しているグッズと「同一商品」だと確信できる場合だけ、その id。',
  '  少しでも別物の可能性があれば null。色違い・別バージョンは別物として null にする。'
].join('\n');

function buildUserPrompt(ownedItems) {
  var lines = [
    'この商品写真をフリマアプリへ出品するための情報を作成してください。',
    '複数枚ある場合は同一商品の別カットとして扱い、まとめて1件の出品情報にしてください。'
  ];
  if (ownedItems.length) {
    lines.push('');
    lines.push('出品者がすでに登録しているグッズ一覧:');
    ownedItems.forEach(function (item) {
      lines.push('- id: ' + item.id + ' / 名前: ' + item.name);
    });
    lines.push('写真の商品がこの中の同一商品だと確信できるときだけ matchedItemId にその id を入れてください。');
  }
  return lines.join('\n');
}

// Structured Output。自由文の JSON.parse に依存しないための応答スキーマ。
var RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: '出品用の商品タイトル（40文字以内）' },
    category: { type: Type.STRING, description: '商品カテゴリ' },
    brand: { type: Type.STRING, nullable: true, description: '判別できたブランド。不明なら null' },
    color: { type: Type.STRING, description: '主な色' },
    condition: { type: Type.STRING, description: '画像から言える範囲の商品状態' },
    description: { type: Type.STRING, description: '自然な日本語の出品説明文' },
    missingFields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'ユーザーへの確認が必要な項目キー'
    },
    confidence: { type: Type.NUMBER, description: '分析全体の確信度 0〜1' },
    estimatedPrice: { type: Type.NUMBER, description: 'フリマアプリでの想定売却価格（円、整数）' },
    matchedItemId: { type: Type.STRING, nullable: true, description: '既存登録グッズと同一ならその id。なければ null' }
  },
  required: ['title', 'category', 'brand', 'color', 'condition', 'description', 'missingFields', 'confidence', 'estimatedPrice', 'matchedItemId'],
  propertyOrdering: ['title', 'category', 'brand', 'color', 'condition', 'description', 'missingFields', 'confidence', 'estimatedPrice', 'matchedItemId']
};

var client = null;

function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

function toText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Structured Output でも念のため形を整えてからフロントへ返す。
function normalize(raw, ownedItems) {
  var missing = Array.isArray(raw.missingFields)
    ? raw.missingFields.map(toText).filter(Boolean).slice(0, 6)
    : [];
  var confidence = Number(raw.confidence);
  if (!isFinite(confidence)) {
    confidence = 0;
  }
  // 価格は資産計算に使うので妥当な範囲へ丸める。
  var price = Math.round(Number(raw.estimatedPrice));
  if (!isFinite(price) || price <= 0) {
    price = null;
  } else {
    price = Math.max(100, Math.min(1000000, price));
  }

  // 存在しない id を返してくることがあるため、実在するものだけ通す。
  var matchedItemId = toText(raw.matchedItemId) || null;
  if (matchedItemId && !ownedItems.some(function (item) { return item.id === matchedItemId; })) {
    matchedItemId = null;
  }

  return {
    title: toText(raw.title) || '商品',
    category: toText(raw.category) || '未分類',
    brand: toText(raw.brand) || null,
    color: toText(raw.color) || '',
    condition: toText(raw.condition) || '',
    description: toText(raw.description) || '',
    missingFields: missing,
    confidence: Math.max(0, Math.min(1, confidence)),
    estimatedPrice: price,
    matchedItemId: matchedItemId
  };
}

/**
 * @param {Array<{buffer: Buffer, mimetype: string}>} files multer のメモリ上ファイル
 * @param {Array<{id: string, name: string}>} ownedItems 出品者が登録済みのグッズ
 * @returns {Promise<object>} 正規化済みの出品情報
 */
function analyzeImages(files, ownedItems) {
  ownedItems = Array.isArray(ownedItems) ? ownedItems : [];
  var parts = files.map(function (file) {
    return {
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString('base64')
      }
    };
  });
  parts.push({ text: buildUserPrompt(ownedItems) });

  function callModel(model) {
    return getClient().models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: parts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
        // 出品情報の抽出に長考は要らない。デモの待ち時間を短くする。
        thinkingConfig: { thinkingLevel: 'low' }
      }
    }).then(function (response) {
      var text = response.text;
      if (!text) {
        throw new Error('EMPTY_RESPONSE');
      }
      return normalize(JSON.parse(text), ownedItems);
    });
  }

  return withTimeout(callModel(MODEL), TIMEOUT_MS, MODEL).catch(function (error) {
    console.warn('[gemini] ' + MODEL + ' 失敗。' + FALLBACK_MODEL + ' で再試行:', error && error.message);
    return withTimeout(callModel(FALLBACK_MODEL), FALLBACK_TIMEOUT_MS, FALLBACK_MODEL);
  });
}

module.exports = analyzeImages;
