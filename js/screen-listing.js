(function (global) {
  'use strict';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;',
            }[char];
    });
  }

  function yen(value) {
    return Number(value).toLocaleString('ja-JP');
  }

  function description(item) {
        return (
            'STELLIGHT ステラの公式' +
            item.name.replace('ステラ ', '') +
            'です。大切に保管していました。目立つ傷は見当たりませんが、写真をご確認ください。防水・緩衝材で丁寧に梱包して発送します。次のステラ推しの方に届いたらうれしいです。'
        );
  }

  function photoRow(item) {
    var slots = [
            '<div class="ml-slot is-filled" data-listing-photo><img src="' +
                escapeHtml(item.thumb) +
                '" alt="' +
                escapeHtml(item.name) +
                'の出品写真"><span class="ml-slot-num">1</span></div>',
            '<div class="ml-slot" data-listing-photo><span class="ml-slot-cam" aria-hidden="true">◎</span><span class="ml-slot-num">2</span></div>',
    ];
    var index;
    for (index = 3; index <= 5; index += 1) {
            slots.push(
                '<div class="ml-slot" data-listing-photo><span class="ml-slot-num">' +
                    index +
                    '</span></div>',
            );
    }
        return (
            '<div class="ml-photos" aria-label="商品の写真">' +
            slots.join('') +
            '</div>'
        );
  }

  function navRow(label, value, pill, note) {
    return [
      '<div class="ml-row" data-listing-nav>',
        pill ? '<span class="ml-pill">' + escapeHtml(pill) + '</span>' : '',
        '<div class="ml-row-main">',
          '<span class="ml-row-label">' + escapeHtml(label) + '</span>',
          '<span class="ml-row-value">' + escapeHtml(value) + '</span>',
          '<span class="ml-chevron" aria-hidden="true">›</span>',
        '</div>',
            note
                ? '<span class="ml-row-note">' + escapeHtml(note) + '</span>'
                : '',
            '</div>',
    ].join('');
  }

  function saleTypeBlock(item) {
    var fee = Math.round(item.marketPrice * 0.1);
    var profit = item.marketPrice - fee;
    return [
      '<div class="ml-block">',
        '<h2 class="ml-heading">販売タイプ</h2>',
            '<div class="ml-option" data-listing-sale-type>',
          '<span class="ml-radio" aria-hidden="true"></span>',
          '<div class="ml-option-copy"><strong>オークション形式</strong><small>思わぬ価格で売れるかも！</small></div>',
        '</div>',
            '<div class="ml-option is-selected" data-listing-sale-type>',
          '<div class="ml-option-head">',
            '<span class="ml-radio is-on" aria-hidden="true"></span>',
            '<div class="ml-option-copy"><strong>価格を設定する</strong></div>',
          '</div>',
          '<div class="ml-price-rows">',
            '<div class="ml-price-row"><span>販売価格</span><strong>' +
                AppState.formatYen(item.marketPrice) +
                '</strong></div>',
            '<div class="ml-price-row"><span>販売手数料</span><b>−¥' +
                yen(fee) +
                '</b></div>',
            '<div class="ml-price-row is-last"><span>販売利益</span><b>¥' +
                yen(profit) +
                '</b></div>',
            '</div>',
          '</div>',
        '</div>',
    ].join('');
  }

  function listingForm(item, aiDescription) {
    var text = aiDescription || description(item);
    var aiLabel = aiDescription ? '✦ Geminiが作成' : '✦ AIで作成済み';
    return [
      '<section class="screen listing-screen">',
        '<header class="ml-header">',
          '<button type="button" class="ml-close" data-listing-close aria-label="閉じる">×</button>',
          '<h1>商品の情報を入力</h1>',
        '</header>',
        '<div class="screen-scroll ml-scroll">',
          photoRow(item),
          '<button type="button" class="ml-template" data-listing-template><span aria-hidden="true">▤</span> テンプレート</button>',
          '<div class="ml-block">',
            '<h2 class="ml-heading">商品名</h2>',
            '<div class="ml-input" data-listing-field>' + escapeHtml(item.name) + '</div>',
          '</div>',
          '<div class="ml-block ml-rows">',
            navRow('カテゴリー', item.category || '', '', ''),
            navRow('商品の状態', item.condition || '', '', ''),
            navRow(
                '配送方法',
                'ゆうゆうメルカリ便',
                '送料込み (出品者負担)',
                '東京都から1~2日で発送',
            ),
          '</div>',
          '<div class="ml-block">',
            '<div class="ml-heading-line"><h2 class="ml-heading">商品の説明</h2><span class="ml-ai-badge">' +
                aiLabel +
                '</span></div>',
            '<div class="ml-input ml-textarea" data-listing-field>' + escapeHtml(text) + '</div>',
          '</div>',
          saleTypeBlock(item),
          '<div class="ml-terms">',
            '<p><a href="#" data-listing-terms>規約</a>・<a href="#" data-listing-terms>プライバシーポリシー</a>に同意し出品してください</p>',
            '<p>役務提供時期、対価とその支払時期・方法等は<a href="#" data-listing-terms>こちら</a>をご覧ください</p>',
            '<p><a href="#" data-listing-terms>あんしん鑑定</a>の規約に同意して出品してください。</p>',
          '</div>',
          '<div class="ml-footer">',
            '<button type="button" class="ml-draft" data-listing-draft>下書きに保存</button>',
            '<button type="button" class="ml-submit" data-submit-listing>出品する</button>',
          '</div>',
        '</div>',
            '</section>',
    ].join('');
  }

  function listingDone() {
    return [
      '<section class="screen listing-screen ml-done-screen">',
        '<div class="ml-done-card" role="dialog" aria-modal="true" aria-labelledby="ml-done-title">',
          '<div class="ml-done-illust" aria-hidden="true">💐</div>',
          '<h2 id="ml-done-title">出品が完了しました</h2>',
          '<p class="ml-done-note">売れたら売上金は<strong>推しポート</strong>に反映されます</p>',
          '<button type="button" class="ml-done-primary" data-finish-listing>出品した商品をみる</button>',
          '<button type="button" class="ml-done-secondary" data-listing-again>続けて出品する</button>',
          '<button type="button" class="ml-done-text" data-listing-share>商品をシェアする</button>',
        '</div>',
            '</section>',
    ].join('');
  }

  global.Screens.listing = {
        key: function (state) {
            return state.listing.stage;
        },

    render: function () {
      var state = AppState.getState();
      var item = AppState.getItem(state.listing.itemId || 'stella-acsta');
      var displayItem = item;
      var aiDescription = null;
      var analysis = state.post.analysis;
      if (analysis && state.postedItemId === item.id) {
        displayItem = Object.assign({}, item, {
          thumb: state.post.imageUrl || item.thumb,
          name: analysis.title,
          category: analysis.category,
                    condition: analysis.condition,
        });
        aiDescription = analysis.description;
      } else if (item.id === 'stella-acsta' && state.postedDemo) {
        displayItem = Object.assign({}, item, {
                    thumb:
                        state.post.imageUrl || AI_RESULTS['acsta2.png'].image,
                    condition: AI_RESULTS['acsta2.png'].state,
        });
      }
            return state.listing.stage === 'success'
                ? listingDone()
                : listingForm(displayItem, aiDescription);
    },

    bind: function (root) {
      var close = root.querySelector('[data-listing-close]');
            if (close) {
                close.addEventListener('click', function () {
                    AppState.setRoute('goods');
                });
            }

      var template = root.querySelector('[data-listing-template]');
            if (template) {
                template.addEventListener('click', function () {
                    AppState.showToast(
                        'テンプレート入力はデモでは省略しています',
                    );
                });
            }

            root.querySelectorAll('[data-listing-photo]').forEach(function (slot) {
                slot.addEventListener('click', function () {
                    AppState.showToast('写真の追加・編集はデモではできません');
                });
            });

            root.querySelectorAll('[data-listing-field]').forEach(function (field) {
                field.addEventListener('click', function () {
                    AppState.showToast('商品情報の編集はデモではできません');
                });
            });

            root.querySelectorAll('[data-listing-sale-type]').forEach(function (option) {
                option.addEventListener('click', function () {
                    AppState.showToast('販売タイプは「価格を設定する」で固定しています（デモ）');
                });
            });

            root.querySelectorAll('[data-listing-terms]').forEach(function (link) {
                link.addEventListener('click', function (event) {
                    event.preventDefault();
                    AppState.showToast('リンク先はデモでは開けません');
                });
            });

      root.querySelectorAll('[data-listing-nav]').forEach(function (row) {
        row.addEventListener('click', function () {
                    AppState.showToast(
                        '推しポートが入力済みです。そのまま出品できます',
                    );
        });
      });

      var draft = root.querySelector('[data-listing-draft]');
            if (draft) {
                draft.addEventListener('click', function () {
                    AppState.showToast('下書きに保存しました（デモ）');
                });
            }

      var submit = root.querySelector('[data-submit-listing]');
            if (submit) {
                submit.addEventListener('click', function () {
                    AppState.submitListing();
                });
            }

      var finish = root.querySelector('[data-finish-listing]');
            if (finish) {
                finish.addEventListener('click', function () {
                    AppState.finishListing();
                });
            }

      var again = root.querySelector('[data-listing-again]');
      if (again) {
        again.addEventListener('click', function () {
          AppState.prepareListing(AppState.getState().listing.itemId);
        });
      }

      var share = root.querySelector('[data-listing-share]');
            if (share) {
                share.addEventListener('click', function () {
                    AppState.showToast('商品のリンクをコピーしました（デモ）');
                });
    }
        },
  };
})(window);
