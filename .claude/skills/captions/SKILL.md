---
name: captions
description: Adds word-by-word captions to a talking-head video, spelled right, in the creator's caption style, with no other graphics. Clips raw footage first if it needs it. Triggers on "/captions", "caption this", "add captions", "subtitle this video".
---

# /captions

1. `./edit doctor`. If `my-style/style.json` doesn't exist, ask two quick questions instead of a full onboarding: caption look (clean pill, bold outline TikTok style, plain, highlighted active word) and colour/font if they have one. Run `./edit new-style` and set just `captions`, `fonts.caption`, `colors.captionText` / `captionBg` / `accent` and `vocabulary` (names and brands they say). They can run /build-style later for the full look.
2. Ask for the video (and script, optional). `./edit new <slug> "<video>" [script.txt]`.
3. Already edited → `./edit precut <slug>`. Raw (retakes, long pauses) → ask if they want it clipped first; if yes, follow `.claude/skills/edit-video/references/clipping.md`.
4. `./edit captions <slug>`. Read every word against the script / what they meant; fix mishearings in `projects/<slug>/caption_fixes.json` and run it again. Spelling has to be perfect.
5. `./edit face <slug>`, then write `projects/<slug>/edit.json` with `faceCenter` and one `face` beat per sentence (no panels). Face beats alternate wide and punched-in automatically, which keeps a captions-only video moving.
6. `./edit render <slug>` then `./edit qa <slug>` (check every caption is inside the safe zone and spelled right). Send the file.
7. Log any note in `my-style/feedback.md`; lasting caption preferences go in `style.json`.
