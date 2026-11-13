"""Turn the generated studio photos in docs/source-images into the layers the hero shader blends.

Each source is a photo on a plain white surface: wide-<set>.png (hand, three-quarter view, French tips painted
pure green as a key colour) and wide-si001.png, which also contains the TINTAShifter.

Per layer this writes public/hero/<name>.webp (the photo) and public/hero/<name>-m.webp (maps):
  R  keep   1 = object keeps its own colour (hand), ~0.55 on the crystal device, 0 = surface
  G  hand layers: tip mask (where the green key colour is)   |  device layer: specular highlights
  B  shade  surface brightness with the backdrop divided out (1 = bare surface, <1 = shadow)
and lib/hero-layers.json with each hand's vertical nudge so its nails clear the device.

Usage: python3 tools/build_hero.py     Needs: numpy pillow scipy rembg[cpu]
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from rembg import remove, new_session

SRC, OUT = "docs/source-images", "public/hero"
SETS = ["si001", "si002", "spotlight", "chapter", "spectrum"]
SPLIT_Y = 446          # in wide-si001.png: hand above this row, device below
CLEAR_Y = 425          # nails of every set must end above this row
os.makedirs(OUT, exist_ok=True)
session = new_session("isnet-general-use")
ss = lambda a, b, x: np.clip((x - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((x - a) / (b - a), 0, 1))

def analyse(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255
    matte = np.asarray(remove(im, session=session, only_mask=True)).astype(np.float32) / 255
    matte = ss(.3, .9, matte)                            # pull the edge in a touch so no white rim comes along
    lum = a.mean(2)
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32); x, y = xx / w - .5, yy / h - .5
    A = np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], -1).reshape(-1, 6)
    ok = (ndi.maximum_filter(matte, 25) < .05).reshape(-1)
    fit = None
    for _ in range(4):                                   # fit the backdrop, ignoring shadows
        coef = np.linalg.lstsq(A[ok], lum.reshape(-1)[ok], rcond=None)[0]
        fit = (A @ coef).reshape(h, w)
        ok = (ndi.maximum_filter(matte, 25) < .05).reshape(-1) & (lum / fit > .985).reshape(-1)
    shade = np.clip(lum / fit, 0, 1.2)
    return im, a, matte, shade

def edge_fade(h, w, px=48):                              # 1 in the middle, 0 at the right and bottom borders
    yy, xx = np.mgrid[0:h, 0:w]
    return ss(0, px, w - 1 - xx) * ss(0, px, h - 1 - yy)

def save(name, im, r, g, b):
    im.save(f"{OUT}/{name}.webp", quality=88, method=6)
    # maps are stored lossless (lossy WebP would smear the channels into each other); a little smoothing
    # and coarser steps keep them small
    q = lambda v, step: np.round(np.clip(v, 0, 1) * 255 / step) * step
    m = np.clip(np.stack([q(r, 6), q(g, 6), q(ndi.gaussian_filter(b, 1.3), 3)], -1), 0, 255).astype(np.uint8)
    Image.fromarray(m).save(f"{OUT}/{name}-m.webp", lossless=True, method=6)

layers = {}
for s in SETS:
    im, a, matte, shade = analyse(f"{SRC}/wide-{s}.png")
    h, w = matte.shape
    yy = np.mgrid[0:h, 0:w][0]
    if s == "si001":                                     # split the master: hand above, device below
        above = 1 - ss(SPLIT_Y - 5, SPLIT_Y + 5, yy)
        dm = matte * (1 - above)
        spec = ss(1.03, 1.12, shade) * dm                 # sparkle only on the crystal itself
        fade = edge_fade(h, w)
        save("device", im, dm * .55, spec, 1 - (1 - np.clip(shade, 0, 1)) * (1 - above) * fade)
        matte, shade = matte * above, 1 - (1 - np.clip(shade, 0, 1)) * above
    gd = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
    tip = ss(.05, .16, gd) * ndi.maximum_filter(matte, 9)
    keep = np.maximum(matte, tip)
    low = int(np.where(tip > .5)[0].max())
    layers[s] = {"dy": min(0, CLEAR_Y - low)}
    save(s, im, keep, tip, 1 - (1 - np.clip(shade, 0, 1)) * edge_fade(h, w))
    print(s, "lowest tip row", low, "nudge", layers[s]["dy"])
json.dump({"w": w, "h": h, "sets": layers}, open("lib/hero-layers.json", "w"), indent=1)
