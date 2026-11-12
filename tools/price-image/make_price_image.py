#!/usr/bin/env python3
"""Litpasong daily gold price image, made locally (no Orshot credits).

Usage:
  python3 make_price_image.py --baht "44,650,000" --salung "11,260,000" \
      --bar "44,600,000" --date "12-11-2026" --time "10:20" --out out.jpg

Reproduces Orshot template 30408 ("Litpasong Daily Gold Price"): Toby's blank
background (assets/bg.jpg), Noto Sans Lao Looped for Lao text with Noto Sans
for the digits (as Orshot's font fallback does), maroon gradient fill, thin
light-gold stroke and soft drop shadow; date line in gold gradient.
"""
import argparse, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda n: os.path.join(HERE, 'assets', n)
W = H = 2576

PRICE = dict(size=112, weight='ExtraBold', align='right', box_w=1213, box_h=160,
             grad=[(0, '#A82236'), (0.35, '#B8303F'), (1, '#46060F')],
             shadow=(6, 9, 10, (40, 10, 0, int(0.45 * 255))),
             stroke=('#FFECAA', 3))
DATE = dict(size=52, weight='Bold', align='center', box_w=690, box_h=105,
            grad=[(0, '#FFF0B4'), (0.35, '#FFE38C'), (1, '#D6A03C')],
            shadow=(3, 5, 6, (0, 0, 0, int(0.5 * 255))), stroke=None)
ELEMENTS = {
    'price_1baht': ((1000, 1225), PRICE),
    'price_1salung': ((1000, 1460), PRICE),
    'price_bar': ((1027, 2020), PRICE),
    'date_line': ((943, 815), DATE),
}

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def is_lao(ch):
    return 0x0E80 <= ord(ch) <= 0x0EFF or ch == ' '

_metrics = {}
def lao_metrics(weight):
    if weight not in _metrics:
        f = TTFont(A(f'NotoSansLaoLooped-{weight}.ttf'))
        upm = f['head'].unitsPerEm
        _metrics[weight] = (f['hhea'].ascent / upm, -f['hhea'].descent / upm)
    return _metrics[weight]

def runs(text):
    out = []
    for ch in text:
        kind = 'lao' if is_lao(ch) else 'latin'
        if out and out[-1][0] == kind: out[-1][1] += ch
        else: out.append([kind, ch])
    return out

def gradient(w, h, stops):
    g = Image.new('RGB', (1, h))
    cols = [(p, hexrgb(c)) for p, c in stops]
    for y in range(h):
        t = y / max(h - 1, 1)
        for (p0, c0), (p1, c1) in zip(cols, cols[1:]):
            if p0 <= t <= p1:
                k = (t - p0) / (p1 - p0) if p1 > p0 else 0
                g.putpixel((0, y), tuple(round(a + (b - a) * k) for a, b in zip(c0, c1)))
                break
    return g.resize((w, h))

def draw_text(canvas, text, pos, st):
    size, weight = st['size'], st['weight']
    fonts = {'lao': ImageFont.truetype(A(f'NotoSansLaoLooped-{weight}.ttf'), size),
             'latin': ImageFont.truetype(A(f'NotoSans-{weight}.ttf'), size)}
    parts = runs(text)
    widths = [fonts[k].getlength(t) for k, t in parts]
    total = sum(widths)
    x0, y0 = pos
    if st['align'] == 'right': x = x0 + st['box_w'] - total
    else: x = x0 + (st['box_w'] - total) / 2
    asc, desc = lao_metrics(weight)
    line_h = 1.2 * size
    line_top = y0 + (st['box_h'] - line_h) / 2
    baseline = line_top + (line_h - (asc + desc) * size) / 2 + asc * size

    fill = Image.new('L', (W, H), 0); dfill = ImageDraw.Draw(fill)
    stroke = Image.new('L', (W, H), 0); dstroke = ImageDraw.Draw(stroke)
    sw = st['stroke'][1] / 2 if st['stroke'] else 0  # CSS stroke is centred on the outline
    cx = x
    for (k, t), w in zip(parts, widths):
        dfill.text((cx, baseline), t, font=fonts[k], fill=255, anchor='ls')
        if sw:
            dstroke.text((cx, baseline), t, font=fonts[k], fill=255, anchor='ls',
                         stroke_width=1, stroke_fill=255)
        cx += w
    outline = stroke if sw else fill
    # drop shadow
    dx, dy, blur, rgba = st['shadow']
    sh = Image.new('L', (W, H), 0); sh.paste(outline, (dx, dy))
    sh = sh.filter(ImageFilter.GaussianBlur(blur / 2))
    sh = sh.point(lambda v: v * rgba[3] // 255)
    canvas.paste(Image.new('RGB', (W, H), rgba[:3]), (0, 0), sh)
    if sw:
        canvas.paste(Image.new('RGB', (W, H), hexrgb(st['stroke'][0])), (0, 0), stroke)
    # gradient fill over the line box
    top = int(line_top); gh = int(round(line_h))
    g = Image.new('RGB', (W, H), hexrgb(st['grad'][0][1]))
    g.paste(Image.new('RGB', (W, H - top - gh), hexrgb(st['grad'][-1][1])), (0, top + gh))
    g.paste(gradient(W, gh, st['grad']), (0, top))
    canvas.paste(g, (0, 0), fill)

def make(baht, salung, bar, date, time, out):
    bg = Image.open(A('bg.jpg')).convert('RGB').resize((W, H), Image.LANCZOS)
    texts = {'price_1baht': f'{baht} ກີບ', 'price_1salung': f'{salung} ກີບ',
             'price_bar': f'{bar} ກີບ', 'date_line': f'ທີ່ {date} ເວລາ {time}'}
    for key, (pos, st) in ELEMENTS.items():
        draw_text(bg, texts[key], pos, st)
    bg.save(out, quality=92)

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    for a in ('baht', 'salung', 'bar', 'date', 'time', 'out'): p.add_argument('--' + a, required=True)
    a = p.parse_args()
    make(a.baht, a.salung, a.bar, a.date, a.time, a.out)
    print(a.out)
