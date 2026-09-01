(function (global) {
  'use strict';

  function progress(active) {
    return '<div class="tutorial-progress" aria-label="チュートリアル ' + active + ' / 3"><i class="' + (active >= 1 ? 'on' : '') + '"></i><i class="' + (active >= 2 ? 'on' : '') + '"></i><i class="' + (active >= 3 ? 'on' : '') + '"></i></div>';
  }

  function renderWelcome() {
    return [
      '<section class="tutorial-screen tutorial-welcome">',
        '<div class="welcome-sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>⋆</span><span>✦</span></div>',
        '<div class="welcome-logo">推しポート <b>✦</b></div>',
        '<div class="welcome-visual"><div class="orb orb-one"></div><div class="orb orb-two"></div><img src="assets/img/saidan.svg" alt="ステライトの祭壇"></div>',
        '<div class="welcome-copy"><span class="mini-pill">推し活が資産になるSNS</span><h1>その祭壇、<br><em>いくら</em>か知ってる?</h1><p>投稿するだけで、あなたの「好き」が<br>ポートフォリオになります。</p></div>',
        '<button type="button" class="primary-button tutorial-cta" data-start-tutorial>はじめる <span>›</span></button>',
        progress(1),
      '</section>'
    ].join('');
  }

  function renderCapture() {
    return [
      '<section class="tutorial-screen tutorial-capture">',
        '<header class="tutorial-head"><span>STEP 2</span><h1>祭壇を撮ってみよう</h1><p>1枚からグッズをまとめて登録できます</p></header>',
        '<label class="shrine-upload" for="tutorial-file">',
          '<img src="assets/img/saidan.svg" alt="デモ用のステライト祭壇">',
          '<span><b>◎</b><strong>祭壇写真を選ぶ</strong><small>選択後はデモ用写真を解析します</small></span>',
        '</label>',
        '<input class="sr-only" id="tutorial-file" data-tutorial-file type="file" accept="image/*">',
        '<div class="tutorial-tip"><span>✦</span><p>棚全体が写るように撮ると、<br>まとめて見つけやすくなります</p></div>',
        progress(2),
      '</section>'
    ].join('');
  }

  function renderAnalyzing() {
    return [
      '<section class="tutorial-screen tutorial-analysis">',
        '<header class="tutorial-head"><span>AI SCANNING</span><h1>祭壇を解析中…</h1><p>グッズとメルカリ相場を照合しています</p></header>',
        '<div class="shrine-scan"><img src="assets/img/saidan.svg" alt="解析中のステライト祭壇"><div class="scan-beam"></div><span class="detect-box box-a">アクスタ ✓</span><span class="detect-box box-b">トレカ ✓</span><span class="detect-box box-c">ぬい ✓</span></div>',
        '<div class="recognition-status"><span class="ai-spinner"><i></i></span><div><strong>AIが解析中…</strong><p>7件の候補を検出しています</p></div></div>',
        progress(2),
      '</section>'
    ].join('');
  }

  function reviewRow(result, count) {
    var item = AppState.getItem(result.itemId);
    return [
      '<div class="recognition-row">',
        '<img src="' + item.thumb + '" alt="">',
        '<div class="recognition-copy"><h3>' + result.name + '</h3><p>相場 ' + AppState.formatYen(result.price) + '</p></div>',
        '<div class="mini-stepper"><button type="button" data-tutorial-count="' + result.itemId + '" data-delta="-1" aria-label="' + result.name + 'を減らす"' + (count <= 1 ? ' disabled' : '') + '>−</button><strong>' + count + '</strong><button type="button" data-tutorial-count="' + result.itemId + '" data-delta="1" aria-label="' + result.name + 'を増やす">＋</button></div>',
      '</div>'
    ].join('');
  }

  function renderReview(state) {
    var results = AI_RESULTS['saidan.svg'];
    var total = AppState.getTutorialTotal();
    var ready = state.tutorial.counts['stella-badge'] === 2 && total === 81000;
    return [
      '<section class="tutorial-screen tutorial-review">',
        '<header class="review-head"><div><span>7件を認識しました ✦</span><h1>個数を確認してください</h1></div><div class="ai-badge">AI</div></header>',
        '<div class="review-hint"><span>☝</span><p>実物は<strong>「ステラ 缶バッジ」が2個</strong>。<br>＋を押してAIの候補を直してみよう</p></div>',
        '<div class="recognition-list">' + results.map(function (result) { return reviewRow(result, state.tutorial.counts[result.itemId] || 1); }).join('') + '</div>',
        '<div class="review-footer"><div><span>現在の合計</span><strong>' + AppState.formatYen(total) + '</strong></div><button type="button" class="primary-button' + (ready ? '' : ' is-muted') + '" data-confirm-tutorial>この内容で確定</button></div>',
      '</section>'
    ].join('');
  }

  function renderValue() {
    return [
      '<section class="tutorial-screen tutorial-value">',
        '<div class="value-stars" aria-hidden="true">✦　⋆　✧</div>',
        '<span class="value-kicker">解析が完了しました</span>',
        '<div class="value-shrine"><img src="assets/img/saidan.svg" alt="登録したステライト祭壇"><span>7アイテムを登録 ✓</span></div>',
        '<div class="value-copy"><p>あなたの祭壇は</p><h1>¥81,000</h1><span>です</span></div>',
        '<p class="value-note">今日から相場の変化を自動で追いかけます</p>',
        '<button type="button" class="primary-button tutorial-cta" data-complete-tutorial>資産を見てみる <span>›</span></button>',
        progress(3),
      '</section>'
    ].join('');
  }

  global.Screens.tutorial = {
    key: function (state) { return state.tutorial.stage; },

    render: function () {
      var state = AppState.getState();
      if (state.tutorial.stage === 'capture') { return renderCapture(); }
      if (state.tutorial.stage === 'analyzing') { return renderAnalyzing(); }
      if (state.tutorial.stage === 'review') { return renderReview(state); }
      if (state.tutorial.stage === 'value') { return renderValue(); }
      return renderWelcome();
    },

    bind: function (root) {
      var start = root.querySelector('[data-start-tutorial]');
      if (start) { start.addEventListener('click', function () { AppState.startTutorialCapture(); }); }
      var file = root.querySelector('[data-tutorial-file]');
      if (file) {
        file.addEventListener('change', function () {
          if (file.files && file.files.length) { AppState.startTutorialAnalysis(); }
        });
      }
      root.querySelectorAll('[data-tutorial-count]').forEach(function (button) {
        button.addEventListener('click', function () {
          AppState.adjustTutorialCount(button.getAttribute('data-tutorial-count'), Number(button.getAttribute('data-delta')));
        });
      });
      var confirm = root.querySelector('[data-confirm-tutorial]');
      if (confirm) { confirm.addEventListener('click', function () { AppState.confirmTutorialItems(); }); }
      var complete = root.querySelector('[data-complete-tutorial]');
      if (complete) { complete.addEventListener('click', function () { AppState.completeTutorial(); }); }
    }
  };
}(window));
