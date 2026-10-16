---
name: inspiration
description: Studies one or more already-edited videos (a link or a file) and teaches the editor to edit like that, folding what it learns into the creator's style. Triggers on "/inspiration", "edit like this video", "learn from this video", "add this to my style", "use this as a reference".
---

# /inspiration

1. For each video: `./edit study <link or file> [short-name]`. Instagram, TikTok and YouTube links work. If one won't download (private or blocked), ask them to save the video or screen record it and pass the file.
2. **Look at** the outputs (`hook.jpg`, every `sheet-N.jpg`, `breakdown.json`) and break it down exactly like step 2 of `.claude/skills/edit-video/references/onboarding.md`: layouts, background, captions, graphics, colour, pace, hook, ending. Write down *why* each choice works, not only what it looks like.
3. **No style yet** (`my-style/style.md` missing): this is their first reference. Run `/build-style` (the onboarding) and use this video as one of the references.
4. **Style exists:** tell them in plain words what this video does that their style doesn't (and anything it does that clashes with it), and ask which parts they want. Write what they choose into `my-style/style.md` and `style.json`, and add a dated line to `my-style/feedback.md` ("added inspiration: <name>, took X and Y").
5. Finish with: "Saved. Your next /edit-video will use it."
