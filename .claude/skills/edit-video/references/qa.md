# QA before the creator sees anything

Run after every render: `./edit qa <slug>`, then **look at** `projects/<slug>/out/qa-vN.jpg` (one still per beat, numbered, dashed box = safe zone).

## Check every beat

- [ ] The graphic matches the words said in that beat (read the storyboard "said" line next to it)
- [ ] Nothing important outside the dashed safe zone; nothing cut off at the edges
- [ ] No graphic covering the face's eyes or mouth in split/overlay
- [ ] No caption covering a graphic's key text (hide captions on that beat if needed)
- [ ] Marks land on the right word, not the one before or after
- [ ] Text is readable at phone size: big, short, high contrast
- [ ] Logos and screenshots are real, sharp and the right brand
- [ ] Face framed high enough in split (top of head not cut, eyes in the upper part of the box)
- [ ] Names and brands spelled right in captions and graphics

## Check the numbers the tool prints

- Loudness around -14 LUFS, true peak under -1 dBFS
- No black frames
- No frozen stretches (2.5s+ with nothing moving): add motion or split the beat

## Fix loop

Fix in edit.json (or style.json for anything that's wrong everywhere), re-render (the version number goes up automatically, so caches never show an old file), QA again. Three loops max, then hand it over with the open issues listed honestly.

## Hand-off message

Send the final file (`projects/<slug>/out/<slug>-vN.mp4`) and say, briefly:
- length and version
- anything that's a placeholder or a guess (a demo name, a number you couldn't confirm, a missing asset)
- anything you noticed but couldn't fix
Then ask for notes, and log them (SKILL step 9).
