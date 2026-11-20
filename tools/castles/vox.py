# Shared voxel grid and castle primitives. Deterministic. No I/O.
from __future__ import annotations
import math, struct, zlib, json
from collections import defaultdict

from ids import *

def rnd(x, y, z, salt=0):
    n = (x * 374761393 + y * 668265263 + z * 2147483647 + salt * 9973) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return (n ^ (n >> 16)) / 4294967296.0

def lerp(a, b, t):
    return a + (b - a) * t

class Grid:
    __slots__ = ('ox', 'oy', 'oz', 'sx', 'sy', 'sz', 'a', 'specials')

    def __init__(self, x0, x1, y0, y1, z0, z1):
        self.ox, self.oy, self.oz = int(x0), int(y0), int(z0)
        self.sx = int(x1) - int(x0) + 1
        self.sy = int(y1) - int(y0) + 1
        self.sz = int(z1) - int(z0) + 1
        self.a = bytearray(self.sx * self.sy * self.sz * 2)  # uint16 le
        self.specials = defaultdict(list)

    def _i(self, x, y, z):
        return ((x - self.ox) * self.sy + (y - self.oy)) * self.sz + (z - self.oz)

    def inb(self, x, y, z):
        return (self.ox <= x < self.ox + self.sx and
                self.oy <= y < self.oy + self.sy and
                self.oz <= z < self.oz + self.sz)

    def get(self, x, y, z):
        if not self.inb(x, y, z):
            return 0
        i = self._i(x, y, z) * 2
        return self.a[i] | (self.a[i + 1] << 8)

    def set(self, x, y, z, bid):
        if not bid or not self.inb(x, y, z):
            return
        i = self._i(x, y, z) * 2
        self.a[i] = bid & 255
        self.a[i + 1] = (bid >> 8) & 255

    def set0(self, x, y, z):
        if not self.inb(x, y, z):
            return
        i = self._i(x, y, z) * 2
        self.a[i] = 0
        self.a[i + 1] = 0

    def set_any(self, x, y, z, bid):
        if not self.inb(x, y, z):
            return
        i = self._i(x, y, z) * 2
        self.a[i] = bid & 255
        self.a[i + 1] = (bid >> 8) & 255

    def mark(self, kind, **kw):
        self.specials[kind].append(kw)

    def count(self):
        n = 0
        a = self.a
        for i in range(0, len(a), 2):
            if a[i] | a[i + 1]:
                n += 1
        return n

    def bounds_used(self):
        xmin, ymin, zmin = 10**9, 10**9, 10**9
        xmax, ymax, zmax = -10**9, -10**9, -10**9
        found = False
        sx, sy, sz = self.sx, self.sy, self.sz
        a = self.a
        for xi in range(sx):
            base = xi * sy
            x = xi + self.ox
            for yi in range(sy):
                row = (base + yi) * sz
                y = yi + self.oy
                for zi in range(sz):
                    i = (row + zi) * 2
                    if a[i] | a[i + 1]:
                        z = zi + self.oz
                        found = True
                        if x < xmin: xmin = x
                        if y < ymin: ymin = y
                        if z < zmin: zmin = z
                        if x > xmax: xmax = x
                        if y > ymax: ymax = y
                        if z > zmax: zmax = z
        if not found:
            return (0, 0, 0, 0, 0, 0)
        return (xmin, ymin, zmin, xmax, ymax, zmax)

    def iter_blocks(self):
        sx, sy, sz = self.sx, self.sy, self.sz
        a = self.a
        ox, oy, oz = self.ox, self.oy, self.oz
        for xi in range(sx):
            base = xi * sy
            x = xi + ox
            for yi in range(sy):
                row = (base + yi) * sz
                y = yi + oy
                for zi in range(sz):
                    i = (row + zi) * 2
                    bid = a[i] | (a[i + 1] << 8)
                    if bid:
                        yield x, y, zi + oz, bid

def ord2(a, b):
    return (a, b) if a <= b else (b, a)

def stone_mix(x, y, z, palette=None, relief=True):
    """Weathered irregular greys — mostly rough stone/cobble, not a brick grid.
    No harsh slate/white salt-and-pepper; dark accents are sparse deepslate."""
    r = rnd(x, y, z, 11)
    if r < 0.42:
        return STONE
    if r < 0.68:
        return COBBLE
    if r < 0.86:
        return STONEBRICK
    if r < 0.95:
        return WSTONE
    return DEEPSLATE

def mossy_mix(x, y, z):
    """Dark mossy ruin stone: mossy brick + raw stone/cobble, not a uniform grid."""
    r = rnd(x, y, z, 17)
    if r < 0.50:
        return MOSSYBRICK
    if r < 0.78:
        return STONE
    if r < 0.92:
        return COBBLE
    return STONEBRICK

def black_mix(x, y, z):
    r = rnd(x, y, z, 23)
    if r < 0.90:
        return BLACKSTONE
    if r < 0.97:
        return DSBRICK
    return OBSIDIAN

def fill_box(g, x0, y0, z0, x1, y1, z1, pal):
    x0, x1 = ord2(x0, x1); y0, y1 = ord2(y0, y1); z0, z1 = ord2(z0, z1)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            for z in range(z0, z1 + 1):
                bid = pal(x, y, z) if callable(pal) else pal
                if bid:
                    g.set(x, y, z, bid)

def carve_box(g, x0, y0, z0, x1, y1, z1):
    x0, x1 = ord2(x0, x1); y0, y1 = ord2(y0, y1); z0, z1 = ord2(z0, z1)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            for z in range(z0, z1 + 1):
                g.set0(x, y, z)

def shell_box(g, x0, y0, z0, x1, y1, z1, pal, thick=2, floor=True, roof=True, walls=True):
    """Axis-aligned room shell. Interior stays empty. thick is wall depth."""
    x0, x1 = ord2(x0, x1); y0, y1 = ord2(y0, y1); z0, z1 = ord2(z0, z1)
    t = max(1, int(thick))
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            for z in range(z0, z1 + 1):
                on = False
                if walls and (x <= x0 + t - 1 or x >= x1 - t + 1 or z <= z0 + t - 1 or z >= z1 - t + 1):
                    on = True
                if floor and y <= y0 + (0 if t == 1 else 0) and y == y0:
                    on = True
                if roof and y == y1:
                    on = True
                if on:
                    bid = pal(x, y, z) if callable(pal) else pal
                    if bid:
                        g.set(x, y, z, bid)

def floor_box(g, x0, z0, x1, z1, y, pal):
    x0, x1 = ord2(x0, x1); z0, z1 = ord2(z0, z1)
    for x in range(x0, x1 + 1):
        for z in range(z0, z1 + 1):
            bid = pal(x, y, z) if callable(pal) else pal
            if bid:
                g.set(x, y, z, bid)

def in_cyl(x, z, cx, cz, r):
    return (x - cx) * (x - cx) + (z - cz) * (z - cz) <= r * r + 0.25

def shell_cyl(g, cx, cz, r, y0, y1, pal, thick=2, floor=False, roof=False):
    y0, y1 = ord2(y0, y1)
    r2 = r * r + 0.35
    ri = max(0.6, r - thick)
    ri2 = ri * ri
    for x in range(int(math.floor(cx - r)), int(math.ceil(cx + r)) + 1):
        for z in range(int(math.floor(cz - r)), int(math.ceil(cz + r)) + 1):
            d2 = (x - cx) * (x - cx) + (z - cz) * (z - cz)
            if d2 > r2:
                continue
            ring = d2 >= ri2
            for y in range(y0, y1 + 1):
                if ring or (floor and y == y0) or (roof and y == y1):
                    bid = pal(x, y, z) if callable(pal) else pal
                    if bid:
                        g.set(x, y, z, bid)

def fill_cyl_solid(g, cx, cz, r, y0, y1, pal, r_inner=0):
    y0, y1 = ord2(y0, y1)
    r2 = r * r + 0.35
    ri2 = r_inner * r_inner
    for x in range(int(math.floor(cx - r)), int(math.ceil(cx + r)) + 1):
        for z in range(int(math.floor(cz - r)), int(math.ceil(cz + r)) + 1):
            d2 = (x - cx) * (x - cx) + (z - cz) * (z - cz)
            if d2 > r2 or d2 < ri2:
                continue
            for y in range(y0, y1 + 1):
                bid = pal(x, y, z) if callable(pal) else pal
                if bid:
                    g.set(x, y, z, bid)

def cone_roof(g, cx, cz, r, y0, h, pal, thick=2):
    """Layered shingle cone: each level shrinks, 1-2 block shell, hollow attic."""
    for k in range(h + 1):
        t = k / max(1, h)
        rk = r * (1.0 - t) + 0.35
        if rk < 0.4 and k < h:
            rk = 0.4
        y = y0 + k
        # two-layer shingles for thickness at the start of each ring
        shell_cyl(g, cx, cz, rk, y, y, pal, thick=thick if rk > 1.5 else 1, floor=False, roof=True)
        # cap
        if k == h:
            g.set(int(round(cx)), y, int(round(cz)), pal(int(round(cx)), y, int(round(cz))) if callable(pal) else pal)
            if h >= 2:
                g.set(int(round(cx)), y + 1, int(round(cz)), pal(int(round(cx)), y + 1, int(round(cz))) if callable(pal) else pal)

def pyramid_roof(g, cx, cz, half, y0, h, pal, thick=2):
    """Crow-stepped pyramidal roof, hollow, slate shingles."""
    for k in range(h + 1):
        t = k / max(1, h)
        hk = max(0, int(round(half * (1.0 - t))))
        y = y0 + k
        x0, x1 = cx - hk, cx + hk
        z0, z1 = cz - hk, cz + hk
        for x in range(x0, x1 + 1):
            for z in range(z0, z1 + 1):
                edge = (x <= x0 + thick - 1 or x >= x1 - thick + 1 or
                        z <= z0 + thick - 1 or z >= z1 - thick + 1 or
                        k == h or hk <= 1)
                if edge:
                    bid = pal(x, y, z) if callable(pal) else pal
                    if bid:
                        g.set(x, y, z, bid)
        # crow-step corners: extra block on the diagonal each even step
        if k < h and (k % 2 == 0) and hk >= 1:
            for sx, sz in ((-1, -1), (-1, 1), (1, -1), (1, 1)):
                g.set(cx + sx * hk, y, cz + sz * hk, pal(cx + sx * hk, y, cz + sz * hk) if callable(pal) else pal)

def merlon_rect(g, x0, z0, x1, z1, y, pal, pitch=2, ht=2, thick=2, jitter=False):
    """Crenellations on the top of a rectangular wall (outer ring)."""
    x0, x1 = ord2(x0, x1); z0, z1 = ord2(z0, z1)
    def place(x, z, i):
        h = ht
        if jitter and rnd(x, y, z, 41) < 0.18:
            h = ht + (1 if rnd(x, y, z, 43) < 0.5 else -1)
            h = max(1, h)
        if (i % pitch) == 0:
            for k in range(h):
                for t in range(thick):
                    # inward thickness already on wall; merlon sits on the rim
                    bid = pal(x, y + 1 + k, z) if callable(pal) else pal
                    g.set(x, y + 1 + k, z, bid)
    # front/back (z edges), skip corners double-count by doing corners once
    i = 0
    for x in range(x0, x1 + 1):
        place(x, z0, i)
        place(x, z1, i)
        i += 1
    i = 0
    for z in range(z0 + 1, z1):
        place(x0, z, i)
        place(x1, z, i)
        i += 1

def merlon_ring(g, cx, cz, r, y, pal, pitch=2, ht=2, jitter=False):
    pts = []
    seen = set()
    for a in range(0, 360, 3):
        rad = math.radians(a)
        x = int(round(cx + r * math.cos(rad)))
        z = int(round(cz + r * math.sin(rad)))
        if (x, z) not in seen:
            seen.add((x, z))
            pts.append((x, z))
    for i, (x, z) in enumerate(pts):
        if (i % pitch) != 0:
            continue
        h = ht
        if jitter and rnd(x, y, z, 47) < 0.25:
            h = max(1, ht + (1 if rnd(x, y, z, 49) < 0.5 else -1))
        for k in range(h):
            bid = pal(x, y + 1 + k, z) if callable(pal) else pal
            g.set(x, y + 1 + k, z, bid)

def corbel_ring(g, cx, cz, r, y, pal, every=2):
    """Protruding corbels under a turret overhang."""
    seen = set()
    for a in range(0, 360, 6):
        rad = math.radians(a)
        x = int(round(cx + r * math.cos(rad)))
        z = int(round(cz + r * math.sin(rad)))
        if (x, z) in seen:
            continue
        seen.add((x, z))
        if (x + z) % every:
            continue
        ox = int(round(math.cos(rad)))
        oz = int(round(math.sin(rad)))
        bid = pal(x + ox, y, z + oz) if callable(pal) else pal
        g.set(x + ox, y, z + oz, bid)
        g.set(x, y, z, bid)

def corbel_wall(g, x0, z0, x1, z1, y, pal, outward, every=2):
    """outward is ('+z',) etc. Protrude 1 block under a parapet."""
    x0, x1 = ord2(x0, x1); z0, z1 = ord2(z0, z1)
    dx, dz = {'+z': (0, 1), '-z': (0, -1), '+x': (1, 0), '-x': (-1, 0)}[outward]
    if dz != 0:
        z = z1 if dz > 0 else z0
        for x in range(x0, x1 + 1):
            if (x % every) == 0:
                bid = pal(x, y, z + dz) if callable(pal) else pal
                g.set(x, y, z + dz, bid)
    else:
        x = x1 if dx > 0 else x0
        for z in range(z0, z1 + 1):
            if (z % every) == 0:
                bid = pal(x + dx, y, z) if callable(pal) else pal
                g.set(x + dx, y, z, bid)

def buttress(g, x, z, y0, y1, pal, dx=0, dz=1, depth=3, width=2):
    """Stepped buttress protruding from a wall."""
    for d in range(depth):
        # taper near the top
        top = y1 - d * 2
        for w in range(width):
            wx = x + (w if dz else 0)
            wz = z + (0 if dz else w)
            for y in range(y0, max(y0, top) + 1):
                bid = pal(wx + dx * d, y, wz + dz * d) if callable(pal) else pal
                g.set(wx + dx * d, y, wz + dz * d, bid)

def window(g, x, y, z, pal, face='+z', w=2, h=3, recess=1, bars=False):
    """Recessed window. (x,y,z) is the lower-left (or min) interior of the opening on the wall face."""
    dx, dz = {'+z': (0, 1), '-z': (0, -1), '+x': (1, 0), '-x': (-1, 0)}[face]
    # width axis is perpendicular to face
    wx, wz = (1, 0) if dz != 0 else (0, 1)
    # punch opening and recess
    for i in range(w):
        for k in range(h):
            for r in range(recess + 1):
                px = x + wx * i - dx * r
                py = y + k
                pz = z + wz * i - dz * r
                g.set0(px, py, pz)
            if bars and (i == 0 or i == w - 1 or k == 0 or k == h - 1):
                pass
        # bars down the middle for 2-wide
        if bars:
            for k in range(h):
                g.set(x + wx * (w // 2), y + k, z + wz * (w // 2), BARS)
    # dark back so the opening reads as a recessed cavity, not a pale hole
    for i in range(w):
        for k in range(h):
            px = x + wx * i - dx * (recess + 1)
            pz = z + wz * i - dz * (recess + 1)
            g.set(px, y + k, pz, SLATE)
    # lintel + sill in pal
    for i in range(-1, w + 1):
        for r in range(recess + 1):
            px = x + wx * i - dx * r
            pz = z + wz * i - dz * r
            bid = pal(px, y - 1, pz) if callable(pal) else pal
            g.set(px, y - 1, pz, bid)
            g.set(px, y + h, pz, bid)

def slit(g, x, y, z, pal, face='+z', h=3):
    window(g, x, y, z, pal, face=face, w=1, h=h, recess=1, bars=False)

def door_opening(g, x, y, z, face='+z', w=3, h=3):
    """Carve a door opening. w>=3, h>=2 (game door is 2; opening can be 3)."""
    dx, dz = {'+z': (0, 1), '-z': (0, -1), '+x': (1, 0), '-x': (-1, 0)}[face]
    wx, wz = (1, 0) if dz != 0 else (0, 1)
    # center the opening around x,z
    off = w // 2
    for i in range(w):
        for k in range(h):
            for r in range(0, 3):
                g.set0(x + wx * (i - off) - dx * r, y + k, z + wz * (i - off) - dz * r)
    # record a 2-tall kit door at the center (and a second if w>=3 for double doors)
    g.mark('door', x=x, y=y, z=z, face=face, w=w, h=h)
    if w >= 2:
        g.mark('door', x=x + wx, y=y, z=z + wz, face=face, w=1, h=min(2, h))

def archway(g, x0, x1, y0, y1, z, pal, depth=4, face='+z'):
    """Stepped hood arch carved from a wall at z (or x if face is ±x). Opening [x0,x1] x [y0,y1]."""
    x0, x1 = ord2(x0, x1)
    y0, y1 = ord2(y0, y1)
    w = x1 - x0 + 1
    h = y1 - y0 + 1
    # Inward is opposite the outward face normal: +z face carves toward -z.
    inward = {'+z': -1, '-z': 1, '+x': 0, '-x': 0}[face]
    # carve a stepped opening: sides step in 1 every 2-3 up near the top
    for d in range(depth):
        zz = z + inward * d
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                # stepped soffit: from the top, inset grows
                rise = y - y0
                side = min(x - x0, x1 - x)
                steps = max(0, rise - (h - (w // 2) - 1))
                # jamb step: opening narrows in the top third
                inset = 0
                if rise > h * 0.55:
                    inset = int((rise - h * 0.55) / max(1, h * 0.45) * (w // 4))
                if side < inset:
                    continue
                g.set0(x, y, zz)
        # stone hood / stepped surround on the front face
    # build stepped hood on the outer face (z)
    for s in range(0, max(3, w // 3 + 2)):
        # a ring of pal around the opening, growing out and up
        xx0, xx1 = x0 - s, x1 + s
        yy1 = y1 + s
        for x in range(xx0, xx1 + 1):
            # top of this step
            bid = pal(x, yy1, z) if callable(pal) else pal
            g.set(x, yy1, z, bid)
            if s > 0:
                g.set(x, yy1, z - (1 if face == '+z' else 0), bid)
        # vertical sides of this step, only the new outer column
        for y in range(y0, yy1):
            for x in (xx0, xx1):
                bid = pal(x, y, z) if callable(pal) else pal
                g.set(x, y, z, bid)

def portcullis(g, x0, x1, y0, y1, z):
    x0, x1 = ord2(x0, x1); y0, y1 = ord2(y0, y1)
    # vertical bars every other block, pointed tips (last 2 hang one lower every other)
    for x in range(x0, x1 + 1):
        if (x - x0) % 1 == 0 and (x - x0) % 2 == 0:
            for y in range(y0, y1 + 1):
                g.set(x, y, z, BARS)
            # pointed bottom
            g.set(x, y0 - 1, z, BARS)
        else:
            # thinner gap: still a bar slightly shorter? leave air for spacing
            pass
    # horizontal rail near the top and mid
    mid = (y0 + y1) // 2
    for x in range(x0, x1 + 1):
        g.set(x, y1, z, BARS)
        g.set(x, mid, z, BARS)

def spiral_stair(g, cx, cz, y0, y1, r_in, r_out, pal, step=OAKST, ccw=True, well_col=True):
    """Walkable spiral: 1-block rise, path width >= 3, headroom 4. Central column optional."""
    y0, y1 = ord2(y0, y1)
    # steps per revolution: enough that the landing arc is walkable (~3-4 blocks)
    steps_per_turn = 16
    # central column
    if well_col and r_in >= 1:
        fill_cyl_solid(g, cx, cz, r_in - 0.2, y0, y1, pal)
    for y in range(y0, y1 + 1):
        t = (y - y0) / steps_per_turn * 2 * math.pi
        if not ccw:
            t = -t
        # a wedge ~80 degrees so the path is continuously walkable
        for a in range(-4, 5):
            ang = t + a * 0.16
            for ri in range(int(r_in), int(r_out) + 1):
                x = int(round(cx + ri * math.cos(ang)))
                z = int(round(cz + ri * math.sin(ang)))
                bid = step if abs(a) <= 1 else (pal(x, y, z) if callable(pal) else pal)
                g.set(x, y, z, bid)
                # headroom
                for h in range(1, 5):
                    # don't punch the outer shell: only carve inside r_out-0.2
                    if ri <= r_out - 0.2:
                        g.set0(x, y + h, z)
    g.mark('spiral', cx=cx, cz=cz, y0=y0, y1=y1, r_in=r_in, r_out=r_out)

def straight_stair(g, x, y0, z, n, pal, step=STST, face='+z', width=3):
    """n steps going up in `face` direction, `width` across. Carves headroom."""
    dx, dz = {'+z': (0, 1), '-z': (0, -1), '+x': (1, 0), '-x': (-1, 0)}[face]
    wx, wz = (1, 0) if dz != 0 else (0, 1)
    off = width // 2
    for i in range(n):
        y = y0 + i
        px = x + dx * i
        pz = z + dz * i
        for w in range(width):
            sx = px + wx * (w - off)
            sz = pz + wz * (w - off)
            g.set(sx, y, sz, step)
            for h in range(1, 5):
                g.set0(sx, y + h, sz)
            # also carve the space we're walking into at this height
            g.set0(sx + dx, y + 1, sz + dz)
            g.set0(sx + dx, y + 2, sz + dz)
            g.set0(sx + dx, y + 3, sz + dz)
    g.mark('stair', x=x, y=y0, z=z, n=n, face=face, width=width)

def wall_walk(g, x0, z0, x1, z1, y, pal, thick_out=2, walk=3, merlon_ht=2, pitch=2):
    """Battlement walk: floor `walk` wide inside the outer rim, merlons on the rim, headroom."""
    x0, x1 = ord2(x0, x1); z0, z1 = ord2(z0, z1)
    # floor on the outer `walk` bands
    for x in range(x0, x1 + 1):
        for z in range(z0, z1 + 1):
            edge_d = min(x - x0, x1 - x, z - z0, z1 - z)
            if edge_d < walk:
                bid = pal(x, y, z) if callable(pal) else pal
                g.set(x, y, z, bid)
                for h in range(1, 4):
                    # keep merlons; clear interior air for walking
                    if edge_d >= 1:
                        # only clear if not going to be a merlon on the rim
                        if edge_d != 0:
                            if g.get(x, y + h, z) and edge_d > 0:
                                pass
    merlon_rect(g, x0, z0, x1, z1, y, pal, pitch=pitch, ht=merlon_ht, thick=1)
    # clear walkway air just inside merlons
    for x in range(x0 + 1, x1):
        for z in range(z0 + 1, z1):
            edge_d = min(x - x0, x1 - x, z - z0, z1 - z)
            if 1 <= edge_d < walk:
                for h in range(1, 4):
                    g.set0(x, y + h, z)

def relief_face(g, x0, y0, z0, x1, y1, z1, pal, outward='+z', chance=0.18):
    """Push random blocks one step outward for brick-level relief."""
    x0, x1 = ord2(x0, x1); y0, y1 = ord2(y0, y1); z0, z1 = ord2(z0, z1)
    dx, dz = {'+z': (0, 1), '-z': (0, -1), '+x': (1, 0), '-x': (-1, 0)}[outward]
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            for z in range(z0, z1 + 1):
                if not g.get(x, y, z):
                    continue
                if rnd(x, y, z, 61) < chance:
                    bid = pal(x, y, z) if callable(pal) else pal
                    g.set(x + dx, y, z + dz, bid)

def vine_streak(g, x, y0, y1, z, bid=MOSS, face='+z'):
    dx, dz = {'+z': (0, 1), '-z': (0, -1), '+x': (1, 0), '-x': (-1, 0)}[face]
    for y in range(min(y0, y1), max(y0, y1) + 1):
        if rnd(x, y, z, 71) < 0.8:
            g.set(x + dx, y, z + dz, bid if not callable(bid) else bid)

def ladder_up(g, x, y0, y1, z, face='+z'):
    """Use fence/bars as a climbable ladder run on a face (game may treat bars as climbable; also mark)."""
    y0, y1 = ord2(y0, y1)
    dx, dz = {'+z': (0, 1), '-z': (0, -1), '+x': (1, 0), '-x': (-1, 0)}[face]
    for y in range(y0, y1 + 1):
        g.set(x + dx, y, z + dz, FENCE)
    g.mark('ladder', x=x, y=y0, z=z, y1=y1, face=face)

def rubble_pile(g, x, z, y, pal, r=3, h=3):
    for dx in range(-r, r + 1):
        for dz in range(-r, r + 1):
            d = math.hypot(dx, dz)
            if d > r:
                continue
            hh = int(round(h * (1.0 - d / (r + 0.2))))
            if hh <= 0:
                continue
            # jitter
            if rnd(x + dx, y, z + dz, 81) < 0.25:
                hh = max(0, hh - 1)
            for k in range(hh):
                bid = pal(x + dx, y + k, z + dz) if callable(pal) else pal
                g.set(x + dx, y + k, z + dz, bid)

def skel_figure(g, x, y, z):
    """2-block-tall battlement skeleton (player-scale prop)."""
    bone = WSTONE
    g.set(x, y, z, bone)
    g.set(x, y + 1, z, bone)
    g.mark('skel', x=x, y=y, z=z)

def dead_tree(g, x, y, z, h=10):
    # Thick 3x3 base tapering to a 2x2 trunk, long crooked leafless arms.
    for k in range(h):
        span = 1 if k < max(3, h // 5) else 0
        for dx in range(-span, 2 + span):
            for dz in range(-span, 2 + span):
                if span and (dx in (-span, 1 + span) and dz in (-span, 1 + span)):
                    continue
                g.set(x + dx, y + k, z + dz, PINE)
    arms = [
        (h - 2, 3, 0, 5), (h - 3, 4, 1, 4), (h - 4, -3, 0, 5),
        (h - 2, 0, 3, 4), (h - 5, 2, -3, 4), (h - 3, -2, -3, 4),
        (h - 6, 3, -2, 3), (max(3, h // 2), -4, 2, 4),
        (h - 4, 2, 3, 3), (h - 7, -3, 2, 3), (int(h * 0.65), 4, -1, 3),
    ]
    for k, dx, dz, L in arms:
        if k <= 0:
            continue
        for i in range(1, L + 1):
            yy = y + k + (1 if i > 2 else 0)
            g.set(x + dx * i, yy, z + dz * i, PINE)
            g.set(x + dx * i, yy, z + dz * i + 1, PINE)
            g.set(x + dx * i + (1 if dx == 0 else 0), yy, z + dz * i, PINE)
            if i < L:
                g.set(x + dx * i, yy + 1, z + dz * i, PINE)
    g.mark('deadtree', x=x, y=y, z=z, h=h)

def pack_rle(g):
    """RLE along +x. Returns (header+runs bytes, specials dict, counts)."""
    xmin, ymin, zmin, xmax, ymax, zmax = g.bounds_used()
    runs = []
    # iterate y,z and emit x-runs
    y = ymin
    while y <= ymax:
        z = zmin
        while z <= zmax:
            x = xmin
            while x <= xmax:
                bid = g.get(x, y, z)
                if not bid:
                    x += 1
                    continue
                x0 = x
                x += 1
                while x <= xmax and g.get(x, y, z) == bid and (x - x0) < 32767:
                    x += 1
                runs.append((x0, y, z, x - x0, bid))
            z += 1
        y += 1
    buf = bytearray()
    buf += b'GC13'
    buf += struct.pack('<B', 1)
    buf += struct.pack('<6h', xmin, ymin, zmin, xmax, ymax, zmax)
    buf += struct.pack('<I', len(runs))
    for x, y, z, ln, bid in runs:
        buf += struct.pack('<hhhHH', x, y, z, ln, bid)
    n_blocks = g.count()
    return bytes(buf), dict(g.specials), {
        'runs': len(runs),
        'blocks': n_blocks,
        'aabb': [xmin, ymin, zmin, xmax, ymax, zmax],
    }

def write_bin(path, raw):
    open(path, 'wb').write(raw)

def write_js_payload(models, path):
    """models: {name: {raw: bytes, specials: dict, stats: dict}}"""
    parts = ['// generated by tools/castles/build_models.py — do not edit\n',
             'window.__castleModels = {\n']
    for name, m in models.items():
        b64 = zlib.compress(m['raw'], 9)
        import base64
        s = base64.b64encode(b64).decode('ascii')
        # wrap
        wrapped = '\n    '.join(s[i:i + 120] for i in range(0, len(s), 120))
        spec = json.dumps(m['specials'], separators=(',', ':'))
        stats = json.dumps(m['stats'], separators=(',', ':'))
        parts.append(f'  {json.dumps(name)}: {{z: "\\\n    {wrapped}", s: {spec}, n: {stats}}},\n')
    parts.append('};\n')
    open(path, 'w').write(''.join(parts))
