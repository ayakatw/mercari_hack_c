(function (global) {
  'use strict';

  global.Screens = global.Screens || {};

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function initialTutorialCounts() {
    var counts = {};
    AI_RESULTS['saidan.svg'].forEach(function (result) {
      counts[result.itemId] = result.count;
    });
    return counts;
  }

  function initialPostState() {
    return {
      stage: 'select',
      selected: false,
      count: 1,
      giveaway: false,
      caption: '',
      imageUrl: null,
      analysis: null,
      analysisError: null
    };
  }

  // 画像解析 API（server.js）。file:// 直開きなど到達できない環境では仕込みデータへ退避する。
  var ANALYZE_ENDPOINT = '/api/analyze';
  var ANALYZE_ERROR_MESSAGE = 'AIによる分析に失敗しました。手動で入力できます。';
  var MIN_ANALYSIS_MS = 1200;

  var listeners = [];
  var analysisTimer = null;
  var tutorialTimer = null;
  var toastTimer = null;

  var state = {
    route: 'tutorial',
    tutorialComplete: false,
    tutorial: {
      stage: 'welcome',
      selected: false,
      counts: initialTutorialCounts()
    },
    items: clone(ITEMS.filter(function (item) { return !item.pendingDemo; })),
    likedPosts: {},
    requestSent: false,
    selectedProfile: null,
    post: initialPostState(),
    createdPosts: [],
    postedDemo: false,
    postedItemId: null,
    listing: {
      itemId: null,
      stage: 'form'
    },
    assetDetailItemId: null,
    shrineCardOpen: false,
    toast: null
  };

  // 解析結果を data.js の ITEMS と同じ形の資産にする。
  // history30d は最終日だけ計上する（過去から持っていたことにしない）。
  function createItemFromAnalysis(analysis, count, imageUrl) {
    var price = analysis.estimatedPrice || 3200;
    var lastIndex = HISTORY_LABELS.length - 1;
    return {
      id: 'ai-' + Date.now(),
      name: analysis.title,
      shortName: analysis.title,
      thumb: imageUrl || 'assets/img/acsta2.svg',
      marketPrice: price,
      count: count,
      trend7d: 0,
      history30d: HISTORY_LABELS.map(function (label, index) {
        return index === lastIndex ? price : 0;
      }),
      status: 'hold',
      duplicate: count >= 2,
      category: analysis.category,
      condition: analysis.condition
    };
  }

  function notify() {
    listeners.slice().forEach(function (listener) {
      listener(state);
    });
  }

  function getItem(itemId) {
    return state.items.find(function (item) { return item.id === itemId; }) || null;
  }

  function getUser(handle) {
    return USERS.find(function (user) { return user.handle === handle; }) || null;
  }

  function getTotal() {
    return state.items.reduce(function (sum, item) {
      return sum + (item.marketPrice * item.count);
    }, 0);
  }

  function getTutorialTotal() {
    return AI_RESULTS['saidan.svg'].reduce(function (sum, result) {
      return sum + (result.price * (state.tutorial.counts[result.itemId] || 1));
    }, 0);
  }

  function showToast(message) {
    var token = Date.now() + Math.random();
    state.toast = { message: message, token: token };
    if (toastTimer) {
      global.clearTimeout(toastTimer);
    }
    toastTimer = global.setTimeout(function () {
      if (state.toast && state.toast.token === token) {
        state.toast = null;
        notify();
      }
    }, 3200);
    notify();
  }

  var AppState = {
    subscribe: function (listener) {
      listeners.push(listener);
      return function () {
        listeners = listeners.filter(function (candidate) { return candidate !== listener; });
      };
    },

    getState: function () {
      return state;
    },

    getItem: getItem,
    getUser: getUser,
    getTotal: getTotal,
    getTutorialTotal: getTutorialTotal,

    formatYen: function (value) {
      return '¥' + Number(value).toLocaleString('ja-JP');
    },

    setRoute: function (route) {
      state.route = route;
      state.assetDetailItemId = null;
      state.shrineCardOpen = false;
      notify();
    },

    openProfile: function (handle) {
      var user = getUser(handle);
      if (!user || !user.tappable) {
        return;
      }
      state.selectedProfile = handle;
      state.route = 'profile';
      notify();
    },

    startTutorialCapture: function () {
      state.tutorial.stage = 'capture';
      notify();
    },

    startTutorialAnalysis: function () {
      state.tutorial.selected = true;
      state.tutorial.stage = 'analyzing';
      notify();
      if (tutorialTimer) {
        global.clearTimeout(tutorialTimer);
      }
      tutorialTimer = global.setTimeout(function () {
        state.tutorial.stage = 'review';
        notify();
      }, 1500);
    },

    adjustTutorialCount: function (itemId, delta) {
      var current = state.tutorial.counts[itemId] || 1;
      state.tutorial.counts[itemId] = Math.max(1, Math.min(5, current + delta));
      notify();
    },

    confirmTutorialItems: function () {
      var exactCount = state.tutorial.counts['stella-badge'] === 2;
      var exactTotal = getTutorialTotal() === 81000;
      if (!exactCount || !exactTotal) {
        showToast('実物に合わせて「ステラ 缶バッジ」を2個にしてください');
        return;
      }
      state.tutorial.stage = 'value';
      notify();
    },

    completeTutorial: function () {
      state.items.forEach(function (item) {
        if (state.tutorial.counts[item.id]) {
          item.count = state.tutorial.counts[item.id];
          item.duplicate = item.count >= 2;
        }
      });
      state.tutorialComplete = true;
      state.tutorial.stage = 'done';
      state.route = 'assets';
      notify();
    },

    toggleLike: function (postId) {
      state.likedPosts[postId] = !state.likedPosts[postId];
      notify();
    },

    sendRequest: function () {
      state.requestSent = true;
      showToast('リクエストを送りました。取引はメルカリのあんしん決済で行われます');
    },

    startPostAnalysis: function (file) {
      if (state.post.stage === 'analyzing') {
        return;
      }
      state.post.selected = true;
      state.post.stage = 'analyzing';
      state.post.analysis = null;
      state.post.analysisError = null;
      if (file && global.URL && global.URL.createObjectURL) {
        state.post.imageUrl = global.URL.createObjectURL(file);
      }
      notify();

      if (analysisTimer) {
        global.clearTimeout(analysisTimer);
      }

      var startedAt = Date.now();

      // スピナーが一瞬で消えないよう最低表示時間だけ待ってから result へ進む。
      function finish(analysis, errorMessage) {
        var wait = Math.max(0, MIN_ANALYSIS_MS - (Date.now() - startedAt));
        analysisTimer = global.setTimeout(function () {
          state.post.analysis = analysis;
          state.post.analysisError = errorMessage || null;
          if (analysis && analysis.description && !state.post.caption) {
            state.post.caption = analysis.description;
          }
          state.post.stage = 'result';
          notify();
        }, wait);
      }

      if (!file || !global.fetch || !global.FormData) {
        finish(null, null);
        return;
      }

      var form = new global.FormData();
      form.append('image', file);
      // 既存グッズの2個目かどうかを Gemini に判断させるため一覧を渡す。
      form.append('items', JSON.stringify(state.items.map(function (item) {
        return { id: item.id, name: item.name };
      })));

      global.fetch(ANALYZE_ENDPOINT, { method: 'POST', body: form })
        .then(function (response) { return response.json(); })
        .then(function (payload) {
          if (payload && payload.success && payload.data) {
            finish(payload.data, null);
            return;
          }
          // 画面には出さない開発者向けの手がかり。
          global.console.error('[推しポート] 解析APIがエラーを返しました:', payload && payload.error);
          finish(null, (payload && payload.error) || ANALYZE_ERROR_MESSAGE);
        })
        .catch(function (error) {
          global.console.error(
            '[推しポート] 解析APIに接続できません（' + ANALYZE_ENDPOINT + '）。' +
            'サーバが起動しているか確認してください: npm start → http://localhost:3000',
            error
          );
          finish(null, ANALYZE_ERROR_MESSAGE);
        });
    },

    adjustPostCount: function (delta) {
      state.post.count = Math.max(1, Math.min(5, state.post.count + delta));
      notify();
    },

    togglePostGiveaway: function () {
      state.post.giveaway = !state.post.giveaway;
      notify();
    },

    setPostCaption: function (caption) {
      state.post.caption = caption;
    },

    submitPost: function () {
      if (state.post.stage !== 'result') {
        return;
      }
      var analysis = state.post.analysis;
      var addedCount = state.post.count;
      var item = null;

      if (analysis) {
        // Gemini が既存グッズと同定したものだけ個数を足す。
        item = analysis.matchedItemId ? getItem(analysis.matchedItemId) : null;
      } else {
        // 解析結果がない（API 停止時）は従来のデモ挙動に退避する。
        item = getItem('stella-acsta');
      }

      if (item) {
        item.count += addedCount;
        item.duplicate = item.count >= 2;
      } else {
        item = createItemFromAnalysis(analysis, addedCount, state.post.imageUrl);
        state.items.push(item);
      }

      state.postedDemo = true;
      state.postedItemId = item.id;
      state.post.stage = 'complete';
      state.createdPosts.unshift({
        id: 'created-' + Date.now(),
        image: state.post.imageUrl || 'assets/img/acsta2.svg',
        caption: state.post.caption || (item.name + 'をお迎えしました✨'),
        tag: item.name,
        giveaway: state.post.giveaway
      });
      notify();
    },

    resetPost: function () {
      state.post = initialPostState();
      notify();
    },

    prepareListing: function (itemId) {
      if (!getItem(itemId)) {
        return;
      }
      state.listing.itemId = itemId;
      state.listing.stage = 'form';
      state.assetDetailItemId = null;
      state.route = 'listing';
      notify();
    },

    submitListing: function () {
      var item = getItem(state.listing.itemId);
      if (!item) {
        return;
      }
      item.status = 'listed';
      state.listing.stage = 'success';
      notify();
    },

    finishListing: function () {
      state.route = 'assets';
      notify();
    },

    openAssetDetail: function (itemId) {
      if (itemId !== 'stella-card') {
        return;
      }
      state.assetDetailItemId = itemId;
      notify();
    },

    closeAssetDetail: function () {
      state.assetDetailItemId = null;
      notify();
    },

    setShrineCardOpen: function (isOpen) {
      state.shrineCardOpen = Boolean(isOpen);
      notify();
    },

    shareShrineCard: function () {
      showToast('Xへのシェア画面を開きました（デモ）');
    },

    showToast: showToast
  };

  global.AppState = AppState;
}(window));
