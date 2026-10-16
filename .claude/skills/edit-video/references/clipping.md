# Clipping raw footage

Raw footage = the creator hit record and talked, with restarts, stutters, pauses and several takes of the same line. The job: a tight cut that says everything once, in order, with zero dead space.

Skip this whole file if the video is already edited (`./edit precut <slug>`). Never re-cut footage the creator already cut unless they ask.

## The rules

1. **Follow the script, in order**, if there is one (`projects/<slug>/script.txt`). Creators paraphrase; a take in their own words still counts. Keep what they actually said, never reorder lines.
   No script? Work out the intended lines from the takes themselves: repeated attempts at the same sentence are takes of one line. The order of first attempts is the order of the video.
2. **The LAST good take wins.** If a line was said more than once, use the last clean one, even if an earlier one was fine. People get better as they go. (The creator's style file can override this.)
3. **Nothing said twice.** No line, phrase or word appears twice in the cut, including inside one take ("which a lot of... which a lot of the time" = start at the last "which").
4. **No dead space.** No pause over 0.12s anywhere, between takes or inside one. Hesitations inside a take get cut out.
5. **Ends move in.** Every take is cut ~2.5 frames before the voice fully fades, to keep the pace up (`./edit cut` does this). The video's very last word keeps its full tail.
6. **Catch every stumble.** Stutters, false starts, half-words, uh/um, laughs, breaths, clicks and lip smacks never make the cut.

## Workflow

1. `./edit chunks <slug>` (runs a few minutes; start it in the background)
   Every piece of speech between real pauses, transcribed on its own: `[start - end] text`.
   **Pick from chunks, never from a whole-file transcript.** Whisper on a long file skips restarts and merges repeated takes, which hides exactly the takes you're choosing between.
2. **Write `projects/<slug>/picks.json`:**
   ```json
   {"picks": [[12.40, 15.86, "L1 hook"], [31.02, 33.10, "L2 first half"], [33.45, 36.90, "L2 second half"]]}
   ```
   Times come straight from chunks.txt (chunk edges sit in silence, so they're clean cut points), in play order.
   - For each line, find every chunk that's a take of it and pick the LAST complete, clean one. One chunk can cover two lines said in one breath.
   - Lists said one item at a time: one pick per item, the last take of each.
   - **False start inside a chunk:** `./edit words <slug> <start> <end>` gives exact word timings and the short pauses in that stretch; start the pick at the last clean repeat, on a pause.
   - **Hesitation inside a take (> 0.12s):** split it into two picks around the pause. Before keeping both halves, check each half with `./edit words`: a pause often hides a restart, or a laugh or breath that isn't a word.
   - Start every pick on the first real word. If there's a short sound right before it (laugh, breath, click), start after it.
3. `./edit check <slug>` transcribes every pick on its own and flags repeats, restarts hidden across a breath, filler, fragments and non-speech sounds. Fix every FLAG in picks.json and run it again until it says `clean`.
4. `./edit cut <slug>` assembles `cut.mp4` + `cut_map.json`.
5. `./edit verify <slug>`: zero dead space, a read-through of every take on the cut (in order? anything said twice? did a last word lose its ending, like a plural "s"?). If a word got clipped, give that pick a later end and cut again.
6. **Show the creator the cut before editing it.** Send `projects/<slug>/cut.mp4`. Tell them the length (raw → cut) and anywhere they said something different from the script (kept as said). Apply their notes in picks.json, then repeat steps 3 to 5.

Their clipping preferences (how tight, keep breaths, keep a laugh) live in `my-style/style.md` and `style.json` → `clip`. Read them first.
