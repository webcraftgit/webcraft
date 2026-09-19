#!/usr/bin/env python3
"""
Rebuild the garment structure a flat mockup export is missing: a neck opening,
a collar rib, edge shading and a bottom hem.

WHY THIS EXISTS
The chained-inside render arrived as an all-over print cut into a t-shirt
outline, with no neck, no hems and no fold shading. Against the other products
— which have a real collar and a visible neck hole — it reads as a paper
cutout rather than a garment.

WHAT IT DOES, and what it deliberately does NOT do:
  - THE SILHOUETTE IS NEVER CUT. A crew neck on this kind of ghost-mannequin
    render shows the INSIDE BACK of the shirt, not the page behind it. So the
    neck is painted as a darkened well, not punched out of the alpha. Cutting
    a hole would show the tile colour through the shirt, which is the one
    mistake that would look worse than the flat version.
  - Shading is derived from the garment's OWN alpha, blurred, so darkening
    follows the true silhouette — including under the sleeves and along the
    taper — instead of being a generic oval vignette pasted on top.
  - The back neck is shallower than the front, because that is how a crew neck
    is actually cut. Using one depth for both is the tell that gives away a
    fake collar.

This is a REPAIR, not a substitute for a correct export. If the mockup can be
re-rendered with its collar and hem layers switched on, do that instead.

USAGE
  python3 scripts/rebuild-garment.py <in.webp> <out.webp> front|back
"""

import sys

import numpy as np
from PIL import Image, ImageFilter


def rebuild(src, dst, side):
    im = Image.open(src).convert("RGBA")
    W, H = im.size
    rgb = np.array(im.convert("RGB")).astype(np.float32)
    a = np.array(im.getchannel("A")).astype(np.float32) / 255.0

    ys, xs = np.where(a > 0.5)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    gw, gh = x1 - x0, y1 - y0
    cx = (x0 + x1) / 2.0

    # ---- 1. volume, from the garment's own blurred silhouette ----------
    # Edge pixels get a low blurred value, interior stays at 1. Darkening by
    # that map rounds the shoulders and sleeves without touching the print in
    # the middle of the chest.
    soft = np.array(
        Image.fromarray((a * 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(gw * 0.040)
        )
    ).astype(np.float32) / 255.0
    shade = 0.80 + 0.20 * np.clip(soft, 0, 1)
    rgb *= shade[..., None]

    # ---- 2. neck well + collar rib ------------------------------------
    # Radii as fractions of garment width so this survives any re-scaling.
    rx = gw * 0.140
    ry = gh * (0.050 if side == "front" else 0.034)   # back necks sit higher
    ncy = y0 + gh * 0.031                             # full oval, close to the top
    rib = gw * 0.015

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d_in = ((xx - cx) / rx) ** 2 + ((yy - ncy) / ry) ** 2
    d_out = ((xx - cx) / (rx + rib)) ** 2 + ((yy - ncy) / (ry + rib)) ** 2

    inside = (d_in <= 1.0) & (a > 0.5)
    collar = (d_in > 1.0) & (d_out <= 1.0) & (a > 0.5)

    # the well: deep shadow, slightly cool, with a soft floor so it still
    # reads as fabric rather than a black sticker
    # The well is NOT radially uniform. A neck opening is darkest at its top
    # edge — that is the inside of the back collar, facing away from the light
    # — and opens up toward the front hem. A symmetric radial falloff is what
    # makes a painted-on collar read as a porthole rather than a hole.
    vert = np.clip((yy - (ncy - ry)) / (2.0 * ry + 1e-6), 0, 1)      # 0 top, 1 bottom
    depth = 0.94 - 0.30 * vert
    well = np.clip(1.0 - depth * np.clip(1.0 - d_in, 0, 1) ** 0.30, 0.11, 1.0)
    rgb[inside] *= well[inside][:, None]

    # the rib: a touch lighter than the body so the band separates, with the
    # inner edge darker where it turns under
    lift = 1.0 + 0.20 * np.clip(1.0 - (d_out[collar] - 1.0), 0, 1)
    rgb[collar] = np.clip(rgb[collar] * lift[:, None] + 5.0, 0, 255)

    # feather the boundary so the rib does not look die-cut
    mask = np.zeros((H, W), np.float32)
    mask[inside | collar] = 1.0
    edge = np.array(
        Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.0))
    ).astype(np.float32) / 255.0
    band = (edge > 0.08) & (edge < 0.92) & (a > 0.5)
    rgb[band] *= 0.93

    # ---- 3. bottom hem -------------------------------------------------
    hem_y = y1 - gh * 0.028
    hem = (yy > hem_y) & (yy < y1 - gh * 0.004) & (a > 0.5)
    rgb[hem] = np.clip(rgb[hem] * 1.07 + 3.0, 0, 255)
    line = (yy > hem_y - gh * 0.006) & (yy <= hem_y) & (a > 0.5)
    rgb[line] *= 0.85

    out = Image.fromarray(
        np.dstack([np.clip(rgb, 0, 255).astype(np.uint8),
                   (a * 255).astype(np.uint8)]), "RGBA")
    out.save(dst, "WEBP", quality=82, method=6)
    print(f"  {side:5s} {dst}")


if __name__ == "__main__":
    if len(sys.argv) != 4 or sys.argv[3] not in ("front", "back"):
        sys.exit(__doc__)
    rebuild(sys.argv[1], sys.argv[2], sys.argv[3])
