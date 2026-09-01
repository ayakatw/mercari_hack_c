(function (global) {
    'use strict';

    // 確定前のステップ後退用。state.tutorial.stage を汚さずに表示だけ戻す。
    var localStage = null;

    function visibleStage(state) {
        return localStage || state.tutorial.stage;
    }

    function backButton(target) {
        return (
            '<button type="button" class="text-button" data-tutorial-back="' +
            target +
            '">‹ 前のステップに戻る</button>'
        );
    }

    function progress(active) {
        return (
            '<div class="tutorial-progress" aria-label="チュートリアル ' +
            active +
            ' / 3"><i class="' +
            (active >= 1 ? 'on' : '') +
            '"></i><i class="' +
            (active >= 2 ? 'on' : '') +
            '"></i><i class="' +
            (active >= 3 ? 'on' : '') +
            '"></i></div>'
        );
    }

    function renderWelcome() {
        return [
            '<section class="tutorial-screen tutorial-welcome">',
            '<div class="welcome-sparkles" aria-hidden="true"><span>✦</span><span>✧</span><span>⋆</span><span>✦</span></div>',
            '<div class="welcome-logo">推しポート <b>✦</b></div>',
            '<div class="welcome-visual"><div class="orb orb-one"></div><div class="orb orb-two"></div><img src="assets/img/saidan.png" alt="ステライトの祭壇"></div>',
            '<div class="welcome-copy"><span class="mini-pill">推し活が資産になるSNS</span><h1>その祭壇、<br><em>いくら</em>か知ってる?</h1><p>投稿するだけで、あなたの「好き」が<br>ポートフォリオになります。</p></div>',
            '<button type="button" class="primary-button tutorial-cta" data-start-tutorial>はじめる <span>›</span></button>',
            progress(1),
            '</section>',
        ].join('');
    }

    function renderCapture() {
        return [
            '<section class="tutorial-screen tutorial-capture">',
            '<header class="tutorial-head"><span>STEP 2</span><h1>この祭壇を送信しますか？</h1><p>全体画像を確認してから送信してください</p></header>',
            '<div class="shrine-preview"><img src="assets/img/saidan.png" alt="登録する祭壇の全体画像"><span class="shrine-preview-badge">全体画像</span></div>',
            '<div class="tutorial-capture-actions"><button type="button" class="tutorial-no-button" data-tutorial-no>いいえ</button><button type="button" class="primary-button tutorial-yes-button" data-tutorial-yes>はい、送信する</button></div>',
            progress(2),
            '</section>',
        ].join('');
    }

    function renderAnalyzing() {
        return [
            '<section class="tutorial-screen tutorial-analysis">',
            '<header class="tutorial-head"><span>AI SCANNING</span><h1>祭壇を解析中…</h1><p>グッズとメルカリ相場を照合しています</p></header>',
            '<div class="shrine-scan"><img src="assets/img/saidan.png" alt="解析中のステライト祭壇"><div class="scan-beam"></div><span class="detect-box box-a">アクスタ ✓</span><span class="detect-box box-b">トレカ ✓</span><span class="detect-box box-c">ぬい ✓</span></div>',
            '<div class="recognition-status"><span class="ai-spinner"><i></i></span><div><strong>AIが解析中…</strong><p>7件の候補を検出 ✦ 推しカラーを推定しています</p></div></div>',
            backButton('analyzing'),
            progress(2),
            '</section>',
        ].join('');
    }

    function reviewRow(result, count) {
        var item = AppState.getItem(result.itemId);
        return [
            '<div class="recognition-row">',
            '<img src="' + item.thumb + '" alt="">',
            '<div class="recognition-copy"><h3>' +
                result.name +
                '</h3><p>相場 ' +
                AppState.formatYen(result.price) +
                '</p></div>',
            '<div class="mini-stepper"><button type="button" data-tutorial-count="' +
                result.itemId +
                '" data-delta="-1" aria-label="' +
                result.name +
                'を減らす">−</button><strong>' +
                count +
                '</strong><button type="button" data-tutorial-count="' +
                result.itemId +
                '" data-delta="1" aria-label="' +
                result.name +
                'を増やす">＋</button></div>',
            '</div>',
        ].join('');
    }

    function themeOption(theme, current) {
        var active = theme.id === current;
        return [
            '<button type="button" class="theme-option' +
                (active ? ' is-active' : '') +
                '" data-set-theme="' +
                theme.id +
                '" aria-pressed="' +
                active +
                '" title="' +
                theme.hue +
                ' / ' +
                theme.desc +
                '">',
            '<span class="theme-dots" data-theme="' +
                theme.id +
                '" aria-hidden="true"><i></i><i></i><i></i></span>',
            '<strong>' + theme.name + '</strong>',
            '</button>',
        ].join('');
    }

    function setThemeWithFeedback(themeId) {
        if (AppState.getState().theme === themeId) {
            AppState.showToast(
                '推しカラー「' + Theme.find(themeId).name + '」を選択中です',
            );
            return;
        }
        AppState.setTheme(themeId);
    }

    function renderReview(state) {
        var results = AI_RESULTS['saidan.png'];
        var total = AppState.getTutorialTotal();
        var ready =
            state.tutorial.counts['stella-badge'] === 2 && total === 81000;
        var estimated = Theme.find(Theme.DEFAULT_THEME);
        return [
            '<section class="tutorial-screen tutorial-review">',
            '<header class="review-head"><div><span>7件を認識しました ✦</span><h1>個数を確認してください</h1></div></header>',
            '<div class="review-hint"><span>🎨</span><p>祭壇の色味から、あなたの推しカラーは<strong>' +
                estimated.hue +
                '「' +
                estimated.name +
                '」</strong>と推定。タップで今すぐ着せ替えできます</p></div>',
            '<div class="theme-options" role="group" aria-label="推しカラーを選ぶ">' +
                Theme.THEMES.map(function (theme) {
                    return themeOption(theme, state.theme);
                }).join('') +
                '</div>',
            '<div class="review-hint"><span>☝</span><p>実物は<strong>「ステラ 缶バッジ」が2個</strong>。＋を押してAIの候補を直してみよう</p></div>',
            '<div class="recognition-list">' +
                results
                    .map(function (result) {
                        return reviewRow(
                            result,
                            state.tutorial.counts[result.itemId] || 1,
                        );
                    })
                    .join('') +
                '</div>',
            '<div class="review-footer"><div><span>現在の合計</span><strong>' +
                AppState.formatYen(total) +
                '</strong></div><button type="button" class="primary-button' +
                (ready ? '' : ' is-muted') +
                '" data-confirm-tutorial>この内容で確定</button></div>',
            '</section>',
        ].join('');
    }

    function renderValue() {
        return [
            '<section class="tutorial-screen tutorial-value">',
            '<div class="value-stars" aria-hidden="true">✦　⋆　✧</div>',
            '<span class="value-kicker">解析が完了しました</span>',
            '<div class="value-shrine"><img src="assets/img/saidan.png" alt="登録したステライト祭壇"><span>7アイテムを登録 ✓</span></div>',
            '<div class="value-copy"><p>あなたの祭壇は</p><h1>¥81,000</h1><span>です</span></div>',
            '<p class="value-note">今日から相場の変化を自動で追いかけます</p>',
            backButton('confirmed'),
            '<button type="button" class="primary-button tutorial-cta" data-complete-tutorial>資産を見てみる <span>›</span></button>',
            progress(3),
            '</section>',
        ].join('');
    }

    global.Screens.tutorial = {
        key: function (state) {
            return visibleStage(state);
        },

        render: function () {
            var state = AppState.getState();
            var stage = visibleStage(state);
            if (stage === 'capture') {
                return renderCapture();
            }
            if (stage === 'analyzing') {
                return renderAnalyzing();
            }
            if (stage === 'review') {
                return renderReview(state);
            }
            if (stage === 'value') {
                return renderValue();
            }
            return renderWelcome();
        },

        bind: function (root) {
            var start = root.querySelector('[data-start-tutorial]');
            if (start) {
                start.addEventListener('click', function () {
                    localStage = null;
                    AppState.startTutorialCapture();
                });
            }
            var yes = root.querySelector('[data-tutorial-yes]');
            if (yes) {
                yes.addEventListener('click', function () {
                    localStage = null;
                    AppState.startTutorialAnalysis();
                });
            }
            var no = root.querySelector('[data-tutorial-no]');
            if (no) {
                no.addEventListener('click', function () {
                    localStage = null;
                    AppState.cancelTutorialCapture();
                });
            }
            root.querySelectorAll('[data-tutorial-back]').forEach(
                function (button) {
                    button.addEventListener('click', function () {
                        var target = button.getAttribute('data-tutorial-back');
                        if (target === 'welcome') {
                            localStage = 'welcome';
                            AppState.showToast('最初の画面に戻りました');
                            return;
                        }
                        if (target === 'capture') {
                            localStage = null;
                            AppState.startTutorialCapture();
                            return;
                        }
                        if (target === 'analyzing') {
                            AppState.showToast(
                                '解析中のため、完了後に前のステップへ戻れます（デモ）',
                            );
                            return;
                        }
                        AppState.showToast('確定後は前のステップに戻せません');
                    });
                },
            );
            root.querySelectorAll('[data-tutorial-count]').forEach(
                function (button) {
                    button.addEventListener('click', function () {
                        var itemId =
                            button.getAttribute('data-tutorial-count');
                        var delta = Number(button.getAttribute('data-delta'));
                        var current =
                            AppState.getState().tutorial.counts[itemId] || 1;
                        if (delta < 0 && current <= 1) {
                            AppState.showToast('個数は1個以上で登録してください');
                            return;
                        }
                        if (delta > 0 && current >= 5) {
                            AppState.showToast('個数は5個まで変更できます');
                            return;
                        }
                        AppState.adjustTutorialCount(itemId, delta);
                    });
                },
            );
            root.querySelectorAll('[data-set-theme]').forEach(
                function (button) {
                    button.addEventListener('click', function () {
                        setThemeWithFeedback(
                            button.getAttribute('data-set-theme'),
                        );
                    });
                },
            );
            var estimatedTheme = root.querySelector(
                '[data-apply-estimated-theme]',
            );
            if (estimatedTheme) {
                var applyEstimatedTheme = function () {
                    setThemeWithFeedback(Theme.DEFAULT_THEME);
                };
                estimatedTheme.addEventListener('click', applyEstimatedTheme);
                estimatedTheme.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        applyEstimatedTheme();
                    }
                });
            }
            var confirm = root.querySelector('[data-confirm-tutorial]');
            if (confirm) {
                confirm.addEventListener('click', function () {
                    localStage = null;
                    AppState.confirmTutorialItems();
                });
            }
            var complete = root.querySelector('[data-complete-tutorial]');
            if (complete) {
                complete.addEventListener('click', function () {
                    localStage = null;
                    AppState.completeTutorial();
                });
            }
        },
    };
})(window);
