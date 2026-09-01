(function (global) {
  'use strict';

  var app = document.getElementById('app');
  var toastRoot = document.getElementById('toast-root');

  // タブアイコン: Ionicons v7 (MIT License, https://ionic.io/ionicons) の SVG を
  // currentColor 対応にして直書きしたもの。CDN も npm も足さないため markup で持つ。
  // 非アクティブ = outline / アクティブ = solid（Ionicons 本来の使い分け）。
  var ICONS = {
    home: {
      outline: '<path d="M80,212V448a16,16,0,0,0,16,16h96V328a24,24,0,0,1,24-24h80a24,24,0,0,1,24,24V464h96a16,16,0,0,0,16-16V212"/><path d="M480,256,266.89,52c-5-5.28-16.69-5.34-21.78,0L32,256"/><polyline points="400 179 400 64 352 64 352 133"/>',
      solid: '<path d="M261.56,101.28a8,8,0,0,0-11.06,0L66.4,277.15a8,8,0,0,0-2.47,5.79L63.9,448a32,32,0,0,0,32,32H192a16,16,0,0,0,16-16V328a8,8,0,0,1,8-8h80a8,8,0,0,1,8,8l0,136a16,16,0,0,0,16,16h96.06a32,32,0,0,0,32-32l0-165.06a8,8,0,0,0-2.47-5.79Z"/><path d="M490.91,244.15l-74.8-71.56,0-108.59a16,16,0,0,0-16-16h-48a16,16,0,0,0-16,16l0,32L278.19,40.62C272.77,35.14,264.71,32,256,32h0c-8.68,0-16.72,3.14-22.14,8.63L21.16,244.13c-6.22,6-7,15.87-1.34,22.37A16,16,0,0,0,43,267.56L250.5,69.28a8,8,0,0,1,11.06,0L469.08,267.56a16,16,0,0,0,22.59-.44C497.81,260.76,497.3,250.26,490.91,244.15Z"/>'
    },
    search: {
      outline: '<path d="M221.09,64A157.09,157.09,0,1,0,378.18,221.09,157.1,157.1,0,0,0,221.09,64Z"/><line x1="338.29" y1="338.29" x2="448" y2="448"/>',
      solid: '<path d="M456.69,421.39,362.6,327.3a173.81,173.81,0,0,0,34.84-104.58C397.44,126.38,319.06,48,222.72,48S48,126.38,48,222.72s78.38,174.72,174.72,174.72A173.81,173.81,0,0,0,327.3,362.6l94.09,94.09a25,25,0,0,0,35.3-35.3ZM97.92,222.72a124.8,124.8,0,1,1,124.8,124.8A124.95,124.95,0,0,1,97.92,222.72Z"/>'
    },
    add: {
      outline: '<line x1="256" y1="112" x2="256" y2="400"/><line x1="400" y1="256" x2="112" y2="256"/>',
      solid: '<line x1="256" y1="112" x2="256" y2="400"/><line x1="400" y1="256" x2="112" y2="256"/>'
    },
    assets: {
      outline: '<rect x="64" y="320" width="48" height="160" rx="8" ry="8"/><rect x="288" y="224" width="48" height="256" rx="8" ry="8"/><rect x="400" y="112" width="48" height="368" rx="8" ry="8"/><rect x="176" y="32" width="48" height="448" rx="8" ry="8"/>',
      solid: '<path d="M104,496H72a24,24,0,0,1-24-24V328a24,24,0,0,1,24-24h32a24,24,0,0,1,24,24V472A24,24,0,0,1,104,496Z"/><path d="M328,496H296a24,24,0,0,1-24-24V232a24,24,0,0,1,24-24h32a24,24,0,0,1,24,24V472A24,24,0,0,1,328,496Z"/><path d="M440,496H408a24,24,0,0,1-24-24V120a24,24,0,0,1,24-24h32a24,24,0,0,1,24,24V472A24,24,0,0,1,440,496Z"/><path d="M216,496H184a24,24,0,0,1-24-24V40a24,24,0,0,1,24-24h32a24,24,0,0,1,24,24V472A24,24,0,0,1,216,496Z"/>'
    },
    person: {
      outline: '<path d="M344,144c-3.92,52.87-44,96-88,96s-84.15-43.12-88-96c-4-55,35-96,88-96S348,90,344,144Z"/><path d="M256,304c-87,0-175.3,48-191.64,138.6C62.39,453.52,68.57,464,80,464H432c11.44,0,17.62-10.48,15.65-21.4C431.3,352,343,304,256,304Z"/>',
      solid: '<path d="M332.64,64.58C313.18,43.57,286,32,256,32c-30.16,0-57.43,11.5-76.8,32.38-19.58,21.11-29.12,49.8-26.88,80.78C156.76,206.28,203.27,256,256,256s99.16-49.71,103.67-110.82C361.94,114.48,352.34,85.85,332.64,64.58Z"/><path d="M432,480H80A31,31,0,0,1,55.8,468.87c-6.5-7.77-9.12-18.38-7.18-29.11C57.06,392.94,83.4,353.61,124.8,326c36.78-24.51,83.37-38,131.2-38s94.42,13.5,131.2,38c41.4,27.6,67.74,66.93,76.18,113.75,1.94,10.73-.68,21.34-7.18,29.11A31,31,0,0,1,432,480Z"/>'
    }
  };

  function icon(name, solid) {
    var set = ICONS[name];
    if (!set) { return ''; }
    var paint = solid
      ? 'fill="currentColor"'
      : 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
    return '<svg class="tab-glyph" viewBox="0 0 512 512" ' + paint + ' aria-hidden="true" focusable="false">' + (solid ? set.solid : set.outline) + '</svg>';
  }

  function activeRoute(route) {
    return route === 'profile' ? 'home' : route;
  }

  function tabButton(route, name, label, current) {
    var active = activeRoute(current) === route;
    return '<button type="button" class="tab-button' + (active ? ' is-active' : '') + '" data-nav="' + route + '" aria-current="' + (active ? 'page' : 'false') + '"><span class="tab-icon">' + icon(name, active) + '</span><strong>' + label + '</strong></button>';
  }

  function tabBar(route) {
    return [
      '<nav class="tab-bar" aria-label="メインナビゲーション">',
        tabButton('home', 'home', 'ホーム', route),
        tabButton('explore', 'search', '探す', route),
        '<button type="button" class="post-tab' + (route === 'post' ? ' is-active' : '') + '" data-nav="post" aria-current="' + (route === 'post' ? 'page' : 'false') + '"><span>' + icon('add', false) + '</span><strong>投稿</strong></button>',
        tabButton('assets', 'assets', '資産', route),
        tabButton('mypage', 'person', 'マイページ', route),
      '</nav>'
    ].join('');
  }

  function statusBar(isListing) {
    return '<div class="status-bar' + (isListing ? ' mercari-status' : '') + '" aria-hidden="true"><strong>9:41</strong><div><span>▮▮▮</span><span>⌁</span><span class="battery">●</span></div></div>';
  }

  function screenFor(route) {
    return Screens[route] || Screens.home;
  }

  function themeOption(theme, current) {
    var active = theme.id === current;
    return [
      '<button type="button" class="theme-option' + (active ? ' is-active' : '') + '" data-set-theme="' + theme.id + '" aria-pressed="' + active + '" title="' + theme.hue + ' / ' + theme.desc + '">',
        '<span class="theme-dots" data-theme="' + theme.id + '" aria-hidden="true"><i></i><i></i><i></i></span>',
        '<strong>' + theme.name + '</strong>',
      '</button>'
    ].join('');
  }

  function modeOption(mode, current) {
    var active = mode.id === current;
    return '<button type="button" class="mode-option' + (active ? ' is-active' : '') + '" data-set-mode="' + mode.id + '" aria-pressed="' + active + '"><span aria-hidden="true">' + mode.icon + '</span>' + mode.name + '</button>';
  }

  // 切り替えた瞬間の変化が見えないと意味がないので、背後を覆わない
  // 高さに抑え、スクリムもほぼ透明にしている。
  function settingsSheet(state) {
    if (!state.settingsOpen) {
      return '';
    }
    return [
      '<div class="settings-layer">',
        '<button type="button" class="settings-scrim" data-close-settings aria-label="設定を閉じる"></button>',
        '<section class="settings-sheet" role="dialog" aria-modal="false" aria-label="表示のカスタマイズ">',
          '<header class="settings-head">',
            '<h2>推しカラー</h2>',
            '<div class="mode-options">' + Theme.MODES.map(function (mode) {
              return modeOption(mode, state.mode);
            }).join('') + '</div>',
            '<button type="button" class="settings-close" data-close-settings aria-label="閉じる">✕</button>',
          '</header>',
          '<div class="theme-options">' + Theme.THEMES.map(function (theme) {
            return themeOption(theme, state.theme);
          }).join('') + '</div>',
        '</section>',
      '</div>'
    ].join('');
  }

  function bindSettings(root) {
    root.querySelectorAll('[data-close-settings]').forEach(function (button) {
      button.addEventListener('click', function () { AppState.setSettingsOpen(false); });
    });
    // 設定シート内に限定する。チュートリアルにも [data-set-theme] があり、
    // app 全体に張ると二重バインドで誤トーストが出る。
    root.querySelectorAll('.settings-layer [data-set-theme]').forEach(function (button) {
      button.addEventListener('click', function () {
        AppState.setTheme(button.getAttribute('data-set-theme'));
      });
    });
    root.querySelectorAll('.settings-layer [data-set-mode]').forEach(function (button) {
      button.addEventListener('click', function () {
        AppState.setMode(button.getAttribute('data-set-mode'));
      });
    });
    root.querySelectorAll('[data-open-settings]').forEach(function (button) {
      button.addEventListener('click', function () { AppState.setSettingsOpen(true); });
    });
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

  var lastScreenKey = null;

  function render() {
    var state = AppState.getState();
    var previousScroll = app.querySelector('.screen-scroll');
    var scrollTop = previousScroll ? previousScroll.scrollTop : 0;
    var previousRoute = app.getAttribute('data-route');
    var route = state.route;
    var screen = screenFor(route);
    var chromeFree = route === 'tutorial' || route === 'listing';

    // 入場演出は「画面が変わったとき」だけ出す。render() はいいね1つでも走るため、
    // ここで絞らないと操作のたびに全画面が再アニメーションする。
    // screen が任意で key() を返すと、同じ route 内の stage 変化も画面遷移として扱う。
    var screenKey = route + (typeof screen.key === 'function' ? ':' + screen.key(state) : '');
    var entering = screenKey !== lastScreenKey;
    lastScreenKey = screenKey;

    // テーマは <html> に当てる。body の背景と ::before/::after の
    // 装飾が body 側にいるため #app では届かない。冪等なので毎render呼ぶ。
    Theme.apply(state.theme, state.mode);

    // 出品モックは実物メルカリの完コピなのでテーマの対象外。
    var themed = route !== 'listing';
    var markup = screen.render();
    if (themed) {
      markup = Theme.localizeDeco(markup, state.theme);
    }

    app.setAttribute('data-route', route);
    app.innerHTML = [
      '<div class="app-runtime' + (route === 'listing' ? ' mercari-runtime' : '') + '">',
        statusBar(route === 'listing'),
        '<div class="screen-host' + (entering ? ' is-entering' : '') + '" id="screen-host" role="main">' + markup + '</div>',
        chromeFree ? '' : tabBar(route),
        '<div class="home-indicator" aria-hidden="true"><span></span></div>',
        settingsSheet(state),
      '</div>'
    ].join('');

    bindNavigation(app);
    bindSettings(app);
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
