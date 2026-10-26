---
name: get-video
description: Pulls the raw video you just recorded straight off your plugged-in iPhone (no AirDrop, no Photos app), puts it in inbox/, and starts the edit. Default is the newest 1 recording, or "/get-video 3" for the last 3. Triggers on "/get-video", "get the video off my phone", "pull my latest video", "I just recorded", "grab the footage from my phone".
---

# /get-video

Input = an iPhone plugged into this Mac with a cable. Output = the raw video in `inbox/`, ready for `/clip` or `/edit-video`.

## 1. Pull it
Run `./edit phone [N]` (N = how many recordings, default 1). It prints one JSON line per video: `name, created, duration, mb, path`.

- **Camera recordings only.** It takes `IMG_####` videos over 8 seconds. Saved or downloaded videos (random names like `LDDP0115.MOV`) and Live Photo clips are skipped. If they want a saved video too, add `--any`.
- "The last 3" or "the ones from today": run `./edit phone list 10` first, pick by `created`, then `./edit phone 1 --names IMG_0101.MOV,IMG_0102.MOV`.
- The first run compiles a small helper. If it says `swiftc is missing`, they run `xcode-select --install` themselves (it opens an Apple installer), then try again.

## 2. When it gets stuck
- `NO_IPHONE` (exit 2): "Plug your iPhone in with a cable, unlock it, and tap **Trust** if it asks."
- `LOCKED`: "Unlock your phone and keep it on the home screen." The tool keeps retrying for 2 minutes on its own, so don't run it again while it waits.
- Video missing from the list: with iCloud "Optimize iPhone Storage" on, older videos may only live in iCloud. Open the video on the phone once (so it downloads), then run it again.
- Never delete anything from the phone.

## 3. Tell them they can unplug
The moment every file is on the Mac (the command exited 0 and each file exists), say first: "📱 You can unplug your phone now: all N videos are on your Mac." Nothing after this needs the phone. If it failed partway, say "Keep your phone plugged in" and why.

## 4. Keep going
Tell them what landed (file, length, size), then offer the next step with the file already filled in:
- "Want me to `/clip` it (cut every pause and retake) or run the full `/edit-video`?"
- If they have a script for it, ask them to paste it so the clip follows it.
- Several videos: edit them one at a time, newest first, and tell them the queue.
