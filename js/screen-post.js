(function (global) {
  'use strict';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }

  function postHeader(stepLabel) {
    return '<header class="top-app-bar compact-bar"><div><span class="eyebrow">NEW POST</span><h1>＋投稿</h1></div><span class="step-label">' + stepLabel + '</span></header>';
  }

  function renderSelect() {
    return [
      '<section class="screen screen-post">',
        postHeader('1 / 2'),
        '<div class="screen-scroll post-select-wrap">',
          '<div class="post-lead"><span class="big-sparkle">✦</span><h2>新しい「好き」を<br>記録しよう</h2><p>写真からグッズ名と相場をAIが提案します</p></div>',
          '<label class="upload-dropzone" for="post-file">',
            '<img src="assets/img/acsta2.svg" alt="デモ用のステラ アクリルスタンド">',
            '<span class="upload-overlay"><b>カメラロールから選ぶ</b><small>デモでは選択後に仕込み画像を使用します</small></span>',
          '</label>',
          '<input class="sr-only" id="post-file" data-post-file type="file" accept="image/*">',
          '<div class="privacy-note"><span>✧</span><p><strong>写真は公開前に確認できます</strong><br>AI解析結果は自由に直せます</p></div>',
        '</div>',
      '</section>'
    ].join('');
  }

  function renderAnalyzing() {
    return [
      '<section class="screen screen-post">',
        postHeader('AI解析'),
        '<div class="analysis-stage">',
          '<div class="analysis-photo"><img src="assets/img/acsta2.svg" alt="解析中のアクリルスタンド"><span class="scan-line"></span><i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i></div>',
          '<div class="ai-spinner" aria-hidden="true"><span></span></div>',
          '<h2>AIが解析中…</h2>',
          '<p>メルカリの成約データと照合しています</p>',
          '<div class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></div>',
        '</div>',
      '</section>'
    ].join('');
  }

  function renderResult(state) {
    var result = AI_RESULTS['acsta2.svg'];
    return [
      '<section class="screen screen-post">',
        postHeader('2 / 2'),
        '<div class="screen-scroll post-form-scroll">',
          '<div class="ai-result-card">',
            '<div class="ai-result-head"><span>✦ AI解析結果</span><small>仕込みデータ</small></div>',
            '<div class="ai-result-main">',
              '<img src="' + result.image + '" alt="' + result.name + '">',
              '<div><h2>' + result.name + '</h2><div class="tag-row">' + result.tags.map(function (tag) { return '<span>' + tag + '</span>'; }).join('') + '</div><p>状態 <strong>' + result.state + '</strong></p></div>',
            '</div>',
            '<div class="market-box"><span>現在の相場</span><strong>¥3,200</strong><small>参考：メルカリ成約データ</small></div>',
          '</div>',
          '<div class="form-card">',
            '<div class="form-row"><div><label>個数</label><small>実物を見て確定</small></div><div class="stepper" aria-label="投稿する個数"><button type="button" data-post-count="-1" aria-label="個数を減らす"' + (state.post.count <= 1 ? ' disabled' : '') + '>−</button><strong>' + state.post.count + '</strong><button type="button" data-post-count="1" aria-label="個数を増やす">＋</button></div></div>',
            '<div class="form-row"><div><label>譲ります</label><small>次のオタクへ継承する</small></div><button type="button" class="switch' + (state.post.giveaway ? ' is-on' : '') + '" data-giveaway aria-pressed="' + state.post.giveaway + '"><span></span></button></div>',
            '<label class="caption-field">キャプション<textarea data-caption rows="3" placeholder="お迎えした気持ちを書こう">' + escapeHtml(state.post.caption) + '</textarea></label>',
          '</div>',
          '<button class="primary-button post-submit" type="button" data-submit-post><span>投稿する</span><b>✦</b></button>',
          '<p class="micro-copy">投稿するとポートフォリオにも追加されます</p>',
        '</div>',
      '</section>'
    ].join('');
  }

  function renderComplete(state) {
    var addedValue = 3200 * state.post.count;
    return [
      '<section class="screen screen-post post-complete-screen">',
        postHeader('完了'),
        '<div class="screen-scroll complete-scroll">',
          '<div class="success-block"><div class="success-orb">✓<span>✦</span></div><h2>投稿しました。</h2><p>ポートフォリオに追加 <strong>+' + AppState.formatYen(addedValue) + '</strong></p></div>',
          '<article class="duplicate-alert">',
            '<div class="alert-kicker"><span>⚡</span> 重複アイテムを検出</div>',
            '<div class="alert-body"><img src="assets/img/item-acsta.svg" alt="ステラのアクスタ"><div><h3>ステラのアクスタ、<em>2個目</em>を検出。</h3><p>相場¥3,200 — 次のオタクに<br>継承しませんか?</p></div></div>',
            '<button type="button" class="inherit-button" data-open-draft>出品ドラフトを見る <span>›</span></button>',
            '<small>メルカリのあんしん取引へ移動します</small>',
          '</article>',
          '<button type="button" class="text-button" data-post-again>もう1件投稿する</button>',
        '</div>',
      '</section>'
    ].join('');
  }

  global.Screens.post = {
    render: function () {
      var state = AppState.getState();
      if (state.post.stage === 'analyzing') {
        return renderAnalyzing();
      }
      if (state.post.stage === 'result') {
        return renderResult(state);
      }
      if (state.post.stage === 'complete') {
        return renderComplete(state);
      }
      return renderSelect();
    },

    bind: function (root) {
      var file = root.querySelector('[data-post-file]');
      if (file) {
        file.addEventListener('change', function () {
          if (file.files && file.files.length) {
            AppState.startPostAnalysis();
          }
        });
      }
      root.querySelectorAll('[data-post-count]').forEach(function (button) {
        button.addEventListener('click', function () {
          AppState.adjustPostCount(Number(button.getAttribute('data-post-count')));
        });
      });
      var giveaway = root.querySelector('[data-giveaway]');
      if (giveaway) {
        giveaway.addEventListener('click', function () { AppState.togglePostGiveaway(); });
      }
      var caption = root.querySelector('[data-caption]');
      if (caption) {
        caption.addEventListener('input', function () { AppState.setPostCaption(caption.value); });
      }
      var submit = root.querySelector('[data-submit-post]');
      if (submit) {
        submit.addEventListener('click', function () { AppState.submitPost(); });
      }
      var draft = root.querySelector('[data-open-draft]');
      if (draft) {
        draft.addEventListener('click', function () { AppState.prepareListing('stella-acsta'); });
      }
      var again = root.querySelector('[data-post-again]');
      if (again) {
        again.addEventListener('click', function () { AppState.resetPost(); });
      }
    }
  };
}(window));
