#!/usr/bin/env python3
"""TikTok vertical price image and YouTube Shorts slideshow video, made locally.

Rebuilds Orshot templates 40940 (vertical 1080x1920 wrapper) and 40976
(17.7 s slideshow with the shop song), so no Orshot credits are needed.

  python3 make_social_media.py vertical --card square.jpg --date 12/11/2026 --out tiktok.jpg
  python3 make_social_media.py video    --card square.jpg --date 12/11/2026 --out short.mp4

--card is the square price image from make_price_image.py.
"""
import argparse, os, subprocess, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda n: os.path.join(HERE, 'assets', n)
W, H = 1080, 1920
FPS = 30
DUR = 17.7
SHOP_NAME = 'ຮ້ານຄຳ ລິດປະສົງ · ຕະຫຼາດຫຼັກ 3 ທ່າແຂກ'
CONTACT = 'WhatsApp 020 5895 4624'
HEADLINE = 'ລາຄາຄຳມື້ນີ້'
PH_TOP = 'ຮ້ານຄຳ ລິດປະສົງ ທ່າແຂກ'
GOLD, WHITE = (0xf3, 0xd5, 0x8a), (255, 255, 255)
WEIGHTS = {800: 'ExtraBold', 700: 'Bold', 600: 'SemiBold', 500: 'Medium'}


def is_lao(ch):
    return 0x0E80 <= ord(ch) <= 0x0EFF or ch == ' '


def text_layer(text, box, size, weight, color, min_size=20):
    """Centred text inside box (x, y, w, h) on a transparent full canvas; shrinks to fit."""
    x0, y0, bw, bh = box
    wname = WEIGHTS[weight]
    while True:
        lao = ImageFont.truetype(A(f'NotoSansLao-{wname}.ttf'), size)
        lat = ImageFont.truetype(A(f'NotoSans-{wname}.ttf'), size)
        parts = []
        for ch in text:
            k = 'lao' if is_lao(ch) else 'lat'
            if parts and parts[-1][0] == k: parts[-1][1] += ch
            else: parts.append([k, ch])
        fonts = {'lao': lao, 'lat': lat}
        widths = [fonts[k].getlength(t) for k, t in parts]
        if sum(widths) <= bw or size <= min_size: break
        size -= 2
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    asc, desc = lao.getmetrics()
    baseline = y0 + bh / 2 + (asc - desc) / 2
    x = x0 + (bw - sum(widths)) / 2
    for (k, t), w in zip(parts, widths):
        d.text((x, baseline), t, font=fonts[k], fill=color + (255,), anchor='ls')
        x += w
    return layer


def background():
    stops = [(0, (0x6b, 0x14, 0x22)), (0.55, (0x3d, 0x0a, 0x12)), (1, (0x22, 0x05, 0x0a))]
    col = Image.new('RGB', (1, H))
    for y in range(H):
        t = y / (H - 1)
        for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
            if p0 <= t <= p1:
                k = (t - p0) / (p1 - p0)
                col.putpixel((0, y), tuple(round(a + (b - a) * k) for a, b in zip(c0, c1)))
                break
    return col.resize((W, H)).convert('RGBA')


def rule_layer():
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    strip = Image.new('RGBA', (300, 6))
    for x in range(300):
        a = round(255 * (1 - abs(x - 149.5) / 149.5))
        for y in range(6): strip.putpixel((x, y), (0xe8, 0xc1, 0x6a, a))
    layer.paste(strip, (390, 190))
    return layer


def card_layer(card_path, shadow):
    """Square price card in a 1060x1060 box at (10,430), 4px gold border, 20px radius."""
    size, r, bw = 1060, 20, 4
    card = Image.open(card_path).convert('RGB').resize((size, size), Image.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), r, fill=255)
    tile = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    tile.paste(card, (0, 0), mask)
    ImageDraw.Draw(tile).rounded_rectangle((0, 0, size - 1, size - 1), r, outline=(0xe8, 0xc1, 0x6a, 255), width=bw)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if shadow:
        sh = Image.new('L', (W, H), 0)
        ImageDraw.Draw(sh).rounded_rectangle((10, 430 + 18, 10 + size, 430 + 18 + size), r, fill=int(0.45 * 255))
        sh = sh.filter(ImageFilter.GaussianBlur(25))
        layer = Image.composite(Image.new('RGBA', (W, H), (0, 0, 0, 255)), layer, sh)
    layer.alpha_composite(tile, (10, 430))
    return layer


def price_page_layers(card_path, date, shadow):
    return {
        'rule': rule_layer(),
        'headline': text_layer(HEADLINE, (60, 215, 960, 130), 96, 800, GOLD),
        'date': text_layer(date, (60, 345, 960, 70), 48, 600, WHITE),
        'card': card_layer(card_path, shadow),
        'shop': text_layer(SHOP_NAME, (60, 1520, 960, 64), 44, 700, GOLD),
        'contact': text_layer(CONTACT, (60, 1590, 960, 56), 38, 500, WHITE),
    }


def make_vertical(card, date, out):
    img = background()
    for lay in price_page_layers(card, date, shadow=True).values():
        img.alpha_composite(lay)
    img.convert('RGB').save(out, quality=95)


# ---------- video ----------
def fade(t, start, dur):
    if t < start: return 0.0
    return min(1.0, (t - start) / dur)


def put(frame, layer, alpha=1.0, scale=1.0, center=None):
    if alpha <= 0: return
    if scale != 1.0:
        cx, cy = center
        w2, h2 = round(W * scale), round(H * scale)
        big = layer.resize((w2, h2), Image.BILINEAR)
        layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        layer.paste(big, (round(cx - cx * scale), round(cy - cy * scale)))
    if alpha < 1.0:
        a = layer.getchannel('A').point(lambda v: int(v * alpha))
        layer = layer.copy(); layer.putalpha(a)
    frame.alpha_composite(layer)


def photo_layer(path):
    im = Image.open(path).convert('RGB')
    k = min(1080 / im.width, 1440 / im.height)  # objectFit contain (scales up too)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.paste(im, ((1080 - im.width) // 2, 240 + (1440 - im.height) // 2))
    return layer


def make_video(card, date, out):
    bg = background()
    page = price_page_layers(card, date, shadow=False)
    photos = [photo_layer(A(f'shop/shop{i:02d}.jpg')) for i in range(1, 16)]
    ph_top = text_layer(PH_TOP, (60, 90, 960, 90), 60, 800, GOLD)
    ph_bot = text_layer(CONTACT, (60, 1730, 960, 70), 44, 600, WHITE)
    starts = [3.934 + i * (15 - 3.934) / 15 for i in range(16)]
    card_c = (10 + 530, 430 + 530)

    def price_page(frame, t, t0):
        put(frame, page['rule'], fade(t, t0, 0.3))
        put(frame, page['headline'], fade(t, t0, 0.3))
        put(frame, page['date'], fade(t, t0 + 0.3, 0.3))
        k = fade(t, t0, 0.5)
        put(frame, page['card'], k, 0.92 + 0.08 * k, card_c)
        put(frame, page['shop'], fade(t, t0 + 0.6, 0.3))
        put(frame, page['contact'], fade(t, t0 + 0.9, 0.3))

    ff = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                           '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', A('litpasong-theme-v2.mp3'),
                           '-af', f'afade=t=out:st={DUR - 0.6}:d=0.6', '-t', str(DUR),
                           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
                           '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    for n in range(math.ceil(DUR * FPS)):
        t = n / FPS
        frame = bg.copy()
        if t < 3.934:
            price_page(frame, t, 0)
        elif t < 15:
            i = min(14, int((t - 3.934) / ((15 - 3.934) / 15)))
            if i > 0: put(frame, photos[i - 1])  # previous photo stays under the zoom-in
            k = fade(t, starts[i], 0.25)
            put(frame, photos[i], k, 1.06 - 0.06 * k, (540, 960))
            put(frame, ph_top, fade(t, 3.934, 0.3))
            put(frame, ph_bot, fade(t, 3.934, 0.3))
        else:
            price_page(frame, t, 15)
        ff.stdin.write(frame.convert('RGB').tobytes())
    ff.stdin.close()
    if ff.wait() != 0: raise SystemExit('ffmpeg failed')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('kind', choices=['vertical', 'video'])
    p.add_argument('--card', required=True)
    p.add_argument('--date', required=True, help='DD/MM/YYYY')
    p.add_argument('--out', required=True)
    a = p.parse_args()
    (make_vertical if a.kind == 'vertical' else make_video)(a.card, a.date, a.out)
    print(a.out)
