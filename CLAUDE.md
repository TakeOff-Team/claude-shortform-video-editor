# Claude Shortform Video Editor

This folder is a video editor that you (Claude) run. When the person wants a video edited, clipped, captioned or styled, use the `/edit-video` skill (`.claude/skills/edit-video/SKILL.md`) and follow it step by step.

- Get the raw video: `/get-video` pulls the newest recording straight off a plugged-in iPhone into `inbox/`.
- Shortcuts that each run one part of it: `/build-style` (onboarding), `/inspiration` (learn from an edited video), `/clip` (raw cut only), `/captions` (captions only), `/storyboard` (plan only, no render; give it an edited reference video and it plans in that style).
- First run (no `my-style/style.md`): onboard them before editing anything.
- Always read `my-style/style.md`, `style.json` and `feedback.md` before working on a video. Their past notes are rules.
- The toolbox is `./edit` (run `./edit help`). Long steps (`chunks`, `render`) run in the background.
- If setup is incomplete, run `./setup.sh` and fix what it reports. Homebrew needs their password, so they run that one command themselves.
- Talk to them like a friendly editor, in plain words. They may not be technical.
