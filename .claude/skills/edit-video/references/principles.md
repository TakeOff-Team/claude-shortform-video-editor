# Short-form editing principles

These hold for every creator and every style. The creator's `my-style/` decides how things look; this file decides how an edit *works*. If a style choice ever fights one of these, raise it with the creator instead of quietly breaking it.

## The one rule: show what's being said, the moment it's said

Every visual exists to help the viewer understand faster. Say "your inbox" and an inbox appears. Say "3 tools" and three logos pop in. Say "$2,000" and the number is on screen, on that word.

- **Start each beat on the word that names the thing.** Not half a second before, not after the sentence. Use `words.json` timings.
- **Show the literal thing.** "Bookings" = a calendar or sheet filling in, not a generic success icon. "Claude wrote the email" = the email, not a robot.
- **Never decorate.** A visual that doesn't match the words (random stock footage, a spinning emoji, an unrelated AI clip) makes people scroll. If nothing literal fits, show the face. A face beat is never wrong; a wrong graphic always is.

## The hook (first 1.5 seconds)

- The first frame is a picture of the first sentence. If they say "This app replaced my assistant," the first frame shows the app, ideally with the key word marked.
- No logo intro, no title card that just repeats the words, no slow zoom on the face.
- If the video promises a list ("3 tools"), tease it without giving it away (show the count, blur or hide the items).

## Pace

- **One new visual per half-sentence** as a default for explainers: split at commas, "and", "or". A change every ~1.2 to 2.5 seconds; median beat around 1.5s. Talking-head storytelling can go slower; follow the creator's measured references in `my-style/style.md`.
- **Something moves inside long beats.** If a beat runs past ~2.5s, something should land in it: a list row, a logo, a mark drawing on, a counter, typing.
- **Face breathers.** Between graphic runs, give the face 0.8s+ on screen. Viewers follow people, not slides.
- **Never repeat the same panel type back to back** unless it's a deliberate sequence (list rows across beats).
- **Hard cuts on the word.** No crossfades between beats.

## Real beats fake

Order of preference for any visual:
1. The creator's own screen recordings and B-roll
2. Real screenshots of the real thing (the product page, the post, the result, the number)
3. A clean built graphic (title, stat, list, compare, chat, typing) using real words and numbers
4. An emoji or icon, only when it IS the noun ("coffee" → ☕)

Never invent numbers, names, reviews or results. If a graphic needs a placeholder (a fake customer name in a demo), say so to the creator before rendering.

## Restraint is the style

- One accent colour for highlights and marks. One caption style. One background. One or two fonts.
- One mark per beat (circle OR underline OR highlight), two at most.
- Big, few words on screen. A graphic should read in under a second. If it needs a paragraph, it's two beats.
- Full-screen graphics for the big moments (about a third of beats in an explainer), split for most explaining, face for breathers.

## Layout guide

| Layout | Use it for |
|---|---|
| `face` | breathers, emotional or personal lines, the CTA |
| `split` | most explaining: the graphic carries the point while the face keeps the connection |
| `full` | big ideas, numbers, titles, screenshots that need the room, B-roll |
| `overlay` | a quick small card (logo, number) while staying on the face |

## Captions

- 1 to 3 words at a time, phrased at natural breaks; never end a caption on "the", "to", "your".
- Spelling of names and brands must be right. A wrong word on screen is worse than no caption.
- Keep captions inside the safe zone and off the face's mouth.

## Safe zone

The apps cover the edges: top ~210px (header), bottom ~440px (caption, username, buttons), right ~80px (like/comment buttons). Everything that matters stays inside x 80 to 1000, y 210 to 1480 on the 1080x1920 frame. The engine keeps panels there automatically; screenshots you crop should keep the key part centred.

## Audio

- The voice is mastered to -14 LUFS with a peak limiter (automatic in `./edit render`).
- Music, if the creator uses it, sits about 16 dB under the voice and ducks when they talk.
- No sound effects unless the creator asks for them; bad ones cheapen an edit fast.

## The ending

- End on the CTA line, on the face, with the CTA text on screen if the creator uses one (follow, comment a keyword, link in bio). The style file says what their CTA is.
- Keep the final word's full tail. Don't clip the last syllable.
