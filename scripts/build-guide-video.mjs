// Builds a vertical (1080x1920) short from a business photo + caption per
// card, using the same Chrome-headless screenshot technique as the existing
// SaveBoard text-card content (marketing/shortform/cards-*/), then assembles
// with ffmpeg. No music track — sidesteps licensing; most shorts are watched
// muted anyway.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/build-guide-video.mjs <input.json>');
  process.exit(1);
}
const { slug, cards } = JSON.parse(await readFile(inputPath, 'utf8'));
if (!slug || !Array.isArray(cards) || !cards.length) {
  console.error('Input JSON needs { slug: string, cards: Array<{photoUrl,caption,durationSec}> }');
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'marketing', 'guides-social', slug);
await mkdir(outDir, { recursive: true });

// A card with no photoUrl is a text-only card: no <img> at all (an empty src
// renders a broken-image icon), caption centred instead of bottom-anchored.
// Used when a business has no photo we're allowed to publish.
function cardHtml(photoUrl, caption) {
  const textOnly = !photoUrl;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:1080px;height:1920px;background:#0b0b0b;overflow:hidden}
    .photo{width:1080px;height:1920px;object-fit:cover;position:absolute;inset:0;filter:brightness(0.6)}
    .caption{position:absolute;left:60px;right:60px;bottom:160px;color:#fff;
      font-family:-apple-system,sans-serif;font-size:56px;font-weight:700;
      line-height:1.3;text-shadow:0 2px 12px rgba(0,0,0,0.8)}
    .caption.center{top:0;bottom:0;display:flex;align-items:center;text-align:center;
      font-size:64px;line-height:1.45}
  </style></head><body>
    ${textOnly ? '' : `<img class="photo" src="${photoUrl}">`}
    <div class="caption${textOnly ? ' center' : ''}"><span>${caption}</span></div>
  </body></html>`;
}

const cardPaths = [];
for (let i = 0; i < cards.length; i++) {
  const html = cardHtml(cards[i].photoUrl, escapeHtml(cards[i].caption));
  const htmlPath = path.join(outDir, `card_${i}.html`);
  const pngPath = path.join(outDir, `card_${i}.png`);
  await writeFile(htmlPath, html, 'utf8');
  await run(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1080,1920',
    `--screenshot=${pngPath}`,
    `file://${htmlPath}`,
  ]);
  cardPaths.push({ pngPath, durationSec: cards[i].durationSec ?? 2.5 });
}

// ffmpeg concat demuxer file — each image held for its own duration.
// The concat demuxer requires the LAST entry to be repeated without a
// duration line, or ffmpeg drops its final frame's hold time.
const listLines = cardPaths.flatMap(c => [`file '${c.pngPath}'`, `duration ${c.durationSec}`]);
listLines.push(`file '${cardPaths[cardPaths.length - 1].pngPath}'`);
const listPath = path.join(outDir, 'concat.txt');
await writeFile(listPath, listLines.join('\n'), 'utf8');

const videoPath = path.join(outDir, 'video.mp4');
await run('ffmpeg', [
  '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
  '-vsync', 'vfr', '-pix_fmt', 'yuv420p', videoPath,
]);

console.log(videoPath);

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
