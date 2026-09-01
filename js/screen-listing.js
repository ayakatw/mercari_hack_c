(function (global) {
  'use strict';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }

  function listingForm(item, aiDescription) {
    var description = aiDescription || ('STELLIGHT ステラの公式' + item.name.replace('ステラ ', '') + 'です。大切に保管していました。目立つ傷は見当たりませんが、写真をご確認ください。防水・緩衝材で丁寧に梱包して発送します。次のステラ推しの方に届いたらうれしいです。');
    var descriptionNote = aiDescription ? '✦ Geminiが作成' : '✦ AIで作成済み';
    return [
      '<section class="screen listing-screen">',
        '<header class="mercari-header"><button type="button" data-listing-back aria-label="戻る">‹</button><h1>メルカリに出品</h1><span>下書き</span></header>',
        '<div class="screen-scroll listing-scroll">',
          '<div class="external-banner"><span>推しポート</span><b>→</b><strong>メルカリ あんしん出品</strong></div>',
          '<section class="listing-section photo-section"><h2>商品の写真</h2><div class="listing-photo"><img src="' + escapeHtml(item.thumb) + '" alt="' + escapeHtml(item.name) + '"><span>1 / 1</span></div></section>',
          '<section class="listing-section"><h2>商品の情報</h2>',
            '<label class="listing-field"><span>商品名</span><input value="' + escapeHtml(item.name) + '" aria-label="商品名"></label>',
            '<label class="listing-field"><span>カテゴリー</span><input value="' + escapeHtml(item.category) + '" aria-label="カテゴリー"></label>',
            '<label class="listing-field"><span>商品の状態</span><input value="' + escapeHtml(item.condition) + '" aria-label="商品の状態"></label>',
          '</section>',
          '<section class="listing-section"><div class="section-title-line"><h2>商品説明</h2><span>' + descriptionNote + '</span></div><label class="listing-field"><textarea rows="7" aria-label="商品説明">' + escapeHtml(description) + '</textarea></label></section>',
          '<section class="listing-section price-section"><div><h2>販売価格</h2><p>相場から自動入力</p></div><label><span>¥</span><input value="' + item.marketPrice.toLocaleString('ja-JP') + '" inputmode="numeric" aria-label="販売価格"></label></section>',
          '<div class="fee-note"><span>販売手数料（10%）</span><strong>−¥' + Math.round(item.marketPrice * 0.1).toLocaleString('ja-JP') + '</strong><span>販売利益</span><strong>¥' + Math.round(item.marketPrice * 0.9).toLocaleString('ja-JP') + '</strong></div>',
          '<button type="button" class="mercari-submit" data-submit-listing>出品する</button>',
          '<p class="mercari-safe">本人確認・匿名配送・補償つきのあんしん取引</p>',
        '</div>',
      '</section>'
    ].join('');
  }

  function listingSuccess(item) {
    return [
      '<section class="screen listing-screen listing-success">',
        '<header class="mercari-header"><span></span><h1>メルカリに出品</h1><span></span></header>',
        '<div class="listing-success-body">',
          '<div class="mercari-success-icon">✓<span>🎉</span></div>',
          '<h2>出品しました🎉</h2>',
          '<p>売れたら売上金は<br><strong>推しポートに反映されます</strong></p>',
          '<div class="listed-mini-card"><img src="' + escapeHtml(item.thumb) + '" alt=""><div><span>出品中</span><h3>' + escapeHtml(item.name) + '</h3><strong>' + AppState.formatYen(item.marketPrice) + '</strong></div></div>',
          '<button type="button" class="mercari-submit" data-finish-listing>資産タブで確認する</button>',
          '<small>推しポートへ戻ります</small>',
        '</div>',
      '</section>'
    ].join('');
  }

  global.Screens.listing = {
    render: function () {
      var state = AppState.getState();
      var item = AppState.getItem(state.listing.itemId || 'stella-acsta');
      var displayItem = item;
      var aiDescription = null;
      var analysis = state.post.analysis;
      if (analysis && state.postedItemId === item.id) {
        // 直前に投稿した商品なら、Gemini の解析内容をそのまま出品フォームへ。
        displayItem = Object.assign({}, item, {
          thumb: state.post.imageUrl || item.thumb,
          name: analysis.title,
          category: analysis.category,
          condition: analysis.condition
        });
        aiDescription = analysis.description;
      } else if (item.id === 'stella-acsta' && state.postedDemo) {
        displayItem = Object.assign({}, item, {
          thumb: state.post.imageUrl || AI_RESULTS['acsta2.svg'].image,
          condition: AI_RESULTS['acsta2.svg'].state
        });
      }
      return state.listing.stage === 'success' ? listingSuccess(displayItem) : listingForm(displayItem, aiDescription);
    },

    bind: function (root) {
      var back = root.querySelector('[data-listing-back]');
      if (back) { back.addEventListener('click', function () { AppState.setRoute('assets'); }); }
      var submit = root.querySelector('[data-submit-listing]');
      if (submit) { submit.addEventListener('click', function () { AppState.submitListing(); }); }
      var finish = root.querySelector('[data-finish-listing]');
      if (finish) { finish.addEventListener('click', function () { AppState.finishListing(); }); }
    }
  };
}(window));
