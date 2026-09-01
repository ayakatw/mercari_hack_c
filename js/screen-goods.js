(function (global) {
  'use strict';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }

  function trendLabel(item) {
    return Number.isInteger(item.trend7d) ? item.trend7d.toFixed(0) : item.trend7d.toFixed(1);
  }

  function goodsRow(item, showPrices) {
    // 相場は「トグルON かつ 継承に出したグッズ」の両方が立ったときだけ出す。
    var withPrice = showPrices && item.status === 'listed';
    var rising = item.trend7d >= 0;
    return [
      '<article class="asset-row">',
        '<div class="asset-thumb-wrap"><img src="' + escapeHtml(item.thumb) + '" alt=""><span class="count-chip">×' + item.count + '</span></div>',
        '<div class="asset-copy">',
          '<div class="asset-name-line"><h3>' + escapeHtml(item.name) + '</h3>'
            + (item.duplicate ? '<span class="duplicate-badge">×2</span>' : '')
            + (item.status === 'listed' ? '<span class="listed-badge">出品中</span>' : '')
          + '</div>',
          withPrice ? '<p>継承時の相場 <strong>' + AppState.formatYen(item.marketPrice) + '</strong></p>' : '',
        '</div>',
        '<div class="asset-actions">',
          withPrice ? '<span class="trend ' + (rising ? 'up' : 'down') + '">' + (rising ? '+' : '') + trendLabel(item) + '%</span>' : '',
          '<button type="button" class="goods-inherit-button" data-inherit="' + escapeHtml(item.id) + '">継承する</button>',
        '</div>',
      '</article>'
    ].join('');
  }

  global.Screens.goods = {
    render: function () {
      var state = AppState.getState();
      var duplicateCount = state.items.filter(function (item) { return item.duplicate; }).length;
      var listedCount = state.items.filter(function (item) { return item.status === 'listed'; }).length;

      return [
        '<section class="screen screen-assets">',
          '<header class="top-app-bar compact-bar asset-topbar"><div><span class="eyebrow">MY GOODS</span><h1>グッズ</h1></div><span class="header-sparkle">✦</span></header>',
          '<div class="screen-scroll asset-scroll">',
            '<section class="goods-summary">',
              '<div><strong>' + state.items.length + '</strong><span>グッズ</span></div>',
              '<div><strong>' + duplicateCount + '</strong><span>継承できる</span></div>',
            '</section>',
            // 継承中が1件も無いときは出さない。押しても何も変わらないコントロールは置かない。
            listedCount ? [
              '<div class="goods-price-row">',
                '<div><label>相場を表示</label><small>継承中の' + listedCount + '点に表示します</small></div>',
                '<button type="button" class="switch' + (state.showPrices ? ' is-on' : '') + '" data-toggle-prices aria-pressed="' + state.showPrices + '" aria-label="相場の表示を切り替える"><span></span></button>',
              '</div>'
            ].join('') : '',
            '<div class="asset-section-head"><div><h2>グッズ一覧</h2><p>重複したグッズは次のオタクへ継承できます</p></div><span>' + state.items.length + '点</span></div>',
            '<div class="asset-list">' + state.items.map(function (item) { return goodsRow(item, state.showPrices); }).join('') + '</div>',
            '<p class="asset-footnote">相場は継承に出したグッズにのみ表示されます（メルカリの成約データをもとにした参考値）</p>',
          '</div>',
        '</section>'
      ].join('');
    },

    bind: function (root) {
      root.querySelectorAll('[data-inherit]').forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          AppState.prepareListing(button.getAttribute('data-inherit'));
        });
      });
      var toggle = root.querySelector('[data-toggle-prices]');
      if (toggle) {
        toggle.addEventListener('click', function () { AppState.toggleShowPrices(); });
      }
    }
  };
}(window));
