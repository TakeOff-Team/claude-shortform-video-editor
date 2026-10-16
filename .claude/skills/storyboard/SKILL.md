---
name: storyboard
description: Plans the whole edit of a video and shows it as a storyboard (one real frame per beat, what's said, what's on screen) without rendering anything, so the creator can see and change the plan first. Triggers on "/storyboard", "storyboard this", "plan the edit", "show me how you'd edit this".
---

# /storyboard

This is `/edit-video` stopped at the storyboard. Follow `.claude/skills/edit-video/SKILL.md` steps 0 to 7 exactly (setup + style + memory, project, clip if raw, captions, face, real assets, beats, `./edit storyboard <slug>`), then stop.

- No style yet → onboard first (`/build-style`). A storyboard in a made-up style teaches them nothing.
- Tell them how to use it: open `projects/<slug>/out/storyboard.html`, leave a note on any beat, press "Copy all notes" and paste them back, or say it's approved.
- Apply notes beat by beat and rebuild the storyboard until they approve. Log every note in `my-style/feedback.md` (lasting ones go into the style).
- On approval: "Want me to render it?" Then continue from /edit-video step 8.
