<p align="center">
  <img src="icons/icon-128.png" width="88" height="88" alt="Twitch Chat Below icon">
</p>
<h1 align="center">Twitch Chat Below</h1>
<p align="center">More room for your stream. Chat right underneath.</p>
<p align="center">
  <a href="https://github.com/braces157/twitch-chat-below/releases/latest">Download</a> ·
  <a href="PRIVACY.md">Privacy</a> ·
  <a href="https://github.com/braces157/twitch-chat-below/issues">Report an issue</a>
</p>

A lightweight Chrome extension that moves Twitch's official embedded chat above the About section and gives the video the full available width. Supports normal and theatre layouts, with settings stored locally.

<p align="center"><img src="assets/popup-preview.png" width="340" alt="Extension settings with layout toggle and adjustable chat height"></p>

## Features

- **Full-width video** — hide the right chat sidebar and place chat beneath the stream information.
- **Adjustable chat** — set a height from 260 to 900 pixels in the popup or the chat toolbar.
- **About stays visible** — the channel's original About section remains below chat.
- **Theatre support** — chat stays beneath the video in theatre mode; fullscreen uses Twitch's normal layout.
- **One-click restore** — switch the extension off to return to the original layout.
- **Local preferences** — no analytics, API keys, signup, or developer-operated server.

## Install in Chrome

1. Download `twitch-chat-below-v1.1.0.zip` from the [latest release](https://github.com/braces157/twitch-chat-below/releases/latest).
2. Extract the ZIP into a permanent folder.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Choose **Load unpacked**, then select the extracted folder containing `manifest.json`.
5. Refresh an open Twitch channel page.

Pin the extension to Chrome's toolbar to access its settings. You can also load this repository's root folder directly. Keep the installed folder in place; Chrome loads the extension from that location.

This project is distributed through GitHub. It is not currently published on the Chrome Web Store and is not affiliated with Twitch or Google.

## Privacy and permissions

The extension requests only `storage` and runs its content script on `https://www.twitch.tv/*`. It saves the layout toggle and chat height locally. Twitch's own embedded chat handles authentication, messages, and moderation. The extension does not read chat messages or Twitch credentials. See [PRIVACY.md](PRIVACY.md) for details.

## Compatibility

Twitch may change its page structure, so future updates can affect the layout. Switch the extension off if you encounter a problem and [open an issue](https://github.com/braces157/twitch-chat-below/issues) with your Chrome version and the affected channel URL.

Third-party emote extensions such as 7TV may behave differently inside embedded chat. This extension does not reduce the video's height; on shorter windows, use a smaller chat height or browser zoom.

## Develop and package

The extension itself has no dependencies or build step. To validate JavaScript, manifest references, PNG dimensions, and create a ZIP, install Python 3.9+ and Node.js, then run:

```sh
python scripts/package.py
```

The archive is written to `dist/`, with `manifest.json` at its root. It includes only runtime files, icons, and the privacy notice. GitHub Actions runs the same validation and uploads a downloadable build artifact.

## Verification

The branded popup was checked in Chrome using a temporary storage adapter: toggling, both height limits, and settings persistence after reload passed, with no browser warnings or errors. The screenshot above shows that preview. The adapter is excluded from the release ZIP.

Manifest references, PNG dimensions, JavaScript syntax, and ZIP integrity were validated. This branding release did not re-test the current Twitch layout or install the packaged extension; an unpacked installation remains the final browser integration check.

The original generated artwork and generation prompt are recorded in [assets/](assets/README.md). Changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Remove

Remove Twitch Chat Below in `chrome://extensions`, then refresh Twitch. Chrome removes the extension's stored preferences.
