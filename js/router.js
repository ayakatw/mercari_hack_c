(function (global) {
  'use strict';

  var app = document.getElementById('app');
  var toastRoot = document.getElementById('toast-root');

  function activeRoute(route) {
    return route === 'profile' ? 'home' : route;
  }

  function tabButton(route, icon, label, current) {
    var active = activeRoute(current) === route;
    return '<button type="button" class="tab-button' + (active ? ' is-active' : '') + '" data-nav="' + route + '" aria-current="' + (active ? 'page' : 'false') + '"><span class="tab-icon" aria-hidden="true">' + icon + '</span><strong>' + label + '</strong></button>';
  }

  function tabBar(route) {
    return [
      '<nav class="tab-bar" aria-label="メインナビゲーション">',
        tabButton('home', '⌂', 'ホーム', route),
        tabButton('explore', '⌕', '探す', route),
        '<button type="button" class="post-tab' + (route === 'post' ? ' is-active' : '') + '" data-nav="post" aria-current="' + (route === 'post' ? 'page' : 'false') + '"><span>＋</span><strong>投稿</strong></button>',
        tabButton('assets', '⌁', '資産', route),
        tabButton('mypage', '♙', 'マイページ', route),
      '</nav>'
    ].join('');
  }

  function statusBar(isListing) {
    return '<div class="status-bar' + (isListing ? ' mercari-status' : '') + '" aria-hidden="true"><strong>9:41</strong><div><span>▮▮▮</span><span>⌁</span><span class="battery">●</span></div></div>';
  }

  function screenFor(route) {
    return Screens[route] || Screens.home;
  }

  function renderToast(state) {
    if (!state.toast) {
      toastRoot.innerHTML = '';
      return;
    }
    toastRoot.innerHTML = '<div class="toast"><span>✓</span><p>' + state.toast.message + '</p></div>';
  }

  function bindNavigation(root) {
    root.querySelectorAll('[data-nav]').forEach(function (button) {
      button.addEventListener('click', function () {
        AppState.setRoute(button.getAttribute('data-nav'));
      });
    });
  }

  function render() {
    var state = AppState.getState();
    var previousScroll = app.querySelector('.screen-scroll');
    var scrollTop = previousScroll ? previousScroll.scrollTop : 0;
    var previousRoute = app.getAttribute('data-route');
    var route = state.route;
    var screen = screenFor(route);
    var chromeFree = route === 'tutorial' || route === 'listing';

    app.setAttribute('data-route', route);
    app.innerHTML = [
      '<div class="app-runtime' + (route === 'listing' ? ' mercari-runtime' : '') + '">',
        statusBar(route === 'listing'),
        '<div class="screen-host" id="screen-host" role="main">' + screen.render() + '</div>',
        chromeFree ? '' : tabBar(route),
        '<div class="home-indicator" aria-hidden="true"><span></span></div>',
      '</div>'
    ].join('');

    bindNavigation(app);
    if (typeof screen.bind === 'function') {
      screen.bind(app);
    }
    if (previousRoute === route) {
      var nextScroll = app.querySelector('.screen-scroll');
      if (nextScroll) { nextScroll.scrollTop = scrollTop; }
    }
    if (typeof screen.afterRender === 'function') {
      screen.afterRender(app);
    }
    renderToast(state);
  }

  global.Router = {
    go: function (route) { AppState.setRoute(route); },
    render: render
  };

  // 開発用: ?screen=post のように指定すると、チュートリアルを済ませた状態で
  // その画面から始められる。指定がなければ従来どおりチュートリアルから。
  function applyInitialScreen() {
    var match = /[?&]screen=([a-z]+)/.exec(global.location.search || '');
    var route = match && match[1];
    if (!route || !Screens[route] || route === 'tutorial') {
      return;
    }
    AppState.adjustTutorialCount('stella-badge', 1);
    AppState.completeTutorial();
    AppState.setRoute(route);
  }

  AppState.subscribe(render);
  applyInitialScreen();
  render();
}(window));
