(function (global) {
  'use strict';

  var portfolioChart = null;
  var detailChart = null;

  function buildPortfolioHistory(state) {
    var demoAdded = state.postedDemo ? state.post.count : 0;
    return HISTORY_LABELS.map(function (_, index) {
      var value = state.items.reduce(function (sum, item) {
        var count = item.count;
        if (item.id === 'stella-acsta' && demoAdded) {
          count -= demoAdded;
        }
        return sum + (item.history30d[index] * count);
      }, 0);
      if (demoAdded && index === HISTORY_LABELS.length - 1) {
        value += 3200 * demoAdded;
      }
      return value;
    });
  }

  function assetRow(item) {
    var rising = item.trend7d >= 0;
    var isEvent = item.id === 'stella-card';
    var trendLabel = Number.isInteger(item.trend7d) ? item.trend7d.toFixed(0) : item.trend7d.toFixed(1);
    return [
      '<article class="asset-row' + (isEvent ? ' is-interactive' : '') + '"' + (isEvent ? ' data-asset-detail="' + item.id + '" aria-label="ステラのトレカの価格推移を見る"' : '') + '>',
        '<div class="asset-thumb-wrap"><img src="' + item.thumb + '" alt=""><span class="count-chip">×' + item.count + '</span></div>',
        '<div class="asset-copy"><div class="asset-name-line"><h3>' + item.name + '</h3>' + (item.duplicate ? '<span class="duplicate-badge">×2</span>' : '') + (item.status === 'listed' ? '<span class="listed-badge">出品中</span>' : '') + '</div><p>現在相場 <strong>' + AppState.formatYen(item.marketPrice) + '</strong></p></div>',
        '<div class="asset-actions"><span class="trend ' + (rising ? 'up' : 'down') + '">' + (rising ? '+' : '') + trendLabel + '%</span><button type="button" class="sell-button" data-sell="' + item.id + '">売る</button></div>',
        isEvent ? '<span class="row-chevron" aria-hidden="true">›</span>' : '',
      '</article>'
    ].join('');
  }

  function detailModal(item) {
    if (!item) {
      return '';
    }
    return [
      '<div class="modal-layer" data-close-detail>',
        '<section class="modal-sheet asset-modal" role="dialog" aria-modal="true" aria-labelledby="asset-detail-title">',
          '<div class="sheet-handle" aria-hidden="true"></div>',
          '<button type="button" class="modal-close" data-close-detail-button aria-label="閉じる">×</button>',
          '<div class="modal-item-head"><img src="' + item.thumb + '" alt=""><div><span class="event-chip">急騰 +18%</span><h2 id="asset-detail-title">' + item.name + '</h2><p>現在相場 <strong>¥18,000</strong></p></div></div>',
          '<div class="detail-chart-box"><canvas id="detail-chart" aria-label="ステラのトレカの30日価格推移"></canvas><div class="detail-event"><span>8/21</span><strong>日本ツアー発表 +18%</strong></div></div>',
          '<p class="chart-disclaimer">メルカリの成約データをもとにした参考相場です</p>',
          '<button type="button" class="primary-button" data-modal-sell="' + item.id + '">このグッズを売る</button>',
        '</section>',
      '</div>'
    ].join('');
  }

  function drawFallback(canvas, values, color) {
    if (!canvas || !canvas.getContext) {
      return;
    }
    var ratio = global.devicePixelRatio || 1;
    var width = canvas.clientWidth || 320;
    var height = canvas.clientHeight || 160;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    var ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    values.forEach(function (value, index) {
      var x = 8 + ((width - 16) * index / (values.length - 1));
      var y = height - 15 - ((value - min) / Math.max(1, max - min)) * (height - 30);
      if (index === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    });
    ctx.stroke();
  }

  // Chart.js と canvas は CSS 変数を解釈しないので、実際に計算された値を読む。
  // 参照先は必ず素の16進を持つ Layer 1 のトークンにする（color-mix は canvas が解せない）。
  function token(name, fallback) {
    var value = global.getComputedStyle(global.document.documentElement)
      .getPropertyValue(name).trim();
    return value || fallback;
  }

  function tokenAlpha(name, alpha, fallback) {
    var hex = token(name, fallback).replace('#', '');
    if (hex.length === 3) { hex = hex.split('').map(function (c) { return c + c; }).join(''); }
    if (hex.length !== 6) { return fallback; }
    return 'rgba(' + parseInt(hex.slice(0, 2), 16) + ',' + parseInt(hex.slice(2, 4), 16) +
      ',' + parseInt(hex.slice(4, 6), 16) + ',' + alpha + ')';
  }

  function eventMarkerPlugin() {
    return {
      id: 'oshiEventMarker',
      afterDatasetsDraw: function (chart) {
        var xScale = chart.scales.x;
        var area = chart.chartArea;
        if (!xScale || !area) { return; }
        var x = xScale.getPixelForValue(18);
        var ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = token('--orange', '#ff8a50');
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, area.top + 2);
        ctx.lineTo(x, area.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = token('--orange', '#ff8a50');
        ctx.beginPath();
        ctx.arc(x, area.top + 7, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };
  }

  function createLineChart(canvas, labels, values, detail) {
    if (!canvas) { return null; }
    if (!global.Chart) {
      drawFallback(canvas, values, detail ? token('--b1', '#7d65dc') : '#ffffff');
      return null;
    }
    var context = canvas.getContext('2d');
    var gradient = context.createLinearGradient(0, 0, 0, detail ? 180 : 150);
    gradient.addColorStop(0, detail ? tokenAlpha('--b1', 0.3, '#7d65dc') : 'rgba(255,255,255,.36)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    return new Chart(context, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          borderColor: detail ? token('--b1', '#7d65dc') : '#ffffff',
          backgroundColor: gradient,
          borderWidth: detail ? 2.5 : 2.2,
          fill: true,
          tension: 0.38,
          pointRadius: 0,
          pointHoverRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 550 },
        interaction: { intersect: false },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false, grid: { display: false } },
          y: { display: false, grid: { display: false }, grace: '8%' }
        }
      },
      plugins: [eventMarkerPlugin()]
    });
  }

  global.Screens.assets = {
    render: function () {
      var state = AppState.getState();
      var total = AppState.getTotal();
      var detailItem = state.assetDetailItemId ? AppState.getItem(state.assetDetailItemId) : null;
      return [
        '<section class="screen screen-assets">',
          '<header class="top-app-bar compact-bar asset-topbar"><div><span class="eyebrow">MY PORTFOLIO</span><h1>資産</h1></div><span class="header-sparkle">✦</span></header>',
          '<div class="screen-scroll asset-scroll">',
            '<section class="portfolio-hero">',
              '<div class="portfolio-label"><span>✦</span> 現金化可能額 <i aria-hidden="true">?</i></div>',
              '<h2>' + AppState.formatYen(total) + '</h2>',
              state.postedDemo ? '<p class="day-change">前日比 <strong>+¥2,300 (+2.8%)</strong></p>' : '<p class="day-change initial">祭壇登録時点・7アイテム</p>',
              '<div class="portfolio-chart-wrap"><canvas id="portfolio-chart" aria-label="ポートフォリオ総額の30日推移"></canvas></div>',
              '<div class="chart-dates"><span>30日前</span><span>今日</span></div>',
              '<div class="event-callout"><span class="event-bolt">⚡</span><div><small>8/21 EVENT</small><strong>ステライト 日本ツアー発表 <em>+18%</em></strong></div></div>',
            '</section>',
            '<div class="asset-section-head"><div><h2>グッズ一覧</h2><p>相場は毎日自動で更新</p></div><span>' + state.items.length + '種類</span></div>',
            '<div class="asset-list">' + state.items.map(assetRow).join('') + '</div>',
            '<p class="asset-footnote">価格はメルカリの成約データをもとに算出した参考値です</p>',
          '</div>',
          detailModal(detailItem),
        '</section>'
      ].join('');
    },

    bind: function (root) {
      root.querySelectorAll('[data-sell]').forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          AppState.prepareListing(button.getAttribute('data-sell'));
        });
      });
      root.querySelectorAll('[data-asset-detail]').forEach(function (row) {
        function open() { AppState.openAssetDetail(row.getAttribute('data-asset-detail')); }
        row.addEventListener('click', open);
      });
      var layer = root.querySelector('.modal-layer[data-close-detail]');
      if (layer) {
        layer.addEventListener('click', function (event) {
          if (event.target === layer) { AppState.closeAssetDetail(); }
        });
      }
      var close = root.querySelector('[data-close-detail-button]');
      if (close) { close.addEventListener('click', function () { AppState.closeAssetDetail(); }); }
      var modalSell = root.querySelector('[data-modal-sell]');
      if (modalSell) {
        modalSell.addEventListener('click', function () { AppState.prepareListing(modalSell.getAttribute('data-modal-sell')); });
      }
    },

    afterRender: function (root) {
      if (portfolioChart) { portfolioChart.destroy(); portfolioChart = null; }
      if (detailChart) { detailChart.destroy(); detailChart = null; }
      portfolioChart = createLineChart(root.querySelector('#portfolio-chart'), HISTORY_LABELS, buildPortfolioHistory(AppState.getState()), false);
      var detailItem = AppState.getState().assetDetailItemId ? AppState.getItem(AppState.getState().assetDetailItemId) : null;
      if (detailItem) {
        detailChart = createLineChart(root.querySelector('#detail-chart'), HISTORY_LABELS, detailItem.history30d, true);
      }
    }
  };
}(window));
