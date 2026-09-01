(function (global) {
  'use strict';

  // 推し色の人気シェア(青21% / 紫15.7% / 赤14.7% / 緑14.7% / ピンク9.4%)を
  // 寒色・中性・暖色の3系統に畳んだもの。色の実体は styles.css の
  // [data-theme] ブロック側にある。ここが持つのは並び順と表示名だけ。
  var THEMES = [
    { id: 'cool', name: '蒼', hue: '寒色系', desc: '青 + 紫', mood: 'クール・知的・上品', deco: ['✦', '✧', '⋆'] },
    { id: 'neutral', name: '霞', hue: '中性色', desc: '緑 + ピンク', mood: '癒し・優しい・シック', deco: ['❋', '✼', '·'] },
    { id: 'warm', name: '陽', hue: '暖色系', desc: '赤 + オレンジ', mood: '情熱的・元気', deco: ['✺', '✵', '⁕'] }
  ];

  var MODES = [
    { id: 'light', name: '淡色', icon: '☀' },
    { id: 'dark', name: '濃色', icon: '☾' }
  ];

  var DEFAULT_THEME = 'cool';
  var DEFAULT_MODE = 'light';

  // ダークのときブラウザのUI色も合わせる（デモ録画で枠外が締まる）
  var THEME_COLOR = {
    'cool|light': '#8ba3f0',
    'cool|dark': '#0f1420',
    'neutral|light': '#7fae94',
    'neutral|dark': '#16181a',
    'warm|light': '#e08a6a',
    'warm|dark': '#1a1210'
  };

  function find(id) {
    return (
      THEMES.filter(function (theme) {
        return theme.id === id;
      })[0] || THEMES[0]
    );
  }

  var Theme = {
    THEMES: THEMES,
    MODES: MODES,
    DEFAULT_THEME: DEFAULT_THEME,
    DEFAULT_MODE: DEFAULT_MODE,
    find: find,

    // <html> に当てる。body の背景と ::before/::after の装飾が
    // body 側にいるため、#app ではなく documentElement が正しい。
    apply: function (themeId, modeId) {
      var root = global.document.documentElement;
      root.setAttribute('data-theme', themeId || DEFAULT_THEME);
      if (modeId === 'dark') {
        root.setAttribute('data-mode', 'dark');
      } else {
        root.removeAttribute('data-mode');
      }
      var meta = global.document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', THEME_COLOR[(themeId || DEFAULT_THEME) + '|' + (modeId || DEFAULT_MODE)] || '#8ba3f0');
      }
    },

    // 画面のHTMLに直書きされた装飾グリフを、テーマの字形へ差し替える。
    // 各画面を書き換える代わりに router で一括適用している（33箇所）。
    localizeDeco: function (html, themeId) {
      var deco = find(themeId).deco;
      if (deco[0] === '✦') {
        return html;
      }
      return html.replace(/✦/g, deco[0]).replace(/✧/g, deco[1]).replace(/⋆/g, deco[2]);
    }
  };

  global.Theme = Theme;
})(window);
