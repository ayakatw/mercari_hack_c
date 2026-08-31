(function (global) {
  'use strict';

  function userFor(handle) {
    return AppState.getUser(handle) || { handle: handle, name: handle, avatar: 'assets/img/avatar-rina.svg', tappable: false };
  }

  function postCard(post) {
    var state = AppState.getState();
    var user = userFor(post.user);
    var liked = Boolean(state.likedPosts[post.id]);
    var likes = post.likes + (liked ? 1 : 0);
    var avatarMarkup = user.tappable
      ? '<button class="avatar-button is-tappable" type="button" data-profile="' + user.handle + '" aria-label="' + user.name + 'さんのプロフィールを見る"><img src="' + post.avatar + '" alt=""></button>'
      : '<span class="avatar-button" aria-hidden="true"><img src="' + post.avatar + '" alt=""></span>';

    return [
      '<article class="feed-card">',
        '<header class="feed-author">',
          avatarMarkup,
          '<div class="feed-author-copy"><strong>' + user.name + '</strong><span>@' + user.handle + '</span></div>',
          post.giveaway ? '<span class="inherit-label">✦ 譲ります</span>' : '<span class="sparkle-dot" aria-hidden="true">✦</span>',
        '</header>',
        '<img class="feed-photo" src="' + post.image + '" alt="' + post.tags[0] + 'の投稿写真" loading="lazy">',
        '<div class="feed-body">',
          '<div class="feed-actions">',
            '<button class="like-button' + (liked ? ' is-liked' : '') + '" type="button" data-like="' + post.id + '" aria-pressed="' + liked + '" aria-label="いいね">' + (liked ? '♥' : '♡') + '</button>',
            '<strong>' + likes + '</strong>',
            '<span class="feed-action-spacer"></span>',
            post.giveaway
              ? '<button class="want-button' + (state.requestSent ? ' is-sent' : '') + '" type="button" data-request aria-label="このグッズを欲しいと伝える">' + (state.requestSent ? '送信済み ✓' : '欲しい') + '</button>'
              : '',
          '</div>',
          '<p class="feed-caption"><strong>' + user.name + '</strong> ' + post.caption + '</p>',
          '<div class="product-tags">' + post.tags.map(function (tag) { return '<span># ' + tag + '</span>'; }).join('') + '</div>',
          post.giveaway ? '<p class="secure-note">🛡 取引はメルカリのあんしん決済</p>' : '',
        '</div>',
      '</article>'
    ].join('');
  }

  global.Screens.home = {
    render: function () {
      return [
        '<section class="screen screen-home">',
          '<header class="top-app-bar">',
            '<div><span class="eyebrow">MERCARI presents</span><h1 class="wordmark">推しポート<span>✦</span></h1></div>',
            '<span class="round-icon-button" aria-hidden="true"><span>♢</span><i></i></span>',
          '</header>',
          '<div class="screen-scroll feed-list">',
            '<section class="feed-intro">',
              '<span class="mini-pill">STELLIGHT</span>',
              '<h2>今日も推しが尊い。<span>✦</span></h2>',
              '<p>好きの記録を、未来の出会いへ。</p>',
            '</section>',
            POSTS.map(postCard).join(''),
            '<p class="end-message">ここまで見ました ✦</p>',
          '</div>',
        '</section>'
      ].join('');
    },

    bind: function (root) {
      root.querySelectorAll('[data-like]').forEach(function (button) {
        button.addEventListener('click', function () {
          AppState.toggleLike(button.getAttribute('data-like'));
        });
      });
      root.querySelectorAll('[data-request]').forEach(function (button) {
        button.addEventListener('click', function () {
          AppState.sendRequest();
        });
      });
      root.querySelectorAll('[data-profile]').forEach(function (button) {
        button.addEventListener('click', function () {
          AppState.openProfile(button.getAttribute('data-profile'));
        });
      });
    }
  };

  global.Screens.explore = {
    render: function () {
      var gridImages = POSTS.concat(POSTS.slice(0, 4));
      return [
        '<section class="screen screen-explore">',
          '<header class="top-app-bar compact-bar"><div><span class="eyebrow">DISCOVER</span><h1>探す</h1></div><span class="header-sparkle">✦</span></header>',
          '<div class="screen-scroll">',
            '<div class="search-faux" aria-hidden="true"><span>⌕</span> ステライトの投稿を探す</div>',
            '<div class="topic-chips" aria-hidden="true"><span class="is-active">おすすめ</span><span>祭壇</span><span>アクスタ</span><span>現場コーデ</span></div>',
            '<div class="explore-grid" aria-label="おすすめ投稿の静的グリッド">',
              gridImages.map(function (post, index) {
                return '<div class="explore-tile"><img src="' + post.image + '" alt="おすすめ投稿 ' + (index + 1) + '" loading="lazy"><span>✦</span></div>';
              }).join(''),
            '</div>',
            '<p class="static-note">おすすめを眺めるためのグリッドです</p>',
          '</div>',
        '</section>'
      ].join('');
    },
    bind: function () {}
  };

  global.Screens.profile = {
    render: function () {
      var state = AppState.getState();
      var user = userFor(state.selectedProfile || 'mio_stella');
      var ownPosts = POSTS.filter(function (post) { return post.user === user.handle; });
      var grid = ownPosts.concat(POSTS.slice(0, 8));
      return [
        '<section class="screen screen-profile">',
          '<header class="top-app-bar profile-nav">',
            '<button type="button" class="back-button" data-back-home aria-label="ホームに戻る">‹</button>',
            '<h1>@' + user.handle + '</h1><span class="header-sparkle">✦</span>',
          '</header>',
          '<div class="screen-scroll">',
            '<div class="simple-profile">',
              '<img src="' + user.avatar + '" alt="' + user.name + 'さんのアイコン">',
              '<div><h2>' + user.name + '</h2><p>ステラ推し ✦ 大切なグッズを次の出会いへ</p></div>',
            '</div>',
            '<div class="profile-grid" aria-label="' + user.name + 'さんの投稿グリッド">',
              grid.slice(0, 9).map(function (post) { return '<img src="' + post.image + '" alt="' + post.tags[0] + 'の投稿" loading="lazy">'; }).join(''),
            '</div>',
          '</div>',
        '</section>'
      ].join('');
    },
    bind: function (root) {
      var back = root.querySelector('[data-back-home]');
      if (back) {
        back.addEventListener('click', function () { AppState.setRoute('home'); });
      }
    }
  };
}(window));
