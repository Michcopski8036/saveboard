from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

SCRATCH = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SCRATCH, "out")
os.makedirs(OUT, exist_ok=True)

BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
BOLDIT = "/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf"
REG = "/System/Library/Fonts/Supplemental/Arial.ttf"

# --- LandingPage.tsx "Problem" section tokens ---
BG_FROM = (245, 243, 255)   # #F5F3FF  (from-[#F5F3FF], top-left)
BG_TO = (255, 247, 237)     # #FFF7ED  (to-[#FFF7ED], bottom-right)
GRAY_900 = (17, 24, 39)     # text-gray-900
GRAY_500 = (107, 114, 128)  # text-gray-500
EM_STOPS = [(162, 89, 255), (255, 114, 98), (242, 78, 30)]  # #A259FF → #FF7262 → #F24E1E

CANVAS = (1320, 2868)  # 6.9" iPhone

# (screenshot, [(text, is_emphasised), ...] per heading line, subtitle)
SHOTS = [
    ("raw/iphone_1.png",
     [[("Everything you save,", False)], [("in ", False), ("one place", True), (".", False)]],
     "Links, PDFs and videos — saved in one tap."),
    ("raw/iphone_2.png",
     [[("Boards, tags, favourites", False)], [("— all ", False), ("sorted", True), (".", False)]],
     "Organise the way your brain actually works."),
    ("raw/iphone_3.png",
     [[("File any link away", False)], [("in ", False), ("one tap", True), (".", False)]],
     "Move a save between boards without thinking."),
    ("raw/invite.jpg",
     [[("Invite your people", False)], [("to ", False), ("the board", True), (".", False)]],
     "Email an invite — everyone saves to the same board."),
    ("raw/publiclink.jpg",
     [[("Or just send", False)], [("a ", False), ("public link", True), (".", False)]],
     "One link shares the whole board. No sign-up to view."),
    ("raw/recipient2.jpg",
     [[("They just ", False), ("tap the link", True), (".", False)], [("That's it.", False)]],
     "No app, no account — the board simply opens."),
]


def diagonal_gradient(size, c_from, c_to):
    """bg-gradient-to-br: top-left -> bottom-right."""
    w, h = size
    small = Image.new("RGB", (64, 64))
    px = small.load()
    for y in range(64):
        for x in range(64):
            t = (x / 63 + y / 63) / 2
            px[x, y] = tuple(int(c_from[i] + (c_to[i] - c_from[i]) * t) for i in range(3))
    return small.resize(size, Image.BICUBIC)


def h_gradient(size, stops):
    w, h = size
    grad = Image.new("RGB", (w, 1))
    d = ImageDraw.Draw(grad)
    n = len(stops) - 1
    for x in range(w):
        t = x / max(w - 1, 1) * n
        i = min(int(t), n - 1)
        f = t - i
        a, b = stops[i], stops[i + 1]
        d.point((x, 0), fill=tuple(int(a[j] + (b[j] - a[j]) * f) for j in range(3)))
    return grad.resize((w, h), Image.BICUBIC)


def rounded(im, radius):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.size[0], im.size[1]], radius, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def draw_heading_line(canvas, parts, y, size, width):
    """Draw one heading line centred; emphasised runs get italic + brand gradient fill."""
    f_bold = ImageFont.truetype(BOLD, size)
    f_em = ImageFont.truetype(BOLDIT, size)
    d = ImageDraw.Draw(canvas)

    widths = [d.textlength(t, font=(f_em if em else f_bold)) for t, em in parts]
    x = (width - sum(widths)) / 2

    for (text, em), w in zip(parts, widths):
        if not em:
            d.text((x, y), text, font=f_bold, fill=GRAY_900)
        else:
            # render the run as a mask, then pour the brand gradient through it
            box = (int(w) + 12, int(size * 1.6))
            mask = Image.new("L", box, 0)
            ImageDraw.Draw(mask).text((0, 0), text, font=f_em, fill=255)
            grad = h_gradient(box, EM_STOPS)
            canvas.paste(grad, (int(x), int(y)), mask)
        x += w


# Device captures that arrive with the black status-bar / home-indicator bands
# (real-device shots) get them trimmed so the set matches the simulator shots.
TRIM = {
    "raw/invite.jpg": (186, 150),
    "raw/publiclink.jpg": (186, 150),
    "raw/recipient2.jpg": (186, 407),  # KakaoTalk status bar + Safari toolbar
}


def build(shot_path, heading_lines, subtitle):
    W, H = CANVAS
    bg = diagonal_gradient(CANVAS, BG_FROM, BG_TO).convert("RGBA")

    y = 165
    for parts in heading_lines:
        draw_heading_line(bg, parts, y, 94, W)
        y += 118

    d = ImageDraw.Draw(bg)
    f_sub = ImageFont.truetype(REG, 46)
    sw = d.textlength(subtitle, font=f_sub)
    d.text(((W - sw) / 2, y + 26), subtitle, font=f_sub, fill=GRAY_500)

    # device shot — white card treatment like the section's cards (soft shadow, rounded-2xl)
    shot = Image.open(os.path.join(SCRATCH, shot_path)).convert("RGBA")
    if shot_path in TRIM:
        t, b = TRIM[shot_path]
        shot = shot.crop((0, t, shot.width, shot.height - b))
    target_w = int(W * 0.78)
    target_h = int(shot.height * target_w / shot.width)
    shot = rounded(shot.resize((target_w, target_h), Image.LANCZOS), 56)

    x = (W - target_w) // 2
    # Tall phone captures start right under the caption; a short crop (the browser
    # view) gets centred in the space that's left so the frame stays balanced.
    y_shot = 560 + max(0, (H - 160 - 560 - target_h) // 2)

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [x, y_shot + 16, x + target_w, y_shot + target_h + 16], 56, fill=(17, 24, 39, 46)
    )
    bg = Image.alpha_composite(bg, shadow.filter(ImageFilter.GaussianBlur(30)))
    bg.paste(shot, (x, y_shot), shot)

    return bg.convert("RGB")


for i, (path, lines, sub) in enumerate(SHOTS, start=1):
    img = build(path, lines, sub)
    img.save(os.path.join(OUT, f"6.9in_{i}_1320x2868.png"))
    img.resize((1242, 2688), Image.LANCZOS).save(os.path.join(OUT, f"6.5in_{i}_1242x2688.png"))
    print("wrote", i)
