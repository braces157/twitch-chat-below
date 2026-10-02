# Privacy

Twitch Chat Below stores only the layout toggle and chat height in Chrome's local extension storage. These preferences are not sent to a server.

The extension has no analytics, advertising, tracking, or developer-operated backend. It does not read chat messages, collect browsing history, or access Twitch passwords or authentication tokens.

On Twitch channel pages, it loads Twitch's official embedded chat directly from `www.twitch.tv`. Twitch handles that frame's messages, login, cookies, and moderation under [Twitch's privacy notice](https://www.twitch.tv/p/en/legal/privacy-notice/).

The `storage` permission saves your two settings. The content script runs only on `https://www.twitch.tv/*` to adjust the channel layout. The extension does not request access to other websites.

Removing the extension removes its locally stored preferences. Questions or problems can be reported through the [GitHub issue tracker](https://github.com/braces157/twitch-chat-below/issues).
