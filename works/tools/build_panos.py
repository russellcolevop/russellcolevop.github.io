#!/usr/bin/env python3
"""Russell Works walkthrough: convert the generated panoramas to WebP under works/pano/.
    <venv>/bin/python works/tools/build_panos.py <design package>/assets/panoramas
Pillow with libwebp (a scratchpad venv: python3 -m venv v && v/bin/pip install pillow numpy).
Desktop file is the 8192-wide export, phone file the 4096-wide export; names keep the source stem."""
import sys, os, glob
from PIL import Image
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'pano')
os.makedirs(OUT, exist_ok=True)
for f in sorted(glob.glob(os.path.join(SRC, '*.jpg'))):
    stem = os.path.splitext(os.path.basename(f))[0]
    im = Image.open(f).convert('RGB')
    q = 72 if stem.endswith('-phone') else 70
    p = os.path.join(OUT, stem + '.webp')
    im.save(p, 'WEBP', quality=q, method=6)
    print(f'{stem:28s}{im.size[0]}x{im.size[1]} {os.path.getsize(p)//1024:5d} KB')

# Russell seated beside the folio (ventures room): same cut-out recipe as the other figures, 900 px tall, no shadow.
src = os.path.join(SRC, '..', 'russell-folio.png')
im = Image.open(src).convert('RGBA')
im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
im = im.resize((round(im.size[0] * 900 / im.size[1]), 900), Image.LANCZOS)
w, h = im.size; pad = round(h * 0.05)
out = Image.new('RGBA', (w + 2 * pad, h + pad), (0, 0, 0, 0)); out.alpha_composite(im, (pad, 0))
p = os.path.join(OUT, '..', 'img', 'russell-folio.webp')
out.save(p, 'WEBP', quality=74, alpha_quality=85, method=6)
print('russell-folio', out.size[0], out.size[1], 'x0', pad, 'x1', pad + w, 'y1', h, os.path.getsize(p) // 1024, 'KB')
