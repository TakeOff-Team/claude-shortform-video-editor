# edit.json: the beat-by-beat plan

`projects/<slug>/edit.json` is the whole edit. The engine reads it with `words.json` and `my-style/style.json`; `./edit storyboard` and `./edit render` check it first and list any problems in plain English.

```json
{
  "faceCenter": 0.42,
  "beats": [
    { "s": 0.00, "e": 1.35, "layout": "split", "panel": { "type": "title", "text": "This app [[circle:replaced]] my assistant" }, "note": "hook: picture of the first sentence" },
    { "s": 1.35, "e": 2.60, "layout": "face", "note": "breather" },
    { "s": 2.60, "e": 4.10, "layout": "full", "panel": { "type": "stat", "value": "$2,000", "label": "a month, saved" } }
  ]
}
```

- `s` / `e`: seconds on the **cut** timeline (from `words.json`). Start each beat on the word that names its thing. Beats are in order and don't overlap. Cover the whole video; any gap shows plain face.
- `layout`: `face` | `split` | `full` | `overlay` (see principles.md for when).
- `panel`: the graphic (not needed for `face`).
- `zoom`: face punch-in, like `1.15`. Unset = face/split beats alternate wide and punched-in automatically.
- `enter`: `up` `down` `left` `right` `pop` `fade` `none`. Unset = cycles automatically.
- `captions`: `false` hides captions for that beat (for example over a screenshot full of text).
- `note`: why the beat exists. Shows on the storyboard card.
- `faceCenter`: where the face's centre sits in the frame, 0 = top, 1 = bottom. Read it off `./edit face <slug>`. Split layout uses it to keep the face framed high.

## Text markup (works in any text field)

| Write | Get |
|---|---|
| `*word*` | word in the accent colour |
| `[[circle:word]]` | a mark draws itself around it |
| `[[underline:word]]` `[[strike:word]]` `[[highlight:word]]` | the other marks |
| `[[circle@14:word]]` | drawn 14 frames (~0.5s) into the beat. Time it to land on the word: `(word.s - beat.s) * 30` |
| `{{img:logo.png}}` | an image from `assets/`, inline, one line tall |
| a line break (`\n`) | new line |

One mark per beat, two at most.

## Panels

All file paths are relative to `projects/<slug>/assets/`. All `at` values are **seconds on the cut timeline** (take them from words.json so each item lands on its word). Items without `at` spread across the beat.

### title
```json
{ "type": "title", "text": "Stop [[strike:typing]] *talking* to AI", "sub": "it's 3x faster", "size": 110, "align": "center" }
```
Big words. Size is automatic from the length; set `size` only to override. Keep it under ~8 words.

### stat
```json
{ "type": "stat", "value": "85,000", "label": "views in *24 hours*", "countUp": true }
```
A big number that counts up. Prefix and suffix survive (`$2,000`, `3.5x`, `40%`).

### list
```json
{ "type": "list", "title": "What it does", "marker": "check", "items": [{ "text": "Clips your footage", "at": 6.2 }, { "text": "Adds captions", "at": 7.1 }] }
```
`marker`: `check` | `number` | `bullet` | `x`. Rows land on their words. Great for "3 things" videos: same list across beats, or one row per beat.

### media
```json
{ "type": "media", "src": "pricing-page.png", "frame": "browser", "url": "example.com/pricing", "focus": { "x": 0.08, "y": 0.42, "w": 0.4, "h": 0.12, "at": 9.3 }, "zoom": false, "caption": "*$20* a month" }
```
A screenshot, photo or video clip (`.mp4` `.mov` play muted).
- `frame`: `card` (default) | `browser` (window with an address bar) | `phone` (phone bezel, for app screenshots) | `none`.
- `focus`: a box on the image (0 to 1 fractions of its width/height) that gets circled at `at`; with `"zoom": true` the camera pushes into it instead. Use it to point at the exact line being talked about.
- `fill: true`: covers the whole layout area edge to edge with a slow push-in (B-roll). With `layout: "full"` it's full screen.

### logos
```json
{ "type": "logos", "title": "3 tools I use daily", "items": [{ "src": "notion.svg", "label": "Notion", "at": 3.1 }, { "src": "claude.svg", "label": "Claude", "at": 3.6 }] }
```
Tiles pop in one by one. 1 to 6 items.

### compare
```json
{ "type": "compare", "left": { "title": "Before", "items": ["4 hours editing"] }, "right": { "title": "After", "items": ["20 minutes"] }, "at": 12.4 }
```
Left gets ✗, right gets ✓ and lands at `at`.

### chat
```json
{ "type": "chat", "app": "Messages", "messages": [{ "from": "them", "text": "Can you send the deck?", "at": 5.0 }, { "from": "me", "text": "Already did 😎", "at": 5.8 }] }
```

### typing
```json
{ "type": "typing", "variant": "prompt", "label": "Claude", "text": "Clip this video and remove the dead space", "result": "Done. 3:21 → 38 seconds.", "resultAt": 14.2 }
```
`variant`: `prompt` (AI chat box) | `search` (search bar) | `terminal`. Text types itself out over the beat; `result` appears under it.

### icon
```json
{ "type": "icon", "emoji": "☕", "label": "one coffee a month" }
```
Or `"src": "logo.png"`. Only when the emoji or logo IS the thing being said.

### quote
```json
{ "type": "quote", "text": "The best editors cut on the word.", "author": "Someone real" }
```

## Getting real assets

Put everything in `projects/<slug>/assets/`:
- **The creator's own screenshots and screen recordings** first. Ask for them for any product, result or number they mention.
- **Screenshots of public pages:** use any browser or screenshot tool you have; save as PNG and crop to the part that matters.
- **Logos:** SVGs from the brand's site or press kit, or simple-icons: `curl -sL https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/<name>.svg -o assets/<name>.svg` (single-colour; add `fill="#HEX"` to colour it).
- If you can't get a real asset, use a built panel (title/stat/list) with the real words, or show the face. Never invent.
