(() => {
  "use strict";

  // The embedded Twitch chat handles messages, authentication and moderation.
  // This extension only changes the layout and stores these two preferences.
  const defaults = { enabled: true, height: 420 };
  const reserved = new Set([
    "directory", "downloads", "jobs", "p", "search", "settings", "subscriptions",
    "turbo", "videos", "wallet", "inventory", "drops", "friends", "messages",
    "login", "signup", "activate", "prime", "store", "moderator", "dashboard"
  ]);
  let settings = { ...defaults };
  let host = null;
  let iframe = null;
  let mountedChannel = "";
  let timer = null;
  let resizeHandle = null;
  let resize = null;
  let theatreInfo = null;

  function channelFromUrl() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length !== 1) return null;
    const channel = parts[0].toLowerCase();
    return /^[a-z0-9_]{1,25}$/.test(channel) && !reserved.has(channel) ? channel : null;
  }

  function isPortraitMonitor() {
    // Use the display dimensions, not the browser window: a narrow window on
    // a landscape monitor should still use Twitch's original sidebar.
    return window.screen.width > 0 && window.screen.height > window.screen.width;
  }

  function normalize(values) {
    return {
      enabled: values.enabled !== false,
      height: Number.isFinite(Number(values.height))
        ? Math.max(260, Math.min(900, Number(values.height))) : defaults.height
    };
  }

  function unmount() {
    finishResize(false);
    document.documentElement.classList.remove("tcb-enabled", "tcb-theatre");
    document.documentElement.style.removeProperty("--tcb-theatre-player-height");
    theatreInfo?.classList.remove("tcb-theatre-info");
    theatreInfo = null;
    host?.remove();
    host = null;
    iframe = null;
    mountedChannel = "";
    resizeHandle = null;
  }

  function applyHeight() {
    const height = `${settings.height}px`;
    if (host && host.style.getPropertyValue("--tcb-chat-height") !== height) {
      host.style.setProperty("--tcb-chat-height", height);
    }
    resizeHandle?.setAttribute("aria-valuenow", String(settings.height));
    resizeHandle?.setAttribute("aria-valuetext", `${settings.height} pixels`);
  }

  async function saveHeight() {
    try {
      await chrome.storage.local.set({ height: settings.height });
      if (resizeHandle) resizeHandle.title = "Drag to resize chat";
    } catch {
      if (resizeHandle) resizeHandle.title = "Height changed for this page, but could not be saved. Reload the page to reconnect the extension.";
    }
  }

  function finishResize(save = true) {
    if (!resize) return;
    const pointerId = resize.pointerId;
    resize = null;
    host?.classList.remove("tcb-resizing");
    document.documentElement.classList.remove("tcb-resizing");
    if (resizeHandle?.hasPointerCapture(pointerId)) resizeHandle.releasePointerCapture(pointerId);
    if (save) saveHeight();
  }

  function setHeight(height) {
    settings.height = Math.round(Math.max(260, Math.min(900, height)));
    applyHeight();
  }

  function placeChat(about) {
    const information = document.getElementById("live-channel-stream-information");
    // Anchor to stream information rather than the offer's changing text or
    // generated classes. Offers and About keep their original order below chat.
    const afterInformation = information && information.parentElement?.contains(about);
    host.classList.toggle("tcb-after-stream-info", Boolean(afterInformation));
    if (afterInformation) {
      if (information.nextElementSibling !== host) information.after(host);
    } else if (host.nextElementSibling !== about) {
      about.before(host);
    }
  }

  function updateTheatre(theatre) {
    document.documentElement.classList.toggle("tcb-theatre", Boolean(theatre));
    const info = theatre ? document.querySelector(".channel-info-content")?.parentElement : null;
    if (theatreInfo !== info) {
      theatreInfo?.classList.remove("tcb-theatre-info");
      theatreInfo = info;
      theatreInfo?.classList.add("tcb-theatre-info");
    }
    if (!theatre) {
      document.documentElement.style.removeProperty("--tcb-theatre-player-height");
      return;
    }
    // Theatre pins the player over the channel information. Reserve its height
    // in the scrollable channel layout so chat and About remain accessible.
    const wrapper = document.querySelector(".root-scrollable__wrapper");
    const width = wrapper?.getBoundingClientRect().width || window.innerWidth;
    const height = `${Math.round(Math.min(width * 9 / 16, Math.max(180, window.innerHeight - 160)))}px`;
    if (document.documentElement.style.getPropertyValue("--tcb-theatre-player-height") !== height) {
      document.documentElement.style.setProperty("--tcb-theatre-player-height", height);
    }
  }

  function mount(channel, about) {
    host = document.createElement("section");
    host.id = "tcb-panel";
    host.setAttribute("aria-label", "Chat below the stream");

    resizeHandle = document.createElement("div");
    resizeHandle.className = "tcb-resize-handle";
    resizeHandle.tabIndex = 0;
    resizeHandle.title = "Drag to resize chat";
    resizeHandle.setAttribute("role", "separator");
    resizeHandle.setAttribute("aria-label", "Resize chat");
    resizeHandle.setAttribute("aria-orientation", "horizontal");
    resizeHandle.setAttribute("aria-valuemin", "260");
    resizeHandle.setAttribute("aria-valuemax", "900");
    resizeHandle.addEventListener("pointerdown", event => {
      if (event.button !== 0 || resize) return;
      event.preventDefault();
      resize = { pointerId: event.pointerId, startY: event.clientY, startHeight: settings.height };
      resizeHandle.setPointerCapture(event.pointerId);
      host.classList.add("tcb-resizing");
      document.documentElement.classList.add("tcb-resizing");
    });
    resizeHandle.addEventListener("pointermove", event => {
      if (!resize || event.pointerId !== resize.pointerId) return;
      setHeight(resize.startHeight + event.clientY - resize.startY);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      resizeHandle.addEventListener(type, event => {
        if (resize && event.pointerId === resize.pointerId) finishResize();
      });
    }
    resizeHandle.addEventListener("keydown", event => {
      let height = settings.height;
      if (event.key === "ArrowUp") height -= 20;
      else if (event.key === "ArrowDown") height += 20;
      else if (event.key === "Home") height = 260;
      else if (event.key === "End") height = 900;
      else return;
      event.preventDefault();
      setHeight(height);
      saveHeight();
    });

    iframe = document.createElement("iframe");
    iframe.title = `${channel} Twitch chat`;
    const url = new URL(`https://www.twitch.tv/embed/${channel}/chat`);
    url.searchParams.set("parent", location.hostname);
    url.searchParams.set("darkpopout", "");
    iframe.src = url.href;
    // Do not sandbox the Twitch frame: it needs its normal login and popup flow.
    host.append(iframe, resizeHandle);
    placeChat(about);
    mountedChannel = channel;
  }

  function reconcile() {
    const channel = channelFromUrl();
    const about = document.getElementById("live-channel-about-panel");
    // Fullscreen retains Twitch's normal layout. Theatre supports chat below.
    const theatre = document.querySelector(
      '.persistent-player--theatre, .persistent-player[data-a-player-state="theatre"], .channel-root--watch-theatre'
    );
    if (!settings.enabled || !isPortraitMonitor() || !channel || !about) {
      if (host || document.documentElement.classList.contains("tcb-enabled")) unmount();
      return;
    }
    // Keep the embedded frame alive during fullscreen so switching modes does
    // not reload chat while Twitch is transitioning its player subtree.
    if (document.fullscreenElement) {
      finishResize();
      document.documentElement.classList.remove("tcb-enabled");
      updateTheatre(null);
      if (host) host.hidden = true;
      return;
    }
    if (!host?.isConnected || mountedChannel !== channel) {
      unmount();
      mount(channel, about);
    } else {
      placeChat(about);
    }
    applyHeight();
    host.hidden = false;
    document.documentElement.classList.add("tcb-enabled");
    updateTheatre(theatre);
  }

  function schedule() {
    if (timer === null) timer = setTimeout(() => {
      timer = null;
      reconcile();
    }, 150);
  }

  const observer = new MutationObserver(records => {
    // Ignore frequent chat/player changes, including our own chat frame.
    if (records.some(record => !(record.target instanceof Element) ||
      !record.target.closest(".right-column, #tcb-panel, .video-player, #live-channel-stream-information"))) {
      schedule();
    }
  });

  async function start() {
    try {
      settings = normalize(await chrome.storage.local.get(defaults));
    } catch {
      settings = { ...defaults };
    }
    reconcile();
    observer.observe(document.body, { childList: true, subtree: true });
    // Also catch moving between monitors without a resize or page navigation.
    const poll = setInterval(reconcile, 1000);
    document.addEventListener("fullscreenchange", schedule);
    window.addEventListener("resize", schedule);
    window.screen.orientation?.addEventListener("change", schedule);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      for (const key of Object.keys(defaults)) {
        if (changes[key]) settings[key] = changes[key].newValue ?? defaults[key];
      }
      settings = normalize(settings);
      reconcile();
    });
    window.addEventListener("pagehide", event => {
      if (event.target !== window || event.persisted) return;
      if (timer !== null) clearTimeout(timer);
      clearInterval(poll);
      observer.disconnect();
    });
  }

  start();
})();
