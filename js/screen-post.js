(function (global) {
  'use strict';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }

  // Gemini の missingFields キーを画面表示用の日本語へ。未知のキーはそのまま出す。
  var MISSING_FIELD_LABELS = {
    size: 'サイズ',
    brand: 'ブランド',
    condition: '商品の状態',
    color: '色',
    category: 'カテゴリ',
    material: '素材',
    model: '型番',
    accessories: '付属品',
    price: '価格',
    title: '商品名'
  };

  function missingFieldLabel(key) {
    return MISSING_FIELD_LABELS[key] || key;
  }

  function postHeader(stepLabel) {
    return '<header class="top-app-bar compact-bar"><div><span class="eyebrow">NEW POST</span><h1>＋投稿</h1></div><span class="step-label">' + stepLabel + '</span></header>';
  }

  function renderSelect() {
    return [
      '<section class="screen screen-post">',
        postHeader('1 / 2'),
        '<div class="screen-scroll post-select-wrap">',
          '<div class="post-lead"><span class="big-sparkle">✦</span><h2>新しい「好き」を<br>記録しよう</h2><p>写真からグッズ名と相場をAIが提案します</p></div>',
          '<label class="upload-dropzone" for="post-file">',
            '<img src="assets/img/acsta2.svg" alt="デモ用のステラ アクリルスタンド">',
            '<span class="upload-overlay"><b>カメラロールから選ぶ</b><small>選んだ写真をAIが分析します</small></span>',
          '</label>',
          '<input class="sr-only" id="post-file" data-post-file type="file" accept="image/*">',
          '<div class="privacy-note"><span>✧</span><p><strong>写真は公開前に確認できます</strong><br>AI解析結果は自由に直せます</p></div>',
        '</div>',
      '</section>'
    ].join('');
  }

  function renderAnalyzing(state) {
    var photo = state.post.imageUrl || 'assets/img/acsta2.svg';
    return [
      '<section class="screen screen-post">',
        postHeader('AI解析'),
        '<div class="analysis-stage">',
          '<div class="analysis-photo"><img src="' + escapeHtml(photo) + '" alt="解析中の商品写真"><span class="scan-line"></span><i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i></div>',
          '<div class="ai-spinner" aria-hidden="true"><span></span></div>',
          '<h2>AIが商品を分析中…</h2>',
          '<p>写真から出品情報を作成しています</p>',
          '<div class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></div>',
        '</div>',
      '</section>'
    ].join('');
  }

  function renderResult(state) {
    var fallback = AI_RESULTS['acsta2.svg'];
    var analysis = state.post.analysis;

    // Gemini の結果が取れていればそれを、失敗・未接続なら従来の仕込みデータを使う。
    var photo = state.post.imageUrl || fallback.image;
    var title = analysis ? analysis.title : fallback.name;
    var condition = (analysis && analysis.condition) || fallback.state;
    var tags = analysis
      ? [analysis.category, analysis.brand, analysis.color].filter(function (tag) { return Boolean(tag); })
      : fallback.tags;
    var headNote = analysis
      ? 'Gemini · 確信度 ' + Math.round(analysis.confidence * 100) + '%'
      : '仕込みデータ';
    var missing = (analysis && analysis.missingFields) || [];

    // 実際に資産へ加算される相場を出す。
    // 既存グッズに同定されたらその相場、新規なら Gemini の推定額。
    var matched = analysis && analysis.matchedItemId ? AppState.getItem(analysis.matchedItemId) : null;
    var price = fallback.price;
    var priceNote = '参考：メルカリ成約データ';
    if (matched) {
      price = matched.marketPrice;
      priceNote = '参考：登録済みの相場';
    } else if (analysis && analysis.estimatedPrice) {
      price = analysis.estimatedPrice;
      priceNote = '✦ Geminiの推定相場';
    }

    return [
      '<section class="screen screen-post">',
        postHeader('2 / 2'),
        '<div class="screen-scroll post-form-scroll">',
          state.post.analysisError ? '<div class="ai-error-note"><span>!</span><p>' + escapeHtml(state.post.analysisError) + '</p></div>' : '',
          '<div class="ai-result-card">',
            '<div class="ai-result-head"><span>✦ AI解析結果</span><small>' + escapeHtml(headNote) + '</small></div>',
            '<div class="ai-result-main">',
              '<img src="' + escapeHtml(photo) + '" alt="' + escapeHtml(title) + '">',
              '<div><h2>' + escapeHtml(title) + '</h2><div class="tag-row">' + tags.map(function (tag) { return '<span>' + escapeHtml(tag) + '</span>'; }).join('') + '</div><p>状態 <strong>' + escapeHtml(condition) + '</strong></p></div>',
            '</div>',
            '<div class="market-box"><span>現在の相場</span><strong>' + AppState.formatYen(price) + '</strong><small>' + escapeHtml(priceNote) + '</small></div>',
          '</div>',
          missing.length ? [
            '<div class="ai-missing-note">',
              '<b>あと' + missing.length + '点だけ教えてください</b>',
              '<ul>' + missing.map(function (key) { return '<li>' + escapeHtml(missingFieldLabel(key)) + 'を確認してください</li>'; }).join('') + '</ul>',
            '</div>'
          ].join('') : '',
          '<div class="form-card">',
            '<div class="form-row"><div><label>個数</label><small>実物を見て確定</small></div><div class="stepper" aria-label="投稿する個数"><button type="button" data-post-count="-1" aria-label="個数を減らす"' + (state.post.count <= 1 ? ' disabled' : '') + '>−</button><strong>' + state.post.count + '</strong><button type="button" data-post-count="1" aria-label="個数を増やす">＋</button></div></div>',
            '<div class="form-row"><div><label>譲ります</label><small>次のオタクへ継承する</small></div><button type="button" class="switch' + (state.post.giveaway ? ' is-on' : '') + '" data-giveaway aria-pressed="' + state.post.giveaway + '"><span></span></button></div>',
            '<label class="caption-field">キャプション<textarea data-caption rows="3" placeholder="お迎えした気持ちを書こう">' + escapeHtml(state.post.caption) + '</textarea></label>',
          '</div>',
          '<button class="primary-button post-submit" type="button" data-submit-post><span>投稿する</span><b>✦</b></button>',
          '<p class="micro-copy">投稿するとポートフォリオにも追加されます</p>',
        '</div>',
      '</section>'
    ].join('');
  }

  function renderComplete(state) {
    var item = AppState.getItem(state.postedItemId);
    var price = item ? item.marketPrice : 3200;
    var addedValue = price * state.post.count;
    // 既存グッズの2個目以降だけ、継承（出品）を勧める。
    var isDuplicate = Boolean(item && item.count >= 2);
    var thumb = item ? item.thumb : 'assets/img/item-acsta.svg';
    var label = item ? (item.shortName || item.name) : 'ステラのアクスタ';

    var card = isDuplicate ? [
      '<article class="duplicate-alert">',
        '<div class="alert-kicker"><span>⚡</span> 重複アイテムを検出</div>',
        '<div class="alert-body"><img src="' + escapeHtml(thumb) + '" alt="' + escapeHtml(label) + '"><div><h3>' + escapeHtml(label) + '、<em>' + item.count + '個目</em>を検出。</h3><p>相場' + AppState.formatYen(price) + ' — 次のオタクに<br>継承しませんか?</p></div></div>',
        '<button type="button" class="inherit-button" data-open-draft>出品ドラフトを見る <span>›</span></button>',
        '<small>メルカリのあんしん取引へ移動します</small>',
      '</article>'
    ].join('') : [
      '<article class="duplicate-alert">',
        '<div class="alert-kicker"><span>✦</span> 資産に追加しました</div>',
        '<div class="alert-body"><img src="' + escapeHtml(thumb) + '" alt="' + escapeHtml(label) + '"><div><h3>' + escapeHtml(label) + '</h3><p>相場' + AppState.formatYen(price) + ' — 手放すなら<br>いま出品できます</p></div></div>',
        '<button type="button" class="inherit-button" data-open-draft>出品ドラフトを見る <span>›</span></button>',
        '<small>メルカリのあんしん取引へ移動します</small>',
      '</article>'
    ].join('');

    return [
      '<section class="screen screen-post post-complete-screen">',
        postHeader('完了'),
        '<div class="screen-scroll complete-scroll">',
          '<div class="success-block"><div class="success-orb">✓<span>✦</span></div><h2>投稿しました。</h2><p>ポートフォリオに追加 <strong>+' + AppState.formatYen(addedValue) + '</strong></p></div>',
          card,
          '<button type="button" class="text-button" data-post-again>もう1件投稿する</button>',
        '</div>',
      '</section>'
    ].join('');
  }

  global.Screens.post = {
    key: function (state) { return state.post.stage; },

    render: function () {
      var state = AppState.getState();
      if (state.post.stage === 'analyzing') {
        return renderAnalyzing(state);
      }
      if (state.post.stage === 'result') {
        return renderResult(state);
      }
      if (state.post.stage === 'complete') {
        return renderComplete(state);
      }
      return renderSelect();
    },

    bind: function (root) {
      var file = root.querySelector('[data-post-file]');
      if (file) {
        file.addEventListener('change', function () {
          if (file.disabled || !file.files || !file.files.length) {
            return;
          }
          file.disabled = true; // 解析中の再選択（二重送信）を防ぐ
          AppState.startPostAnalysis(file.files[0]);
        });
      }
      root.querySelectorAll('[data-post-count]').forEach(function (button) {
        button.addEventListener('click', function () {
          AppState.adjustPostCount(Number(button.getAttribute('data-post-count')));
        });
      });
      var giveaway = root.querySelector('[data-giveaway]');
      if (giveaway) {
        giveaway.addEventListener('click', function () { AppState.togglePostGiveaway(); });
      }
      var caption = root.querySelector('[data-caption]');
      if (caption) {
        caption.addEventListener('input', function () { AppState.setPostCaption(caption.value); });
      }
      var submit = root.querySelector('[data-submit-post]');
      if (submit) {
        submit.addEventListener('click', function () { AppState.submitPost(); });
      }
      var draft = root.querySelector('[data-open-draft]');
      if (draft) {
        draft.addEventListener('click', function () {
          AppState.prepareListing(AppState.getState().postedItemId || 'stella-acsta');
        });
      }
      var again = root.querySelector('[data-post-again]');
      if (again) {
        again.addEventListener('click', function () { AppState.resetPost(); });
      }
    }
  };
}(window));
