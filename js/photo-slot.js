/* 写真スロット: assets/photo/<slot>.png を置くだけでSVGプレースホルダから実写真に自動で切り替わる。
   ファイルが無い間はSVGのまま。アバター6点は対象外(意図的にイラスト運用)。 */
(function () {
  'use strict';

  var SLOTS = [
    'saidan', 'acsta2', 'tl-post',
    'item-acsta', 'item-album', 'item-badge', 'item-card',
    'item-hoodie', 'item-penlight', 'item-plush'
  ];

  var PHOTO_DIR = 'assets/photo/';
  var SVG_RE = /^assets\/img\/([a-z0-9-]+)\.svg$/;

  // slot -> true(写真あり) / false(なし)。起動時に1回だけ探索する。
  var available = {};

  function probe(slot) {
    var img = new Image();
    img.onload = function () { available[slot] = true; apply(document); };
    img.onerror = function () { available[slot] = false; };
    img.src = PHOTO_DIR + slot + '.png';
  }

  function apply(root) {
    if (!root || !root.querySelectorAll) { return; }
    root.querySelectorAll('img').forEach(function (img) {
      var slot = img.getAttribute('data-photo-slot');
      if (!slot) {
        var match = SVG_RE.exec(img.getAttribute('src') || '');
        if (!match || SLOTS.indexOf(match[1]) === -1) { return; }
        slot = match[1];
        img.setAttribute('data-photo-slot', slot);
      }
      if (available[slot] === true) {
        img.src = PHOTO_DIR + slot + '.png';
      }
    });
  }

  SLOTS.forEach(probe);

  window.PhotoSlot = { SLOTS: SLOTS, apply: apply };
})();
