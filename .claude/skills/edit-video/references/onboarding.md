# Onboarding: building the creator's style from the ground up

Runs once, the first time someone uses the editor (when `my-style/style.md` doesn't exist), or any time they say "redo my style." The goal is a style that is theirs: built from their answers and the videos they love, not a preset. If their style ends up looking nothing like any default here, that's a win.

Be warm and quick. Ask one question at a time and wait for the answer. It should feel like a conversation with an editor, not a form.

## 1. The interview

Ask these one at a time (skip any they've already answered):

1. **What are your videos about, and who are they for?** (topic + audience in a sentence or two)
2. **What do you film?** Talking head, screen recordings, walking-and-talking, B-roll heavy? Do you film raw (lots of retakes) or cut it yourself first?
3. **How should your videos feel?** Ask for 3 words (calm, punchy, nerdy, luxurious, chaotic, cozy...).
4. **Show me 3 to 5 videos you'd love yours to look like.** Links or files. Their own best videos count too. This is the most important question: tell them plainly that the editor is only as good as what it learns from, so pick videos they genuinely want to look like.
5. **Any brand colours, fonts or logo?** (Optional. If they have a brand kit, use it.)
6. **How do your videos end?** Follow, comment a keyword, link in bio, nothing?
7. **Captions: on or off?** Any style they love or hate?
8. **Music under your voice?** If yes, ask for the file (they must have the rights to it) and put it in `my-style/music/`.
9. **Names and brands you say a lot** (your name, product names, tools). These go in the vocabulary so captions spell them right.

## 2. Study the references

For each reference: `./edit study <link or file> [short-name]`.
Public Instagram, TikTok and YouTube links download fine (the tool updates yt-dlp and retries if a site changed). Private ones fail; then ask the creator to save the video or screen record it and pass the file.

Then **look at** the outputs (they're images, view them):
- `hook.jpg`: the first 3 seconds, 4 frames a second. How does it open?
- `sheet-N.jpg`: the whole video at 1 frame a second.
- `breakdown.json`: cuts, average/median shot length, cuts per second, speaking pace, the hook words.

For each reference, write down what you actually see (not what you assume):
- **Layouts:** split? full-screen graphics? face only? cards over the face? roughly what share of the video each
- **Background:** colour, texture, pattern, blurred footage?
- **Captions:** font feel (rounded, condensed, serif, mono), case, colour, box/pill/outline/none, position, words at a time, active-word highlight?
- **Graphics:** what kinds (screenshots, big numbers, lists, logos, memes, B-roll), how they enter, marks (circles, arrows, highlights), corner radius, shadows, borders
- **Colour:** background, text, the ONE accent
- **Pace:** median shot length, how often the layout changes, how long the face stays on screen between graphics
- **Hook:** what the first frame shows
- **Ending:** how the CTA looks

Then find what the references have **in common**. That's the creator's style. Where they disagree, ask the creator which way they lean ("two of these use big centred captions, one uses small ones at the bottom. Which do you like?").

## 3. Write the style

`./edit new-style` copies the templates into `my-style/`. Fill in:

### my-style/style.md (the human-readable style guide)
Every section of the template, in plain words, with the specific observations that justify each choice ("captions: white, uppercase, black outline, 2 words, active word yellow, because 3 of 4 references do this"). Include their CTA, their pace targets (median beat length from the references), what they want and what they never want.

### my-style/style.json (what the renderer reads)
Translate the guide into the fields:

| Field | Options / how to choose |
|---|---|
| `colors.background`, `background2` | canvas colour and a second colour for gradient/pattern |
| `colors.surface` | card colour |
| `colors.ink`, `muted` | text colours on the canvas and cards |
| `colors.accent`, `accent2` | THE highlight colour (marks, active word, numbers) and a rarely used second |
| `colors.captionText`, `captionBg` | caption text and pill/box colour (rgba ok) |
| `fonts.heading` / `body` / `caption` | any Google Fonts family name ("Inter", "Montserrat", "Space Grotesk", "DM Serif Display", "JetBrains Mono"...). Match the feel you saw. |
| `fonts.headingWeight` / `bodyWeight` / `captionWeight` | 400 to 900 |
| `background` | `solid` `gradient` `dots` `grid` `blur` (blurred copy of their own footage behind graphics, good for dark/cinematic styles) |
| `captions.style` | `pill` `plain` (text + shadow) `outline` (thick stroke, TikTok classic, active word in accent) `box` (accent box) `highlight` (active word in accent) `none` |
| `captions.uppercase`, `size` (48-80), `maxWords` (1-4), `maxChars` | from what you saw |
| `cards.radius` (0-40), `shadow` (`none` `soft` `hard`), `border` (true/false) | |
| `motion.energy` | `calm` (fades, gentle) `normal` `punchy` (fast springs, big moves); `drift` true keeps graphics slowly pushing in |
| `marks.style` | `hand` (hand-drawn) or `clean` (geometric); `marks.color` empty = accent |
| `split` | share of the screen the graphic gets in split layout, 0.4 to 0.6 |
| `punchIn` | face zoom for automatic reframes, 1.0 (off) to 1.2 |
| `language` | Whisper language code, default "en" |
| `vocabulary` | names/brands for correct caption spelling |
| `clip.lead_in` / `end_early` / `max_pause` | how tight the raw cut is (defaults 0.03 / 0.08 / 0.12 s) |
| `music` | `{"file": "my-style/music/song.mp3", "level": -30, "start": 0}` or remove it |

### my-style/feedback.md
Starts empty. Every note the creator gives on a storyboard or a video goes here, dated, and any lasting preference gets promoted into style.md / style.json (see the SKILL's "Remember everything" step).

## 4. Show it before the first real edit

Make a quick sample so they can react to the look before a real video: run their first video to the storyboard stage, or if they want to see the look first, make a short project from any clip they have. Ask what feels off and adjust the style files. Tell them it gets better with every video because every note is saved.
