"""Turn the generated studio photos in docs/source-images into the layers the hero shader blends.

Sources (all on a plain white surface, nails painted pure green as a key colour for the picked shade):
  alu-wide-<set>.png   opening shot, one per nail set; alu-wide-si001.png also contains the aluminium Shifter
  alu-close-<set>.png  close-up with a nail in the Shifter (only si001 exists so far)

Per layer this writes public/hero/<name>.webp (the photo) and public/hero/<name>-m.webp (maps):
  R  keep   1 = keeps its own colour (hand, device), 0 = surface
  G  nail   where the green key colour is (repainted in the picked colour)
  B  shade  surface brightness with the backdrop divided out (1 = bare surface, <1 = shadow)
and lib/hero-layers.json: per set, a scale (so every hand is the size of the first one) and an upward nudge
(so its nails clear the device).

Usage: python3 tools/build_hero.py     Needs: numpy pillow scipy rembg[cpu]
"""
import glob, json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from rembg import remove, new_session

SRC, OUT = "docs/source-images", "public/hero"
SETS = ["si001", "si002", "spotlight", "chapter", "spectrum"]
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(f"{OUT}/*"): os.remove(f)
session = new_session("isnet-general-use")
def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def analyse(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255
    matte = ss(.3, .9, np.asarray(remove(im, session=session, only_mask=True)).astype(np.float32) / 255)
    lum = a.mean(2); h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32); x, y = xx / w - .5, yy / h - .5
    A = np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], -1).reshape(-1, 6)
    far = (ndi.maximum_filter(matte, 25) < .05).reshape(-1); ok = far
    for _ in range(4):                                   # fit the backdrop, ignoring shadows
        fit = (A @ np.linalg.lstsq(A[ok], lum.reshape(-1)[ok], rcond=None)[0]).reshape(h, w)
        ok = far & (lum / fit > .985).reshape(-1)
    gd = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
    lo = np.minimum(a[..., 0], a[..., 2])
    # green light bounced onto the white table and the device rim is bright and only faintly green; it is not
    # nail, and repainting it turned it into a white glow under the nail. Real nail green has almost no red/blue.
    green = ss(.015, .09, gd) * ndi.maximum_filter(matte, 9)
    core = ndi.binary_dilation(ndi.binary_fill_holes(ndi.binary_opening(green > .6, iterations=2)), iterations=2)
    spill = ss(.015, .06, gd) * ss(.38, .5, lo) * ~core          # only outside the nails: highlights on a nail stay nail
    nail = green * (1 - spill)
    keep = np.maximum(matte * (1 - ndi.gaussian_filter(spill, 1.5)), nail)
    return im, keep, nail, np.clip(lum / fit, 0, 1)

def edge_fade(h, w, px=48):                              # 1 inside, 0 at the right and bottom borders
    yy, xx = np.mgrid[0:h, 0:w]
    return ss(0, px, w - 1 - xx) * ss(0, px, h - 1 - yy)

def save(name, im, keep, nail, shade):
    im.save(f"{OUT}/{name}.webp", quality=80, method=6)
    q = lambda v, step: np.round(np.clip(v, 0, 1) * 255 / step) * step
    m = np.clip(np.stack([q(keep, 6), q(nail, 6), q(ndi.gaussian_filter(shade, 1.3), 3)], -1), 0, 255).astype(np.uint8)
    Image.fromarray(m).save(f"{OUT}/{name}-m.webp", lossless=True, method=6)   # lossless: lossy WebP smears channels

def build(src, pre):
    """src: source file prefix (alu = desktop 16:9, mob = phone 9:16); pre: output name prefix ('' or 'm-')."""
    layers, device, ref_area, w, h = {}, None, None, 0, 0
    for s in SETS:
        im, keep, nail, shade = analyse(f"{SRC}/{src}-wide-{s}.png")
        h, w = keep.shape; fade = edge_fade(h, w)
        if s == "si001":                                 # the master: the hand is the blob touching the left edge
            lab, _ = ndi.label(keep > .5)
            ids = [i for i in np.unique(lab[:, 0]) if i]
            if not ids: raise SystemExit(f"hand not found at the left edge of {src}-wide-si001")
            hand = ndi.binary_dilation(np.isin(lab, ids), iterations=14)
            hm = ndi.gaussian_filter(hand.astype(np.float32), 3)
            device = keep * (1 - hm) > .5
            save(pre + "device", im, keep * (1 - hm), np.zeros_like(keep), 1 - (1 - shade) * (1 - hm) * fade)
            keep, nail, shade = keep * hm, nail * hm, 1 - (1 - shade) * hm
            ref_area = float((nail > .5).sum())
        scale = float(np.clip(np.sqrt(ref_area / max((nail > .5).sum(), 1)), 1, 1.6))
        big = np.asarray(Image.fromarray((keep * 255).astype(np.uint8)).resize((round(w * scale), round(h * scale))))[:h, :w] > 127
        big = ndi.binary_dilation(big, iterations=10); dy = 0
        while dy > -300 and (np.roll(big, dy, 0)[: h + dy] & device[: h + dy]).any(): dy -= 10
        layers[s] = {"scale": round(scale, 3), "dy": dy}
        save(pre + s, im, keep, nail, 1 - (1 - shade) * fade)
        print(src, s, layers[s])
    closes = sorted(glob.glob(f"{SRC}/{src}-close-*.png"))
    for path in closes:
        name = pre + "close-" + os.path.basename(path)[len(src) + 7:-4]
        im, keep, nail, shade = analyse(path)
        solid = ndi.binary_fill_holes(keep > .35) & ~ndi.binary_dilation(nail > .3, iterations=6)
        keep = np.maximum(keep, ndi.gaussian_filter(solid.astype(np.float32), 1.2))
        save(name, im, keep, nail, shade); print(name)
    return {"w": w, "h": h, "sets": layers, "closeups": [os.path.basename(p)[len(src) + 7:-4] for p in closes]}

desk = build("alu", "")
desk["mobile"] = build("mob", "m-")
json.dump(desk, open("lib/hero-layers.json", "w"), indent=1)
