#!/usr/bin/env python3
"""Russell Works: build every image under works/img/ from the generated artwork.

Reproducible: same input folder, same output.  Needs Pillow + numpy:
    python3 -m venv /tmp/rw-venv && /tmp/rw-venv/bin/pip install pillow numpy
    /tmp/rw-venv/bin/python works/tools/build_images.py <artwork assets dir> [--debug <dir>]

<artwork assets dir> is RussellLabs/job-search-2026/3d-resume-concept-2026-09-30/assets (read only).

Depth method: hand-drawn polygons (below, in a 1280-wide grid, scaled to the plate) cut each plate into
a full opaque background plus alpha cut-outs for the middle and foreground. The background keeps the
cut-out objects too, so a small parallax shift never reveals a hole. Encoder: Pillow WebP (libwebp).
"""
import json, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = sys.argv[1]
DEBUG = sys.argv[sys.argv.index('--debug') + 1] if '--debug' in sys.argv else None
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img')
os.makedirs(OUT, exist_ok=True)
Q_PLATE, Q_PHONE, Q_LAYER = 64, 60, 68
manifest = {'wide': {'w': 2560, 'h': 1440, 'layers': {}}, 'phone': {'w': 1600, 'h': 1200, 'layers': {}}, 'figs': {}}


def save(im, name, q, alpha_q=85):
    p = os.path.join(OUT, name)
    im.save(p, 'WEBP', quality=q, alpha_quality=alpha_q, method=6)
    print(f'{name:34s}{im.size[0]:5d}x{im.size[1]:<5d}{os.path.getsize(p)//1024:5d} KB')


def poly_mask(size, polys, k, feather=1.6):
    """Union of polygons (1280-grid coordinates) as a feathered L mask."""
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    for pl in polys:
        d.polygon([(x * k, y * k) for x, y in pl], fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather * k / 2))


def cutout(plate, polys, k):
    m = poly_mask(plate.size, polys, k)
    box = m.point(lambda v: 255 if v > 2 else 0).getbbox()
    rgba = plate.convert('RGBA')
    rgba.putalpha(m)
    return rgba.crop(box), box


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


# ---- polygons, 1280-wide grid ------------------------------------------------------------
# wide plates are 2560x1440 (k=2), phone plates 1600x1200 (k=1.25)
WIDE = {
    'reception': {
        'mid': [
            rect(655, 0, 780, 458),  # centre pier
            [(578, 330), (600, 285), (630, 275), (660, 285), (668, 330), (650, 385), (665, 400), (665, 432), (630, 440), (598, 432), (595, 400), (610, 380), (580, 350)],  # potted olive
        ],
        'fg': [
            # reception desk with lamp and vase bumps
            [(897, 392), (900, 376), (925, 368), (960, 365), (980, 364), (982, 345), (990, 330), (1003, 325), (1018, 331), (1025, 350), (1026, 364),
             (1100, 366), (1180, 372), (1222, 372), (1225, 352), (1245, 346), (1262, 352), (1266, 372), (1280, 378),
             (1280, 647), (1190, 625), (1040, 572), (920, 520), (905, 505), (897, 480)],
            rect(0, 0, 64, 560),  # left pier
            [(408, 530), (930, 545), (930, 720), (408, 720)],  # plinth block (the model itself is a separate prop)
        ],
        'inpaint': [[(425, 425), (470, 410), (640, 425), (700, 428), (800, 460), (895, 520), (900, 535), (500, 585), (425, 540)]],  # painted model, replaced by the prop
    },
    'workshop': {
        'fg': [
            rect(0, 0, 66, 720),  # left column
            [(66, 404), (130, 404), (130, 395), (135, 365), (150, 355), (180, 352), (205, 360), (212, 380), (222, 384), (222, 404),
             (455, 404), (458, 365), (480, 347), (500, 350), (508, 372), (505, 404),
             (662, 404), (662, 390), (684, 390), (684, 404), (690, 404), (690, 365), (698, 361), (782, 361), (790, 366), (790, 404),
             (838, 404), (838, 374), (884, 374), (886, 404), (930, 404), (930, 392), (962, 392), (962, 404),
             (1152, 404), (1152, 384), (1192, 382), (1194, 408), (1280, 404), (1280, 720), (66, 720)],
        ],
    },
    'gallery': {
        'mid': [
            [(530, 428), (595, 405), (757, 407), (772, 420), (770, 520), (712, 578), (532, 538)],  # plinth 2
            [(692, 395), (740, 380), (840, 380), (852, 392), (851, 460), (810, 483), (695, 455)],  # plinth 3
            [(778, 375), (805, 366), (900, 366), (908, 375), (907, 430), (880, 440), (782, 412)],  # plinth 4
            rect(525, 0, 612, 432),  # pier
        ],
        'fg': [
            [(165, 505), (250, 455), (560, 458), (582, 478), (584, 690), (570, 700), (400, 720), (180, 720), (165, 715)],  # nearest plinth
            rect(0, 0, 70, 548),  # left pier
            [(1205, 350), (1215, 300), (1240, 275), (1265, 272), (1280, 280), (1280, 640), (1238, 632), (1224, 570), (1228, 490), (1210, 470), (1200, 420)],  # right planter
        ],
    },
    'references': {
        'mid': [rect(145, 50, 238, 478), rect(958, 50, 1052, 478), rect(206, 420, 986, 476)],  # the two piers and the wall bench
    },
}
PHONE = {
    'reception': {
        'fg': [
            [(935, 490), (945, 474), (975, 468), (1005, 466), (1008, 440), (1018, 432), (1040, 434), (1055, 448), (1056, 466), (1080, 468),
             (1140, 476), (1200, 490), (1228, 492), (1232, 470), (1250, 458), (1275, 462), (1280, 490), (1280, 782), (1160, 755), (1060, 700), (985, 640), (940, 590), (935, 560)],
            rect(0, 0, 78, 700),
        ],
        'inpaint': [[(425, 565), (470, 548), (700, 548), (900, 625), (918, 660), (500, 715), (430, 600)]],
    },
    'workshop': {
        'fg': [
            rect(0, 0, 72, 960),
            [(72, 528), (112, 528), (112, 500), (122, 470), (150, 458), (166, 475), (165, 528), (400, 528), (402, 490), (420, 458), (445, 462), (450, 528),
             (627, 528), (627, 512), (648, 512), (648, 528), (655, 528), (655, 484), (752, 484), (752, 528), (815, 528), (815, 498), (870, 498), (870, 528),
             (1148, 528), (1148, 508), (1195, 506), (1195, 560), (1280, 540), (1280, 960), (72, 960)],
        ],
    },
}

# ---- room plates --------------------------------------------------------------------------
def inpaint(im, polys, k, iters=400):
    """Fill the polygons by diffusing the surrounding colour inward (numpy only)."""
    a = np.asarray(im.convert('RGB'), dtype=np.float32)
    m = np.asarray(poly_mask(im.size, polys, k, 0), dtype=np.float32) > 128
    s = 4
    sm = a[::s, ::s].copy(); mm = m[::s, ::s]
    ym, xm = np.where(mm)
    sm[mm] = sm[~mm].mean(0)
    for _ in range(iters):
        p = np.pad(sm, ((1, 1), (1, 1), (0, 0)), mode='edge')
        avg = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]) / 4
        sm[mm] = avg[mm]
    big = np.asarray(Image.fromarray(sm.astype(np.uint8)).resize(im.size, Image.BICUBIC), dtype=np.float32)
    mf = np.asarray(poly_mask(im.size, polys, k, 3), dtype=np.float32)[..., None] / 255
    return Image.fromarray((a * (1 - mf) + big * mf).astype(np.uint8))


def debug_outline(plate, cfg, k, name):
    if not DEBUG:
        return
    os.makedirs(DEBUG, exist_ok=True)
    d = plate.convert('RGB'); dr = ImageDraw.Draw(d)
    for key, col in (('mid', (0, 255, 0)), ('fg', (255, 0, 255)), ('inpaint', (255, 255, 0))):
        for pl in cfg.get(key, []):
            dr.line([(x * k, y * k) for x, y in pl + [pl[0]]], fill=col, width=3)
    d.resize((1280, int(1280 * d.size[1] / d.size[0]))).save(os.path.join(DEBUG, name + '.jpg'), quality=85)


def room(name, variant, cfg, plate_file, k, q):
    plate = Image.open(os.path.join(SRC, plate_file)).convert('RGB')
    debug_outline(plate, cfg, k, f'{variant}-{name}')
    bg = inpaint(plate, cfg['inpaint'], k) if 'inpaint' in cfg else plate
    suffix = '' if variant == 'wide' else '-phone'
    save(bg, f'{name}{suffix}.webp', q)
    layers = [{'file': f'{name}{suffix}.webp', 'x': 0, 'y': 0, 'w': plate.size[0], 'h': plate.size[1], 'depth': 0}]
    for key, depth in (('mid', 0.5), ('fg', 1.0)):
        if key in cfg:
            im, box = cutout(bg, cfg[key], k)       # cut from the inpainted plate so the painted model never leaks into a layer
            f = f'{name}{suffix}-{key}.webp'
            save(im, f, Q_LAYER)
            layers.append({'file': f, 'x': box[0], 'y': box[1], 'w': im.size[0], 'h': im.size[1], 'depth': depth})
    manifest[variant]['layers'][name] = layers


for n in ('reception', 'workshop', 'gallery', 'references'):
    room(n, 'wide', WIDE.get(n, {}), f'{n}.png', 2, Q_PLATE)
for n in ('reception', 'workshop', 'gallery', 'references'):
    room(n, 'phone', PHONE.get(n, {}), f'{n}-phone.png', 1.25, Q_PHONE)

# ---- elevator: opening view (background) + opaque frame pieces (foreground) ----------------
el = Image.open(os.path.join(SRC, 'elevator.png')).convert('RGB')
OPEN = (292, 0, 988, 690)  # inner opening, 1280 grid
k = 2
parts = {
    'elevator-bg': (OPEN[0] - 8, 0, OPEN[2] + 8, OPEN[3] + 8),
    'elevator-fgL': (0, 0, OPEN[0] + 2, 720),
    'elevator-fgR': (OPEN[2] - 2, 0, 1280, 720),
    'elevator-fgB': (OPEN[0] + 2, OPEN[3] - 2, OPEN[2] - 2, 720),
}
layers = []
for nm, (x0, y0, x1, y1) in parts.items():
    im = el.crop((x0 * k, y0 * k, x1 * k, y1 * k))
    save(im, nm + '.webp', Q_PLATE if nm == 'elevator-bg' else Q_LAYER)
    layers.append({'file': nm + '.webp', 'x': x0 * k, 'y': y0 * k, 'w': im.size[0], 'h': im.size[1], 'depth': 0 if nm.endswith('bg') else 1.0})
manifest['wide']['layers']['elevator'] = layers
# door leaf: brushed steel sampled from the right jamb
jamb = el.crop((1004 * 2, 0, 1060 * 2, 690 * 2)).resize((96, 1380), Image.LANCZOS)
save(jamb, 'door.webp', 70)
ep = Image.open(os.path.join(SRC, 'elevator-phone.png')).convert('RGB')
save(ep, 'elevator-phone.webp', Q_PHONE)
manifest['phone']['layers']['elevator'] = [{'file': 'elevator-phone.webp', 'x': 0, 'y': 0, 'w': 1600, 'h': 1200, 'depth': 0}]
save(el.resize((480, 270), Image.LANCZOS), "elevator-poster.webp", 40)  # stage placeholder while the tour loads

# ---- the other plates, for the one-page version only ---------------------------------------
for n in ('curriculum', 'customers', 'product', 'operations', 'ventures', 'achievements', 'contact'):
    save(Image.open(os.path.join(SRC, n + '.png')).convert('RGB'), n + '.webp', Q_PLATE)
    save(Image.open(os.path.join(SRC, n + '-phone.png')).convert('RGB'), n + '-phone.webp', Q_PHONE)

# ---- Russell, the referees, the model ------------------------------------------------------
def person(src, name, height, shadow=True, crop_top_bottom=None):
    im = Image.open(os.path.join(SRC, src)).convert('RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    im = im.crop(bb)
    s = height / im.size[1]
    im = im.resize((round(im.size[0] * s), height), Image.LANCZOS)
    w, h = im.size
    pad = round(h * 0.05)
    out = Image.new('RGBA', (w + 2 * pad, h + pad), (0, 0, 0, 0))
    if shadow:
        sh = Image.new('L', out.size, 0)
        ImageDraw.Draw(sh).ellipse((pad + w * .12, h - pad * .8, pad + w * .88, h + pad * .9), fill=70)
        sh = sh.filter(ImageFilter.GaussianBlur(pad * .35))
        blk = Image.new('RGBA', out.size, (24, 40, 46, 0)); blk.putalpha(sh)
        out.alpha_composite(blk)
    out.alpha_composite(im, (pad, 0))
    save(out, name + '.webp', 74)
    manifest['figs'][name] = {'w': out.size[0], 'h': out.size[1], 'x0': pad, 'y0': 0, 'x1': pad + w, 'y1': h}


person('russell-greeting.png', 'russell-greeting', 900, shadow=False)
person('russell-bench.png', 'russell-bench', 900, shadow=False)
for f, n in (('ref-harrison-lapides', 'lapides'), ('ref-michael-haddad', 'haddad'), ('ref-walt-duflock', 'duflock'),
             ('ref-samantha-mclennan', 'mclennan-s'), ('ref-maryann-mclennan', 'mclennan-m'), ('ref-neutral-2', 'rose'), ('ref-jim-cronk', 'cronk')):
    person(f + '.png', 'ref-' + n, 640)

bm = Image.open(os.path.join(SRC, 'building-model.png')).convert('RGBA')
bm = bm.crop(bm.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
bm = bm.resize((900, round(900 * bm.size[1] / bm.size[0])), Image.LANCZOS)
save(bm, 'building-model.webp', 76)
manifest['figs']['building-model'] = {'w': bm.size[0], 'h': bm.size[1], 'x0': 0, 'y0': 0, 'x1': bm.size[0], 'y1': bm.size[1]}

# ---- Fuwari screen prop: the public demo capture on a slim monitor stand --------------------
demo = Image.open(os.path.join(os.path.dirname(OUT), 'img', 'fuwari-public-demo.jpg')).convert('RGB').resize((720, 405), Image.LANCZOS)
W, H = 800, 590
mon = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(mon)
d.ellipse((140, 540, 660, 585), fill=(24, 40, 46, 70))
d.rounded_rectangle((250, 505, 550, 548), 14, fill=(44, 58, 64, 255))
d.polygon([(375, 440), (425, 440), (440, 515), (360, 515)], fill=(44, 58, 64, 255))
d.rounded_rectangle((20, 10, 780, 462), 18, fill=(24, 44, 52, 255))
mon.paste(demo, (40, 28))
save(mon, 'fuwari-screen.webp', 80)

json.dump(manifest, open(os.path.join(OUT, 'layers.json'), 'w'), indent=1)
print('layers.json written')
