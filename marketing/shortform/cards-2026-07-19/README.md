# Text cards — 19 July batch

Twelve 1080×1920 PNGs, ready to drop into CapCut. `en_*` is script 01, `ko_*` is
script 02. Neither needs filming — import six images in order, set durations, add
music, export.

## Timing

Both run about 15 seconds. Suggested durations:

| Card | Seconds | Why |
|---|---|---|
| 1 | 3.0 | The hook. Give it a beat longer — three seconds decide whether anyone watches the rest. |
| 2 | 2.5 | |
| 3 | 2.5 | |
| 4 | 2.5 | |
| 5 | 2.5 | |
| 6 | 2.0 | CTA. Short; the point has landed by now. |

Cut on the beat if the track has an obvious one. A hard cut suits these better
than a crossfade — the rhythm is part of the joke.

## Sound

Pick something quiet and unhurried. These are read, not watched, and a driving
track fights the text. No voiceover — they're written for sound-off, which is how
most people will see them.

## The progress ticks

The row of dashes at the bottom shows how far through you are. It exists to hold
someone past card 2, which is where people leave. Don't crop it out.

## Regenerating

Edit `_source.html` and re-render:

```bash
# split each .card div into its own file, then per card:
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --window-size=1080,1920 \
  --screenshot=en_1.png "file://$PWD/en_1.html"
```

Korean uses Apple SD Gothic Neo and English uses Iowan Old Style — both are
macOS system fonts, so this renders correctly on this machine and would need
font substitution anywhere else.

## Source of the copy

Card `en_1` quotes a real Gothamist headline (NYC parent on school WhatsApp
chats, May 2025) — verified against the article. Keep the attribution visible;
it is what makes the line land rather than read as invented ad copy. The Korean
set draws its vocabulary from a quoted 맘카페 post and is not a translation of
the English.
