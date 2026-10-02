"use strict";

const enabled = document.getElementById("enabled");
const height = document.getElementById("height");
const heightValue = document.getElementById("height-value");
const status = document.getElementById("status");

async function initialize() {
  const settings = await chrome.storage.local.get({ enabled: true, height: 420 });
  enabled.checked = settings.enabled !== false;
  height.value = String(settings.height);
  heightValue.value = `${height.value} px`;
  enabled.disabled = false;
  height.disabled = false;
}

async function save() {
  try {
    await chrome.storage.local.set({ enabled: enabled.checked, height: Number(height.value) });
    status.textContent = "Saved";
  } catch {
    status.textContent = "Could not save. Reopen the extension and try again.";
  }
}

height.addEventListener("input", () => { heightValue.value = `${height.value} px`; });
height.addEventListener("change", save);
enabled.addEventListener("change", save);
initialize().catch(() => { status.textContent = "Could not load settings. Reopen the extension."; });
