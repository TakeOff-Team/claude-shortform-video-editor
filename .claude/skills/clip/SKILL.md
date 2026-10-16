---
name: clip
description: Clips raw talking-head footage only (no graphics): keeps the last good take of every line, cuts stutters, restarts, filler and every pause over a tenth of a second, and hands back a tight cut. Triggers on "/clip", "clip this", "remove the dead space", "cut the pauses", "cut my retakes".
---

# /clip

1. `./edit doctor` (if anything fails, `./setup.sh`). Read `my-style/style.json` → `clip` and `my-style/feedback.md` if they exist; their clipping notes are rules.
2. Ask for the video (and the script, if they have one). `./edit new <slug> "<video>" [script.txt]`.
3. Follow `.claude/skills/edit-video/references/clipping.md` end to end: chunks → picks.json → `./edit check` until clean → `./edit cut` → `./edit verify`.
4. Master the audio so it's ready to post: `tools/master_audio.sh projects/<slug>/cut.mp4 projects/<slug>/out/<slug>-clipped.mp4`.
5. Send `projects/<slug>/out/<slug>-clipped.mp4` with the length (raw → cut) and anywhere they said something different from the script.
6. Offer the next step: "/captions to add captions, or /edit-video for the full edit with graphics." Log any note they give in `my-style/feedback.md` (SKILL step 9 of /edit-video).
