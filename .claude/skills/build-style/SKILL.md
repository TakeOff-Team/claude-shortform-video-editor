---
name: build-style
description: Builds (or rebuilds) the creator's video editing style from a short interview and 3 to 5 videos they love, so every edit after looks like theirs. Run once before the first edit, or any time they want a new look. Triggers on "/build-style", "build my style", "set up my style", "redo my style", "change my style".
---

# /build-style

Run the onboarding in `.claude/skills/edit-video/references/onboarding.md` from the top: the interview, then `./edit study` on every reference, then write `my-style/style.md`, `style.json` and `feedback.md`, then show a sample before the first real edit.

- If `my-style/style.md` already exists, ask first: start over, or adjust the current style? Adjusting keeps `feedback.md` (their past notes stay rules).
- Learn the *thinking*, not just the look. For each reference, write down why each choice works (why that beat is full screen, why the face comes back there, what the first frame is doing), not only what it looks like. The style guide should let you make a good call on a line none of the references ever had, so their videos feel like the same creator without all looking identical.
- When it's done, tell them: "Your style is saved. Give me a video and type /edit-video."
