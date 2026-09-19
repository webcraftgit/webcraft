#!/usr/bin/env python3
"""
NOKTURN — normalise garment shots into the 4:5 catalogue frame.

    python3 scripts/normalize-nokturn-photos.py <product-id> <front.png> <back.png>
    python3 scripts/normalize-nokturn-photos.py --renormalise      # redo everything in place

WHY THIS WAS REWRITTEN (CP4_24)
-------------------------------
The previous version scaled every export so its ALPHA BOUNDING BOX filled 88%
of the frame width. That is the obvious thing to measure and it is the wrong
thing to measure, because a garment's alpha bbox width is its SLEEVE SPAN, not
its body.

The tees in this catalogue were shot with the sleeves spread wide; the hoodies
with the sleeves hanging at the sides. Normalising both to the same sleeve span
therefore shrank the tee bodies to fit their own outstretched sleeves. Measured
on the delivered files: tee torso 628px against hoodie torso 1170px — the
hoodie bodies rendered 1.87x wider than the tee bodies, from a script whose
whole job was making them consistent. In the grid the tees looked like doll
clothes hung next to real garments.

WHAT IT MEASURES NOW
--------------------
GARMENT HEIGHT — shoulder to hem. An oversize tee and a boxy hoodie are within
a couple of centimetres of each other in real body length (~72cm vs ~70cm), so
height is the metric that actually corresponds to standing both garments in
front of one camera at one distance. It is also immune to sleeve position,
which is exactly the variable that broke the old approach.

Width then falls out of the garment's own proportions: the tee ends up wider
than the hoodie because a tee with its sleeves out IS wider. That reads as one
shoot, which is the point.

PER-PRODUCT ASPECT ALIGNMENT
----------------------------
The hoodie front and back arrived as separately generated renders with
different proportions — front 1232x1440, back 1232x1539, an aspect difference
of 6.4%. Under any single uniform scale, one axis stays mismatched, and the
grid's hover cross-fade turns into the garment visibly growing.

So each product's shots are resized to ONE shared garment box, taking the
median aspect across its own shots. That needs a small non-uniform correction,
which is capped at ANISO_CAP: a 6% squash on a hoodie photograph is invisible,
a 20% one would not be, and if a product ever exceeds the cap the script says
so and falls back to uniform scaling rather than quietly distorting a garment.

Output stays 1400x1750 WebP with transparency preserved — the tile colour
behind the garment is set in code (`T.tile` in NokturnSite.tsx), so exports
must never bake in a background.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

CANVAS_W, CANVAS_H = 1400, 1750
TARGET_H_FRAC = 0.80   # garment height as a fraction of frame height
MAX_W_FRAC = 0.95      # never let sleeves touch the frame edge
ALPHA_CUT = 40         # alpha below this is background, not garment
ANISO_CAP = 0.10       # max non-uniform correction before we refuse

DEMO_DIR = Path("public/demo/nokturn")
SHOTS = ("front", "back")


def garment_box(im: Image.Image) -> tuple[int, int, int, int]:
    """Bounding box of the garment itself, from the alpha channel."""
    a = np.array(im.split()[3])
    ys, xs = np.where(a > ALPHA_CUT)
    if len(xs) == 0:
        raise SystemExit("image is fully transparent — nothing to normalise")
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def looks_like_baked_checkerboard(im: Image.Image) -> bool:
    """
    Some exports arrive with the transparency checkerboard burned into the
    pixels. Detected by CONTENT, not by alpha: a correctly cut-out garment in
    this catalogue is nearly all dark fabric (~10% light pixels), a baked
    checkerboard is about half light squares.
    """
    a = np.array(im.convert("RGBA"))
    opaque = a[..., 3] > 200
    if opaque.sum() < 1000:
        return False
    light = (a[..., :3].max(2) > 150) & opaque
    return light.sum() / opaque.sum() > 0.35


def normalise(product: str, sources: dict[str, Path]) -> None:
    loaded: dict[str, Image.Image] = {}
    boxes: dict[str, tuple[int, int, int, int]] = {}
    for shot, path in sources.items():
        im = Image.open(path).convert("RGBA")
        if looks_like_baked_checkerboard(im):
            print(f"  ! {shot}: transparency checkerboard looks baked into the "
                  f"pixels — re-export with real alpha")
        loaded[shot] = im
        boxes[shot] = garment_box(im)

    # one shared garment box for the whole product, from the median aspect
    aspects = {s: (b[2] - b[0]) / (b[3] - b[1]) for s, b in boxes.items()}
    aspect = float(np.median(list(aspects.values())))

    for shot, a in aspects.items():
        drift = abs(a - aspect) / aspect
        if drift > ANISO_CAP:
            print(f"  ! {shot}: proportions differ from this product's other "
                  f"shots by {drift * 100:.1f}% (cap {ANISO_CAP * 100:.0f}%). "
                  f"Scaling uniformly instead — the cross-fade will show a jump. "
                  f"Check both shots are the same garment in the same framing.")
            aspect = a

    gh = CANVAS_H * TARGET_H_FRAC
    gw = gh * aspect
    if gw > CANVAS_W * MAX_W_FRAC:                 # sleeves would overflow
        gw = CANVAS_W * MAX_W_FRAC
        gh = gw / aspect
    gw, gh = int(round(gw)), int(round(gh))

    for shot, im in loaded.items():
        garment = im.crop(boxes[shot]).resize((gw, gh), Image.LANCZOS)
        canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
        canvas.paste(garment, ((CANVAS_W - gw) // 2, (CANVAS_H - gh) // 2))
        out = DEMO_DIR / f"{product}-{shot}.webp"
        canvas.save(out, "WEBP", quality=82, method=6)
        kb = out.stat().st_size / 1024
        flag = "" if kb < 250 else "   ! over the ~250 KB budget"
        print(f"  {out.name:34s} garment {gw}x{gh}  {kb:6.1f} KB{flag}")


def main() -> None:
    args = sys.argv[1:]

    if args[:1] == ["--renormalise"]:
        products = sorted({p.stem.rsplit("-", 1)[0] for p in DEMO_DIR.glob("*.webp")})
        for product in products:
            srcs = {s: DEMO_DIR / f"{product}-{s}.webp" for s in SHOTS}
            srcs = {s: p for s, p in srcs.items() if p.exists()}
            if not srcs:
                continue
            print(product)
            normalise(product, srcs)
        return

    if len(args) < 2:
        raise SystemExit(__doc__)

    product, paths = args[0], [Path(p) for p in args[1:]]
    if len(paths) == 1:
        print("! only one shot given. Run front and back together — they are "
              "aligned to a shared garment box and passing them separately "
              "reintroduces the cross-fade jump this script exists to remove.")
    print(product)
    normalise(product, dict(zip(SHOTS, paths)))


if __name__ == "__main__":
    main()
