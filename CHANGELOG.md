# Changelog

## 1.3.1

- Portrait theatre fills the browser content area with full-width video and chat directly underneath at the same width.
- Hide Twitch navigation and remove chat margins in theatre mode; stream information, offers, and About remain below chat.
- Preserve the video aspect ratio and update theatre layout promptly when player mode changes.
- Keep the chat iframe in place while switching modes so the layout change does not reload messages.

## 1.3.0

- Automatically activate only on portrait monitors, using display dimensions rather than browser window dimensions.
- Restore Twitch's original layout on landscape monitors, including 1920x1080, even with a narrow browser window.
- Recheck the display when moving the browser between monitors; saved chat height and the enable preference are retained.

## 1.2.2

- Match the channel layout to Twitch's page background, preventing purple gaps around chat and channel information in theatre mode.

## 1.2.1

- Chat appears directly below stream information, above subscription offers such as Just For You and the original About section.
- Placement follows the stream information anchor in normal and theatre modes, including channels without an offer.

## 1.2.0

- Removed the extension's chat title and height toolbar so only Twitch's own chat header remains.
- Resize chat by dragging its bottom edge; the height is saved locally.
- The bottom resize edge also supports Arrow Up/Down, Home, and End when focused.
- Popup height settings preserve the exact height selected by dragging.

## 1.1.0

- Full-width Twitch video with official embedded chat above the About section in normal and theatre modes.
- Adjustable chat height from 260 to 900 pixels, available in chat and the extension popup.
- A layout toggle restores the original Twitch layout; fullscreen uses Twitch's standard layout.
- Generated stream-and-chat branding with Chrome toolbar and extension icons.
- Accessible dark popup, local preferences, and documented privacy behavior.
