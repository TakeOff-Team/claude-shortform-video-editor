# Claude Shortform Video Editor

**Drop in your raw talking-head footage. Claude clips it, captions it, adds graphics in *your* style, and renders a finished vertical video for Reels, TikTok and Shorts.**

It runs inside [Claude Code](https://claude.com/claude-code) on your Mac. No editing software, no timeline, no coding.

---

## What it does

- **Clips your raw footage.** Restarts, stutters, saying the same line four times: it keeps your last good take of every line and cuts the rest.
- **Removes dead space.** No pauses over a tenth of a second, no "ummm", no slow start.
- **Captions every word**, spelled right (it learns your names and brands).
- **Adds graphics that match what you're saying, the moment you say it.** Titles, big numbers, lists, real screenshots, logos, chat bubbles, before/after, typing prompts, hand-drawn circles and underlines.
- **Shows you a storyboard first.** One real frame per beat with what's said and what's on screen. Leave notes, and it only renders once you approve.
- **Masters your audio** to the loudness the apps expect (-14 LUFS), with an optional music bed that ducks under your voice.
- **Checks its own work** before you see it: safe zones, loudness, frozen frames.
- **Builds your style from scratch and remembers every note you give it.**

## The one rule it edits by

> **Every visual shows what's being said, the moment it's said.**

Say "your inbox" and an inbox shows up. Say "3 tools" and three logos pop in. Say "$2,000" and the number is on the screen. Graphics are there to help the viewer *get it* faster. When the visuals and the words line up, people keep watching. When they don't, people scroll. That's true no matter what your style looks like, so it's the one thing this editor never compromises on.

Everything else (colours, fonts, captions, pace, how graphics move) comes from **you**.

---

## Install

**You need:** a Mac (Apple Silicon or Intel), [Claude Code](https://claude.com/claude-code), and about 5 GB of free space.

Open Claude Code in the folder where you keep projects and paste this:

```
Clone https://github.com/TakeOff-Team/claude-shortform-video-editor and run its setup.sh. If anything fails, fix it and run it again until it says "All set."
```

Claude installs everything for you: ffmpeg, Node, Python, Whisper (speech to text, runs on your Mac) and Remotion (the renderer). The one thing it can't do for you is install Homebrew if you don't have it, because that needs your Mac password. If setup asks, paste the command it gives you into Terminal, then tell Claude to keep going.

<details>
<summary>Prefer to do it yourself?</summary>

```bash
git clone https://github.com/TakeOff-Team/claude-shortform-video-editor
cd claude-shortform-video-editor
./setup.sh
```
</details>

## Use it

1. Open Claude Code **inside the `claude-shortform-video-editor` folder**.
2. Type `/edit-video` (or just "edit this video" and drag the file in).
3. **The first time, it onboards you.** It asks what your content is about, who it's for and how you want it to feel, then asks for **3 to 5 videos you'd love yours to look like**. It studies them frame by frame (layouts, captions, colours, pace, how they open) and writes your style guide in `my-style/`.
4. From then on, every video: give it the file (and your script if you have one) → approve the cut → approve the storyboard → get the finished video.

## Getting great results (read this)

This isn't a "try it once and five minutes later you have an amazing video" thing. **Plan on some back and forth for the first few videos.** Tell it what you like and what you don't, beat by beat, on the storyboard.

Here's the good part: **it remembers everything you tell it.** Every note goes into `my-style/feedback.md`, and anything that's a lasting preference gets written into your style guide. After a few hours of working with it, you'll get really good edits without much back and forth at all.

Two things decide how good it gets:
- **Your references.** It's only as good as what it learns from. Feed it videos you genuinely want to look like (your own best videos count).
- **Your notes.** Be specific: "captions are too small", "use a real screenshot here", "less zooming on my face". Every one makes the next video better.

---

## How it works

```
your video ─▶ clip (raw only) ─▶ captions ─▶ beat plan ─▶ STORYBOARD ─▶ render ─▶ master audio ─▶ QA ─▶ you
                 ▲                              ▲              │
                 │                              │         your notes
            last good take,              your style  ◀────────┘  (saved forever in my-style/)
            zero dead space              + the one rule
```

- **Clipping** splits the raw audio at every pause and transcribes each piece on its own, so it can see every retake. It picks the last clean take of each line, scans every take for stutters, restarts, filler and stray sounds, then assembles a tight cut and verifies there's no dead space left.
- **The beat plan** (`edit.json`) is a list of moments: when it starts (on the word), the layout (face / split / full-screen / overlay) and the graphic.
- **Rendering** uses [Remotion](https://www.remotion.dev): React components styled entirely by your `my-style/style.json`.

## Your files

```
my-style/
  style.md        your style guide (Claude writes it, you can edit it)
  style.json      the same style in numbers: colours, fonts, captions, motion
  feedback.md     every note you've given, dated
  references/     the videos you gave it, broken down frame by frame
  music/          your music bed, if you use one
projects/<name>/
  source.mp4      your video, converted to 1080x1920
  cut.mp4         the clipped cut
  words.json      every word with its timing
  edit.json       the beat plan
  assets/         screenshots, logos and B-roll for this video
  out/            storyboard.html and every render (v1, v2, ...)
```

<details>
<summary>All the commands (Claude runs these, you never have to)</summary>

```
./edit doctor                         check the setup
./edit study <url or file> [name]     break down a reference video
./edit new <slug> <video> [script]    start a project
./edit chunks <slug>                  raw footage -> every piece of speech, transcribed on its own
./edit words <slug> <start> <end>     exact word timings for one stretch
./edit check <slug>                   stutter / restart / filler scan of the picked takes
./edit cut <slug>                     assemble the cut
./edit verify <slug>                  dead-space scan + read-through of the cut
./edit precut <slug>                  use an already-edited video as-is
./edit captions <slug>                word-level captions
./edit face <slug>                    find where your face sits in frame
./edit storyboard <slug>              one card per beat -> storyboard.html
./edit render <slug> [version]        render + master audio (+ music)
./edit qa <slug> [version]            contact sheet + loudness / black / frozen checks
./edit new-style                      start my-style/ from the templates
```
</details>

## Troubleshooting

- **Something's missing:** `./edit doctor`, or tell Claude "run the doctor and fix what it finds."
- **A reference link won't download:** Instagram and TikTok often block downloads. Save the video (or screen record it) and give Claude the file.
- **Captions misspell a name:** tell Claude. It adds the name to your vocabulary so it's right from then on.
- **Transcription is slow on an older Mac:** ask Claude to use `WHISPER_MODEL=small`.
- **Rendering is slow:** normal. Expect 1 to 3 minutes per minute of video.

## Licenses and credits

- This repo is MIT licensed (see [LICENSE](LICENSE)).
- **Remotion** is free for individuals and companies with up to 3 employees. Bigger companies need a [Remotion company license](https://www.remotion.pro/license).
- Whisper (OpenAI) and mlx-whisper are MIT licensed.
- The audio mastering method and caption phrasing rules are adapted from Jake Schincariol's master-skills (MIT). See [NOTICE.md](NOTICE.md).

Made by [Zach Geleott](https://zachdoesai.com). If it helps you, tag me in what you make.
