---
name: storyboard
description: Plans the whole edit of a video and shows it as a storyboard (one real frame per beat, what's said, what's on screen) without rendering anything, so the creator can see and change the plan first. Give it an already-edited reference video too and it plans the edit in that video's style. Triggers on "/storyboard", "storyboard this", "plan the edit", "show me how you'd edit this".
---

# /storyboard

This is `/edit-video` stopped at the storyboard. Follow `.claude/skills/edit-video/SKILL.md` steps 0 to 7 exactly (setup + style + memory, project, clip if raw, captions, face, real assets, beats, `./edit storyboard <slug>`), then stop.

- No style yet → onboard first (`/build-style`). A storyboard in a made-up style teaches them nothing.
- **They gave you an already-edited video to copy** ("/storyboard like this one", a link or a file next to their own video): break it down first with `./edit study <url or file>` and read the breakdown (layouts, captions, colours, pace, how it opens, how often the screen changes). Plan this storyboard in *that* video's style for this one edit, without changing `my-style/`. Say at the top which choices came from the reference. If they love it, offer `/inspiration` to keep those choices for good. Only their own video gets edited: the reference is for style, never footage.
- Tell them how to use it: open `projects/<slug>/out/storyboard.html`, leave a note on any beat, press "Copy all notes" and paste them back, or say it's approved.
- Apply notes beat by beat and rebuild the storyboard until they approve. Log every note in `my-style/feedback.md` (lasting ones go into the style).
- On approval: "Want me to render it?" Then continue from /edit-video step 8.
