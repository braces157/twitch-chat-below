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
  let heightInput = null;
  let heightOutput = null;
  let theatreInfo = null;

  function channelFromUrl() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length !== 1) return null;
    const channel = parts[0].toLowerCase();
    return /^[a-z0-9_]{1,25}$/.test(channel) && !reserved.has(channel) ? channel : null;
  }

  function normalize(values) {
    return {
      enabled: values.enabled !== false,
      height: Number.isFinite(Number(values.height))
        ? Math.max(260, Math.min(900, Number(values.height))) : defaults.height
    };
  }

  function unmount() {
    document.documentElement.classList.remove("tcb-enabled", "tcb-theatre");
    document.documentElement.style.removeProperty("--tcb-theatre-player-height");
    theatreInfo?.classList.remove("tcb-theatre-info");
    theatreInfo = null;
    host?.remove();
    host = null;
    iframe = null;
    mountedChannel = "";
    heightInput = null;
    heightOutput = null;
  }

  function applyHeight() {
    const height = `${settings.height}px`;
    if (host && host.style.getPropertyValue("--tcb-chat-height") !== height) {
      host.style.setProperty("--tcb-chat-height", height);
    }
    if (heightInput) heightInput.value = String(settings.height);
    if (heightOutput && heightOutput.value !== `${settings.height} px`) heightOutput.value = `${settings.height} px`;
  }

  async function saveHeight() {
    try {
      await chrome.storage.local.set({ height: settings.height });
      heightInput?.removeAttribute("title");
    } catch {
      if (heightInput) heightInput.title = "Height changed for this page, but could not be saved. Reload the page to reconnect the extension.";
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

    const toolbar = document.createElement("div");
    toolbar.className = "tcb-toolbar";
    const title = document.createElement("strong");
    title.textContent = `Stream chat · ${channel}`;
    const heightControl = document.createElement("label");
    heightControl.className = "tcb-height-control";
    heightControl.htmlFor = "tcb-height";
    const heightLabel = document.createElement("span");
    heightLabel.textContent = "Chat height";
    heightInput = document.createElement("input");
    heightInput.id = "tcb-height";
    heightInput.type = "range";
    heightInput.min = "260";
    heightInput.max = "900";
    heightInput.step = "20";
    heightInput.setAttribute("aria-label", "Chat height");
    heightOutput = document.createElement("output");
    heightOutput.htmlFor = heightInput.id;
    heightInput.addEventListener("input", () => {
      settings.height = Number(heightInput.value);
      applyHeight();
    });
    heightInput.addEventListener("change", saveHeight);
    heightControl.append(heightLabel, heightInput, heightOutput);
    toolbar.append(title, heightControl);

    iframe = document.createElement("iframe");
    iframe.title = `${channel} Twitch chat`;
    const url = new URL(`https://www.twitch.tv/embed/${channel}/chat`);
    url.searchParams.set("parent", location.hostname);
    url.searchParams.set("darkpopout", "");
    iframe.src = url.href;
    // Do not sandbox the Twitch frame: it needs its normal login and popup flow.
    host.append(toolbar, iframe);
    about.before(host);
    mountedChannel = channel;
  }

  function reconcile() {
    const channel = channelFromUrl();
    const about = document.getElementById("live-channel-about-panel");
    // Fullscreen retains Twitch's normal layout. Theatre supports chat below.
    const theatre = document.querySelector(
      '.persistent-player--theatre, .persistent-player[data-a-player-state="theatre"], .channel-root--watch-theatre'
    );
    if (!settings.enabled || !channel || !about || document.fullscreenElement) {
      if (host || document.documentElement.classList.contains("tcb-enabled")) unmount();
      return;
    }
    if (!host?.isConnected || mountedChannel !== channel) {
      unmount();
      mount(channel, about);
    } else if (host.nextElementSibling !== about) {
      about.before(host);
    }
    applyHeight();
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
    // Twitch navigates without a full page load. This also catches theatre mode.
    const poll = setInterval(reconcile, 1000);
    document.addEventListener("fullscreenchange", schedule);
    window.addEventListener("resize", schedule);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      for (const key of Object.keys(defaults)) {
        if (changes[key]) settings[key] = changes[key].newValue ?? defaults[key];
      }
      settings = normalize(settings);
      reconcile();
    });
    window.addEventListener("pagehide", event => {
      if (event.persisted) return;
      if (timer !== null) clearTimeout(timer);
      clearInterval(poll);
      observer.disconnect();
    });
  }

  start();
})();
