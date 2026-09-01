'use strict';

// 推しポート デモ用サーバ。
//   1) 既存の静的アプリ（index.html / styles.css / data.js / js / assets）を配信
//   2) POST /api/analyze で商品画像を Gemini に渡し、出品情報を JSON で返す
// GEMINI_API_KEY はこのプロセス内だけで使い、ブラウザへは一切送らない。

require('dotenv').config({ quiet: true });

var path = require('path');
var fs = require('fs');
var express = require('express');
var multer = require('multer');
var analyzeImages = require('./server/gemini');

var PORT = Number(process.env.PORT) || 3000;
var ROOT = __dirname;

var MAX_FILE_BYTES = 8 * 1024 * 1024; // 1枚あたり 8MB
var MAX_FILES = 4;
var ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

var app = express();
var STATIC_OPTIONS = {
  dotfiles: 'deny',
  // デモ開発中に古い JS/CSS がキャッシュから動かないよう毎回再検証させる。
  setHeaders: function (res) { res.setHeader('Cache-Control', 'no-cache'); }
};
var STATIC_TEXT = {
  indexHtml: fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'),
  stylesCss: fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8'),
  dataJs: fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8')
};

// ── アクセスログ ───────────────────────────────────────────
// ブラウザがこのサーバを見ているかを一目で分かるようにする。画像は多いので除外。
app.use(function (req, res, next) {
  if (!/^\/assets\//.test(req.path)) {
    console.log('[req] ' + req.method + ' ' + req.url);
  }
  next();
});

// ── 静的配信 ───────────────────────────────────────────────
app.get('/', function (req, res) { res.set('Cache-Control', 'no-cache').type('html').send(STATIC_TEXT.indexHtml); });
app.get('/index.html', function (req, res) { res.set('Cache-Control', 'no-cache').type('html').send(STATIC_TEXT.indexHtml); });
app.get('/styles.css', function (req, res) { res.set('Cache-Control', 'no-cache').type('text/css').send(STATIC_TEXT.stylesCss); });
app.get('/data.js', function (req, res) { res.set('Cache-Control', 'no-cache').type('application/javascript').send(STATIC_TEXT.dataJs); });
app.use('/assets', express.static(path.join(ROOT, 'assets'), STATIC_OPTIONS));
app.use('/js', express.static(path.join(ROOT, 'js'), STATIC_OPTIONS));

// ── POST /api/analyze ─────────────────────────────────────
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
  fileFilter: function (req, file, cb) {
    if (ALLOWED_MIME.indexOf(file.mimetype) === -1) {
      cb(new Error('UNSUPPORTED_TYPE'));
      return;
    }
    cb(null, true);
  }
});

// image を複数受け取れる形にしておく（現状フロントは1枚だけ送る）。
var uploadImages = upload.array('image', MAX_FILES);

app.post('/api/analyze', function (req, res) {
  uploadImages(req, res, function (uploadError) {
    if (uploadError) {
      var message = '画像を読み込めませんでした。';
      if (uploadError.code === 'LIMIT_FILE_SIZE') {
        message = '画像が大きすぎます（1枚あたり8MBまで）。';
      } else if (uploadError.message === 'UNSUPPORTED_TYPE') {
        message = '対応していない画像形式です（JPEG / PNG / WebP / HEIC）。';
      }
      res.status(400).json({ success: false, error: message });
      return;
    }

    var files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      res.status(400).json({ success: false, error: '画像が送信されていません。' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      // キー未設定はサーバ側の設定ミス。詳細は返さずログにだけ残す。
      console.error('[analyze] GEMINI_API_KEY が未設定です');
      res.status(503).json({ success: false, error: 'AI分析は現在利用できません。' });
      return;
    }

    console.log('[analyze] 受信 ' + files.length + '枚 (' + files.map(function (f) {
      return f.mimetype + ' ' + Math.round(f.size / 1024) + 'KB';
    }).join(', ') + ')');

    // フロントが送ってきた登録済みグッズ（同一商品の同定に使う）。
    var ownedItems = [];
    var itemsPayload = req.body && req.body.items;
    if (typeof itemsPayload !== 'string') {
      itemsPayload = '[]';
    }
    try {
      var parsed = JSON.parse(itemsPayload);
      if (Array.isArray(parsed)) {
        ownedItems = parsed.slice(0, 50).filter(function (item) {
          return item && typeof item.id === 'string' && typeof item.name === 'string';
        }).map(function (item) {
          return { id: item.id.slice(0, 64), name: item.name.slice(0, 120) };
        });
      }
    } catch (parseError) {
      ownedItems = [];
    }

    analyzeImages(files, ownedItems)
      .then(function (data) {
        console.log('[analyze] 成功: ' + data.title + ' / ' + (data.estimatedPrice === null ? '相場不明' : '¥' + data.estimatedPrice) +
          ' / 確信度 ' + data.confidence + (data.matchedItemId ? ' / 既存グッズ ' + data.matchedItemId + ' と同定' : ' / 新規'));
        res.json({ success: true, data: data });
      })
      .catch(function (error) {
        // Gemini のエラー本文はそのままユーザーへ出さない。
        console.error('[analyze] Gemini 呼び出しに失敗:', error && error.message);
        res.status(502).json({ success: false, error: 'AI分析に失敗しました。手動で入力してください。' });
      });
  });
});

app.listen(PORT, function () {
  console.log('推しポート demo: http://localhost:' + PORT);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('警告: GEMINI_API_KEY が未設定です。画像解析はフォールバック表示になります。');
  }
});
