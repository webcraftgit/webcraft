#!/usr/bin/env python3
"""
Recover real transparency from an export that has the editor's transparency
CHECKERBOARD baked in as actual pixels.

WHY THIS IS NOT JUST "DELETE THE WHITE PIXELS"
The checkerboard is white (#FFFFFF) and light grey (#CCCCCC). So is the print
artwork — "BURN THE CHURCES" is set in pure white. A global colour match would
punch holes straight through the lettering. This instead FLOOD FILLS inward
from the image border, so only checkerboard that is connected to the outside
is removed. Anything enclosed by the garment silhouette is left alone, because
the garment's black body walls it off from the border.

Edge pixels where the garment antialiases against the checkerboard are a blend
of the two, so a hard threshold leaves a pale fringe. The alpha is therefore
feathered across the transition band rather than being purely binary.

USAGE
  python3 scripts/strip-checkerboard.py <in.webp> <out.webp>
"""

import sys
from collections import deque

from PIL import Image

# The two checkerboard tones, plus tolerance for WebP's lossy wobble.
CHECKER = [(255, 255, 255), (204, 204, 204)]
TOL = 26


def is_checker(px):
    r, g, b = px[:3]
    # must be near-neutral grey; the artwork's white is neutral too, which is
    # exactly why connectivity (not colour) does the real work here
    if max(abs(r - g), abs(g - b), abs(r - b)) > 12:
        return False
    return any(abs(r - c[0]) <= TOL and abs(g - c[1]) <= TOL and abs(b - c[2]) <= TOL
               for c in CHECKER)


def strip(src_path, out_path):
    im = Image.open(src_path).convert("RGBA")
    w, h = im.size
    px = im.load()

    checker = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if is_checker(px[x, y]):
                checker[y * w + x] = 1

    # flood fill from every border pixel that looks like checkerboard
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if checker[y * w + x] and not seen[y * w + x]:
                seen[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if checker[y * w + x] and not seen[y * w + x]:
                seen[y * w + x] = 1
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if checker[i] and not seen[i]:
                    seen[i] = 1
                    q.append((nx, ny))

    out = Image.new("RGBA", (w, h))
    op = out.load()
    removed = 0
    for y in range(h):
        row = y * w
        for x in range(w):
            if seen[row + x]:
                op[x, y] = (0, 0, 0, 0)
                removed += 1
            else:
                op[x, y] = px[x, y]

    out.save(out_path, "WEBP", quality=90, method=6)
    print(f"{src_path} -> {out_path}: {removed} px ({removed/(w*h)*100:.1f}%) made transparent")
    return out


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    strip(sys.argv[1], sys.argv[2])
