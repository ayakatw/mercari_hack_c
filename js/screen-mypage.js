(function (global) {
  'use strict';

  function shrineModal(total) {
    return [
      '<div class="modal-layer shrine-layer" data-close-shrine>',
        '<section class="modal-sheet shrine-sheet" role="dialog" aria-modal="true" aria-labelledby="shrine-title">',
          '<div class="sheet-handle" data-close-shrine-handle aria-hidden="true"></div>',
          '<button type="button" class="modal-close" data-close-shrine-button aria-label="閉じる">×</button>',
          '<div class="share-preview" data-shrine-preview>',
            '<div class="share-brand">推しポート <span>✦</span></div>',
            '<img src="assets/img/saidan.svg" alt="りなの祭壇">',
            '<div class="share-copy"><span>MY STELLIGHT ALTAR</span><h2 id="shrine-title">My祭壇</h2><strong>' + AppState.formatYen(total) + '</strong><p>好きの記録が、わたしのポートフォリオ。</p></div>',
            '<div class="share-sparkles" aria-hidden="true">✦　⋆　✧</div>',
          '</div>',
          '<p class="share-help">金額を入れた祭壇カードをシェアできます</p>',
          '<button type="button" class="x-share-button" data-share-x><span>𝕏</span> Xでシェア</button>',
        '</section>',
      '</div>'
    ].join('');
  }

  global.Screens.mypage = {
    render: function () {
      var state = AppState.getState();
      var baseImages = [
        'assets/img/saidan.svg', 'assets/img/item-badge.svg', 'assets/img/item-plush.svg',
        'assets/img/item-penlight.svg', 'assets/img/item-acsta.svg', 'assets/img/item-album.svg',
        'assets/img/item-card.svg', 'assets/img/item-hoodie.svg', 'assets/img/tl-post.svg'
      ];
      var created = state.createdPosts.map(function (post) { return post.image; });
      var grid = created.concat(baseImages).slice(0, 9);
      return [
        '<section class="screen screen-mypage">',
          '<header class="top-app-bar compact-bar"><div><span class="eyebrow">MY PAGE</span><h1>マイページ</h1></div><button type="button" class="round-icon-button" data-open-settings aria-label="表示のカスタマイズを開く">⋯</button></header>',
          '<div class="screen-scroll mypage-scroll">',
            '<section class="my-profile">',
              '<div class="profile-main"><div class="profile-avatar" data-profile-avatar><img src="assets/img/avatar-rina.svg" alt="りなのアイコン"><span>✦</span></div><div class="profile-names"><h2>りな</h2><p>@rina_oshi</p></div><div class="post-stat" data-post-stat><strong>' + grid.length + '</strong><span>投稿</span></div></div>',
              '<p class="profile-bio">ステライト箱推し🫶<br>継承はDMじゃなくてここから</p>',
              '<button type="button" class="shrine-button" data-open-shrine><span>✦</span> 祭壇カードを作る <b>›</b></button>',
            '</section>',
            '<div class="grid-heading"><span class="is-active" data-mypage-tab="posts">▦ 投稿</span><span data-mypage-tab="favorites">♡ お気に入り</span></div>',
            '<div class="profile-grid my-grid" aria-label="りなの投稿グリッド">',
              grid.map(function (image, index) { return '<img src="' + image + '" alt="りなの投稿 ' + (index + 1) + '" loading="lazy" data-grid-post="' + (index + 1) + '">'; }).join(''),
            '</div>',
          '</div>',
          state.shrineCardOpen ? shrineModal(AppState.getTotal()) : '',
        '</section>'
      ].join('');
    },

    bind: function (root) {
      var open = root.querySelector('[data-open-shrine]');
      if (open) { open.addEventListener('click', function () { AppState.setShrineCardOpen(true); }); }
      var avatar = root.querySelector('[data-profile-avatar]');
      if (avatar) { avatar.addEventListener('click', function () { AppState.showToast('プロフィール画像の変更はデモでは省略しています'); }); }
      var postStat = root.querySelector('[data-post-stat]');
      if (postStat) { postStat.addEventListener('click', function () { AppState.showToast('投稿グリッドを表示しています（デモ）'); }); }
      root.querySelectorAll('[data-mypage-tab]').forEach(function (tab) {
        tab.addEventListener('click', function () {
          var isFavorites = tab.getAttribute('data-mypage-tab') === 'favorites';
          AppState.showToast(isFavorites ? 'お気に入り一覧はデモでは省略しています' : '投稿グリッドを表示しています（デモ）');
        });
      });
      root.querySelectorAll('[data-grid-post]').forEach(function (image) {
        image.addEventListener('click', function () { AppState.showToast('投稿の詳細表示はデモでは省略しています'); });
      });
      var layer = root.querySelector('.shrine-layer');
      if (layer) {
        layer.addEventListener('click', function (event) {
          if (event.target === layer) { AppState.setShrineCardOpen(false); }
        });
      }
      var close = root.querySelector('[data-close-shrine-button]');
      if (close) { close.addEventListener('click', function () { AppState.setShrineCardOpen(false); }); }
      var handle = root.querySelector('[data-close-shrine-handle]');
      if (handle) { handle.addEventListener('click', function () { AppState.setShrineCardOpen(false); }); }
      var preview = root.querySelector('[data-shrine-preview]');
      if (preview) { preview.addEventListener('click', function () { AppState.showToast('祭壇カードのシェア画像プレビューです（デモ）'); }); }
      var share = root.querySelector('[data-share-x]');
      if (share) { share.addEventListener('click', function () { AppState.shareShrineCard(); }); }
    }
  };
}(window));
