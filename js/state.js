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
      caption: ''
    };
  }

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
    listing: {
      itemId: null,
      stage: 'form'
    },
    assetDetailItemId: null,
    shrineCardOpen: false,
    toast: null
  };

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

    startPostAnalysis: function () {
      state.post.selected = true;
      state.post.stage = 'analyzing';
      notify();
      if (analysisTimer) {
        global.clearTimeout(analysisTimer);
      }
      analysisTimer = global.setTimeout(function () {
        state.post.stage = 'result';
        notify();
      }, 1500);
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
      var item = getItem('stella-acsta');
      var addedCount = state.post.count;
      item.count += addedCount;
      item.duplicate = item.count >= 2;
      state.postedDemo = true;
      state.post.stage = 'complete';
      state.createdPosts.unshift({
        id: 'created-' + Date.now(),
        image: 'assets/img/acsta2.svg',
        caption: state.post.caption || '新しいステラのアクスタをお迎えしました✨',
        tag: 'ステラ アクリルスタンド',
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
