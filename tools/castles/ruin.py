"""Skeleton / Black Skeleton ruin: v2 silhouette upscaled, no stamped crag.

The official paintings sit the ruin on a steep sculpted hill. We do not stamp
that land. The arch, walls, towers, ladder, rubble, vines, cobwebs, skeletons,
dead-tree decorations and (for black) lava veins are the structure; the game
picks a natural hilltop and fills foundations down to the slope so the lower
arch can read as if it belongs to the hillside.

Interiors are ruined but walkable: collapsed floors with remaining paths,
spiral/straight stairs that still reach the battlements, cobwebs, rubble.
Corridors >= 3 wide, doors/archways >= 2 (usually 3) tall.
"""
from ids import *
from vox import *
import math

S = 3

# v2 local layout (no hill):
# left turret box(-14..-8) height 11 → *3
LT = dict(x0=-14 * S, x1=-8 * S, z0=-2 * S, z1=3 * S, y1=20 * S)   # -42..-24, y1=60, rises above the arch
# arch in the left wing, painted as a big hillside opening: x=-9..-3 in v2
ARCH = dict(x0=-15 * S, x1=-4 * S, z=7 * S, y1=17 * S, depth=12)   # bigger pointed left arch
# mid ruined wall / pinnacles between left and center
# central tower 0..7, -8..-1, height 22
CT = dict(x0=0 * S, x1=7 * S, z0=-8 * S, z1=-1 * S, y1=28 * S)     # 0..21, -24..-3, y1=84  (the tall keep)
# right gable 9..15, height 12, ladder on inner face
RT = dict(x0=9 * S, x1=15 * S, z0=-4 * S, z1=3 * S, y1=16 * S)     # 27..45, y1=48

# mid wall occupies x ≈ LT.x1 .. CT.x0, irregular height
MID_X0, MID_X1 = LT['x1'] - 2, CT['x0'] + 2
MID_Z0, MID_Z1 = -3 * S, 3 * S
MID_Y = 12 * S   # 36, jagged on top


def pal_mossy(x, y, z):
    return mossy_mix(x, y, z)


def pal_black(x, y, z):
    return black_mix(x, y, z)


def ruin_merlons(g, x0, z0, x1, z1, y, pal, missing=0.35):
    """Broken merlons: some gone, some short, some tall."""
    x0, x1 = ord2(x0, x1); z0, z1 = ord2(z0, z1)
    i = 0
    def one(x, z):
        nonlocal i
        i += 1
        r = rnd(x, y, z, 91)
        if r < missing:
            return
        ht = 1 if r < missing + 0.25 else (3 if r > 0.92 else 2)
        for k in range(ht):
            bid = pal(x, y + 1 + k, z) if callable(pal) else pal
            g.set(x, y + 1 + k, z, bid)
        # occasionally a jagged extra
        if r > 0.96:
            g.set(x, y + 1 + ht, z, pal(x, y + 1 + ht, z) if callable(pal) else pal)
    for x in range(x0, x1 + 1):
        one(x, z0); one(x, z1)
    for z in range(z0 + 1, z1):
        one(x0, z); one(x1, z)


def jagged_top(g, x0, z0, x1, z1, y0, y1, pal, freq=6.0):
    """Fill a volume whose top is a noisy ruined ridge (hollow shell + some ribs)."""
    x0, x1 = ord2(x0, x1); z0, z1 = ord2(z0, z1); y0, y1 = ord2(y0, y1)
    for x in range(x0, x1 + 1):
        for z in range(z0, z1 + 1):
            n = rnd(x, 0, z, 3) * 0.7 + rnd(x // 2, 0, z // 2, 5) * 0.3
            top = int(y0 + (y1 - y0) * (0.45 + 0.55 * n))
            # shell: outer columns full, interior only floor + a thin top and some ribs
            edge = x == x0 or x == x1 or z == z0 or z == z1
            for y in range(y0, top + 1):
                if edge or y == y0 or y >= top - 1 or ((x + z) % 5 == 0 and y > top - 6):
                    g.set(x, y, z, pal(x, y, z) if callable(pal) else pal)
            # broken merlon-like spikes
            if edge and rnd(x, top, z, 9) > 0.55:
                for k in range(1, 1 + int(2 + rnd(x, top, z, 11) * 3)):
                    g.set(x, top + k, z, pal(x, top + k, z) if callable(pal) else pal)


def punch_holes(g, x0, y0, z0, x1, y1, z1, n=12, r=2):
    x0, x1 = ord2(x0, x1); y0, y1 = ord2(y0, y1); z0, z1 = ord2(z0, z1)
    for i in range(n):
        x = x0 + int(rnd(i, 1, 2, 13) * max(1, x1 - x0))
        y = y0 + int(rnd(i, 2, 3, 13) * max(1, y1 - y0))
        z = z0 + int(rnd(i, 3, 4, 13) * max(1, z1 - z0))
        carve_box(g, x - r, y - r, z - r, x + r, y + r, z + r)


def cobweb_fill(g, x0, y0, z0, x1, y1, z1, chance=0.06):
    """Sparse cobwebs hanging under lintels and in corners — not face plaster."""
    x0, x1 = ord2(x0, x1); y0, y1 = ord2(y0, y1); z0, z1 = ord2(z0, z1)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            for z in range(z0, z1 + 1):
                if g.get(x, y, z):
                    continue
                above = g.get(x, y + 1, z)
                corner = sum(1 for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1)) if g.get(x + dx, y, z + dz))
                if above and rnd(x, y, z, 21) < chance:
                    g.set(x, y, z, COBWEB)
                elif corner >= 2 and rnd(x, y, z, 22) < chance * 0.6:
                    g.set(x, y, z, COBWEB)


def moss_streaks(g, x0, y0, z0, x1, y1, z1, face='+z', n=10):
    dx, dz = {'+z': (0, 1), '-z': (0, -1), '+x': (1, 0), '-x': (-1, 0)}[face]
    x0, x1 = ord2(x0, x1)
    for i in range(n):
        x = x0 + int(rnd(i, 7, 8, 15) * max(1, x1 - x0))
        y1s = y0 + int(8 + rnd(i, 8, 9, 15) * 24)
        y0s = y0 + int(rnd(i, 9, 10, 15) * 8)
        z = z1 if dz > 0 else z0
        # only drip in front of SOLID masonry, 1-wide, skip openings
        for y in range(min(y0s, y1s), max(y0s, y1s) + 1):
            if g.get(x, y, z) and not g.get(x + dx, y, z + dz) and rnd(x, y, z, 71) < 0.55:
                g.set(x + dx, y, z + dz, MOSS)


def collapsed_floor(g, x0, z0, x1, z1, y, pal, hole=0.35):
    """Walkable ruined floor: most of a 3-wide path remains, other cells randomly missing."""
    x0, x1 = ord2(x0, x1); z0, z1 = ord2(z0, z1)
    # keep a winding but connected path along +x then +z through the room
    cx, cz = x0 + 1, z0 + 1
    path = set()
    x, z = x0 + 1, (z0 + z1) // 2
    while x <= x1 - 1:
        for w in range(-1, 2):
            path.add((x, z + w))
        x += 1
        if rnd(x, y, z, 31) < 0.3:
            z = max(z0 + 1, min(z1 - 1, z + (1 if rnd(x, y, z, 33) > 0.5 else -1)))
    for x in range(x0, x1 + 1):
        for z in range(z0, z1 + 1):
            if (x, z) in path or rnd(x, y, z, 35) > hole:
                g.set(x, y, z, pal(x, y, z) if callable(pal) else pal)
            else:
                g.set0(x, y, z)
                # occasional rubble hanging under the hole
                if rnd(x, y, z, 37) < 0.3:
                    g.set(x, y - 1, z, pal(x, y - 1, z) if callable(pal) else pal)


# Thin lava-vein polylines traced from the Black Skeleton painting (local coords).
# Each path is a list of (x,y,z) waypoints; veins are 1 block thick, with short
# branches. They stay on the STRUCTURE (and a short foundation drop), not a stamped hill.
BLACK_VEINS = [
    # central tower, 4 dominant rivers (painting)
    [(10, 90, -3), (11, 70, -1), (12, 50, 2), (13, 30, 8), (14, 14, 16), (16, 2, 24), (18, -2, 28)],
    [(6, 86, -3), (5, 64, 0), (4, 42, 4), (3, 22, 12), (2, 8, 20), (1, 0, 26), (0, -2, 30)],
    [(14, 88, -2), (15, 62, 1), (17, 40, 6), (19, 20, 14), (21, 6, 22), (23, -1, 27)],
    [(8, 82, 0), (9, 55, 3), (10, 32, 10), (11, 12, 18), (12, 2, 25), (13, -2, 29)],
    # mid-left mass / between arch and centre
    [(-8, 64, 6), (-6, 44, 10), (-4, 24, 16), (-2, 8, 22), (0, 0, 27), (1, -2, 30)],
    [(-16, 58, 8), (-15, 36, 12), (-14, 16, 18), (-13, 4, 24), (-12, -1, 28)],
    # left arch / left slope
    [(-30, 54, 8), (-32, 34, 12), (-36, 16, 18), (-40, 4, 24), (-44, -2, 28)],
    [(-24, 48, 10), (-26, 28, 14), (-30, 12, 20), (-34, 2, 26), (-36, -2, 30)],
    [(-38, 40, 10), (-42, 22, 16), (-48, 8, 22), (-52, 0, 26), (-56, -2, 30)],
    # right tower and right slope
    [(36, 58, 4), (38, 36, 10), (42, 16, 16), (46, 4, 22), (50, -1, 27)],
    [(44, 54, 6), (48, 30, 12), (54, 12, 18), (60, 2, 24), (64, -2, 28)],
    [(30, 44, 8), (32, 22, 14), (34, 8, 20), (36, 0, 26), (38, -2, 29)],
]

def raster_vein(g, path, main=MAGMA, glow=MAGMA, width=2):
    if len(path) < 2:
        return
    for i in range(len(path) - 1):
        x0, y0, z0 = path[i]
        x1, y1, z1 = path[i + 1]
        steps = max(abs(x1 - x0), abs(y1 - y0), abs(z1 - z0), 1)
        for s in range(steps + 1):
            t = s / steps
            x = int(round(x0 + (x1 - x0) * t))
            y = int(round(y0 + (y1 - y0) * t))
            z = int(round(z0 + (z1 - z0) * t))
            for dx in range(-width + 1, width):
                for dz in range(-width + 1, width):
                    # prefer painting over existing masonry (replace), also a short hang
                    if g.get(x + dx, y, z + dz) or g.get(x + dx, y, z + dz + 1) or g.get(x + dx, y, z + dz - 1):
                        bid = glow if (dx == 0 and dz == 0 and rnd(x, y, z, 51) < 0.25) else main
                        g.set(x + dx, y, z + dz, bid)
                    else:
                        # if this is on the front of a wall, hang on +z
                        if g.get(x + dx, y, z + dz - 1):
                            g.set(x + dx, y, z + dz, main)
            # tiny branches
            if rnd(x, y, z, 53) < 0.08:
                bx, by, bz = x + (1 if rnd(x, y, z, 55) > 0.5 else -1), y - 2, z + 1
                for k in range(4):
                    if g.get(bx, by - k, bz) or g.get(bx, by - k, bz - 1):
                        g.set(bx, by - k, bz, main)



def spire(g, cx, cz, y0, y1, pal, r=2):
    """Thin jagged pinnacle, 2–3 blocks across, broken top."""
    for y in range(y0, y1 + 1):
        rad = r if y < y1 - 4 else max(1, r - (y - (y1 - 4)))
        for dx in range(-rad, rad + 1):
            for dz in range(-rad, rad + 1):
                if dx * dx + dz * dz <= rad * rad + 1:
                    if y > y1 - 3 and rnd(cx + dx, y, cz + dz, 41) < 0.35:
                        continue
                    g.set(cx + dx, y, cz + dz, pal(cx + dx, y, cz + dz) if callable(pal) else pal)
    # broken spike cap
    for k in range(1, 2 + int(rnd(cx, y1, cz, 43) * 4)):
        g.set(cx, y1 + k, cz, pal(cx, y1 + k, cz) if callable(pal) else pal)


def flying_buttress(g, x0, y0, z0, x1, y1, z1, pal, thick=2):
    """Diagonal rib between two points (flying buttress / structural ridge)."""
    steps = max(abs(x1 - x0), abs(y1 - y0), abs(z1 - z0), 1)
    for i in range(steps + 1):
        t = i / steps
        x = int(round(x0 + (x1 - x0) * t))
        y = int(round(y0 + (y1 - y0) * t))
        z = int(round(z0 + (z1 - z0) * t))
        for dx in range(-thick + 1, thick):
            for dz in range(-thick + 1, thick):
                g.set(x + dx, y, z + dz, pal(x + dx, y, z + dz) if callable(pal) else pal)
                if i < steps * 0.7:
                    g.set(x + dx, y - 1, z + dz, pal(x + dx, y - 1, z + dz) if callable(pal) else pal)


def crumbling_skirt(g, pal):
    """Wide ruined masonry apron (structure, not a dirt crag). Height falls off
    away from the towers and toward the camera so the mass is a slope of
    jagged ribs, not a rectangular slab."""
    cores = [(-33, 0, 52), (-8, 4, 44), (10, -4, 72), (36, 0, 42), (-20, 8, 36)]
    x0, x1, z0, z1 = -88, 96, -20, 30
    for x in range(x0, x1 + 1):
        for z in range(z0, z1 + 1):
            h = 0
            for cx, cz, ch in cores:
                d = ((x - cx) ** 2 / 900.0 + (z - cz) ** 2 / 400.0) ** 0.5
                if d < 1.35:
                    h = max(h, ch * max(0.0, 1.0 - d) * (0.55 + 0.45 * rnd(x, 0, z, 3)))
            # front downslope (camera looks from +z)
            if z > 4:
                h *= max(0.12, 1.0 - (z - 4) / 22.0)
            # also ease the far left/right so the sides aren't vertical cliffs
            wing = max(0, abs(x - 8) - 36) / 50.0
            h *= max(0.15, 1.0 - wing * 0.7)
            h = int(h)
            if h < 3:
                continue
            n = rnd(x, 1, z, 7)
            rib = ((x * 3 + z * 5) % 6 == 0) or n > 0.8
            # crust only: top few blocks, plus ribs that run partway down
            for y in range(max(0, h - 2), h + 1):
                g.set(x, y, z, pal(x, y, z) if callable(pal) else pal)
            if rib:
                y_lo = max(0, h - 10)
                for y in range(y_lo, h - 1):
                    if rnd(x, y, z, 8) > 0.35:
                        g.set(x, y, z, pal(x, y, z) if callable(pal) else pal)
            if n > 0.7:
                for k in range(1, 2 + int(rnd(x, h, z, 11) * 5)):
                    g.set(x, h + k, z, pal(x, h + k, z) if callable(pal) else pal)

def densify_ruin(g, pal):
    """Spires, flying buttresses, crumbling edges — the painting's gothic mass."""
    crumbling_skirt(g, pal)
    # many thin pinnacles at varied heights (mid-left cluster is the busiest)
    spikes = [
        (-22, 8, 28, 80, 2), (-16, 11, 30, 74, 2), (-10, 9, 32, 86, 3),
        (-4, 12, 28, 78, 2), (2, 8, 24, 70, 2), (-18, 4, 22, 64, 2),
        (-28, 10, 20, 68, 2), (8, 10, 30, 58, 2), (16, 7, 24, 56, 2),
        (22, 9, 22, 64, 2), (28, 6, 20, 58, 2), (-34, 6, 18, 56, 2),
        (-8, 14, 28, 72, 2), (4, 14, 26, 54, 2), (34, 8, 22, 60, 2),
        (-40, 8, 14, 50, 2), (42, 5, 16, 52, 2), (-12, 0, 20, 62, 2),
        (12, 12, 28, 52, 2), (-24, 14, 18, 54, 1), (20, 12, 18, 48, 1),
        (-6, 6, 34, 82, 2), (-14, 8, 36, 76, 2), (6, 4, 30, 66, 2),
    ]
    for cx, cz, y0, y1, r in spikes:
        spire(g, cx, cz, y0, y1, pal, r=r)
    # flying buttresses from side masses toward the central keep and down the front
    flying_buttress(g, -30, 48, 8, -4, 28, 4, pal, thick=2)
    flying_buttress(g, -22, 56, 6, 2, 36, 2, pal, thick=2)
    flying_buttress(g, 36, 46, 6, 16, 30, 0, pal, thick=2)
    flying_buttress(g, 44, 40, 8, 20, 22, 4, pal, thick=2)
    flying_buttress(g, -36, 36, 12, -18, 16, 16, pal, thick=2)
    flying_buttress(g, 40, 32, 12, 24, 14, 16, pal, thick=2)
    # extra dark moss drips across the front
    moss_streaks(g, -50, 0, -4, 55, 70, 16, '+z', n=22)
    moss_streaks(g, -40, 4, 4, 40, 50, 12, '+z', n=10)
    # more cobwebs in the big left arch and lower recesses
    cobweb_fill(g, ARCH['x0'] - 2, 2, ARCH['z'] - 4, ARCH['x1'] + 2, ARCH['y1'] + 4, ARCH['z'] + 4, 0.07)
    cobweb_fill(g, -20, 4, 8, 8, 24, 18, 0.05)

    # Chew the left rectangular arch-wall into a sloped, broken mass so it
    # doesn't read as a flat slab. Keep the turret, arch soffit and mid spires.
    spire_pts = [(-22, 8), (-16, 11), (-10, 9), (-4, 12), (2, 8), (-18, 4),
                 (-28, 10), (-34, 6), (-8, 14), (-40, 8), (-12, 0), (-24, 14),
                 (-6, 6), (-14, 8)]
    def near_spire(x, z):
        for sx, sz in spire_pts:
            if (x - sx) ** 2 + (z - sz) ** 2 <= 20:
                return True
        return False
    for x in range(-96, 8):
        for z in range(-18, 36):
            if LT['x0'] - 1 <= x <= LT['x1'] + 1 and LT['z0'] - 1 <= z <= LT['z1'] + 1:
                continue
            if near_spire(x, z):
                continue
            in_arch_ring = (ARCH['x0'] - 3 <= x <= ARCH['x1'] + 3
                            and abs(z - (LT['z1'] + 3)) <= ARCH['depth'] + 4)
            cap = 46
            if x < -28:
                cap -= int((-28 - x) * 0.75)
            if z > 7:
                cap -= int((z - 7) * 1.25)
            if in_arch_ring:
                cap = max(cap, ARCH['y1'] + 6)
            cap = max(5, cap)
            for y in range(cap + 1, 120):
                if g.get(x, y, z):
                    g.set0(x, y, z)


def build_ruin(kind='mossy'):
    black = kind == 'black'
    pal = pal_black if black else pal_mossy
    step_id = DSTILE if black else OAKST
    g = Grid(-100, 110, -10, 140, -55, 50)

    # ----- LEFT RUINED TURRET -----
    x0, x1, z0, z1, y1 = LT['x0'], LT['x1'], LT['z0'], LT['z1'], LT['y1']
    shell_box(g, x0, 0, z0, x1, y1, z1, pal, thick=2, floor=True, roof=False)
    jagged_top(g, x0, z0, x1, z1, y1 - 8, y1 + 6, pal)
    ruin_merlons(g, x0, z0, x1, z1, y1, pal, missing=0.4)
    # floors, ruined
    for fy in (0, 12, 24):
        if fy < y1:
            collapsed_floor(g, x0 + 2, z0 + 2, x1 - 2, z1 - 2, fy, pal, hole=0.4)
    spiral_stair(g, (x0 + x1) // 2, (z0 + z1) // 2, 0, y1 - 2, 1, min(3, (x1 - x0) // 2 - 1), pal, step=step_id)
    # windows / holes
    punch_holes(g, x0, 8, z0, x1, y1 - 4, z1, n=8, r=1)
    window(g, (x0 + x1) // 2 - 1, 16, z1, pal, '+z', w=2, h=4, recess=1)
    window(g, (x0 + x1) // 2 - 1, 28, z1, pal, '+z', w=2, h=3, recess=1)
    rubble_pile(g, (x0 + x1) // 2, z1 + 2, 0, pal, r=4, h=3)
    cobweb_fill(g, x0, 8, z0, x1, y1, z1, 0.05)

    # ----- BIG ARCH in the left wing / lower left (reads as hillside arch on a slope) -----
    # Wall is only as wide as the opening plus jambs, and only a little taller than
    # the arch — not a flat 50-block slab. The left turret rises above the left jamb.
    ax0, ax1, az, ay1, ad = ARCH['x0'] - 2, ARCH['x1'] + 2, LT['z1'] + 3, ARCH['y1'] + 6, ARCH['depth']
    # sides stay lower than the crown over the opening
    shell_box(g, ax0, -2, az - ad, ax1, ay1, az + 2, pal, thick=2, floor=True, roof=False)
    # ruined, peaked top over the opening only — sides drop away
    mid = (ax0 + ax1) // 2
    for x in range(ax0, ax1 + 1):
        drop = int(abs(x - mid) * 0.45)
        jagged_top(g, x, az - ad, x, az + 2, ay1 - 2 - drop, ay1 + 6 - drop, pal)
    # the opening itself — tall, wide, clearly empty (the painting's dominant left arch)
    archway(g, ax0 + 2, ax1 - 2, 0, ay1, az + 2, pal, depth=ad + 2, face='+z')
    carve_box(g, ax0 + 3, 0, az - ad - 1, ax1 - 3, ay1 - 1, az + 3)
    # stepped inner soffit in the same stone, then keep the void empty
    for s in range(1, 6):
        for x in range(ax0 + 2 + s, ax1 - 1 - s + 1):
            g.set(x, ay1 - 1 + s, az + 2, pal(x, ay1 - 1 + s, az + 2) if callable(pal) else pal)
    carve_box(g, ax0 + 4, 0, az - ad, ax1 - 4, ay1 - 4, az + 3)
    # cobwebs only under the soffit, not filling the opening
    cobweb_fill(g, ax0 + 3, ay1 - 8, az - 2, ax1 - 3, ay1, az + 2, 0.08)
    rubble_pile(g, (ax0 + ax1) // 2, az + 3, 0, pal, r=5, h=2)

    # ----- MID RUINED WALL / PINNACLES -----
    jagged_top(g, MID_X0, MID_Z0, MID_X1, MID_Z1, 8, MID_Y + 10, pal)
    # a walkable 3-wide ruined wall-walk along the mid wall at y~24
    collapsed_floor(g, MID_X0 + 1, MID_Z0 + 1, MID_X1 - 1, MID_Z1 - 1, 24, pal, hole=0.25)
    # several jagged pinnacles (the painting's mid-left spikes)
    for i, (px, pz, ph) in enumerate(((-14, 0, 48), (-8, 2, 40), (-2, -2, 44), (2, 1, 36))):
        jagged_top(g, px - 3, pz - 3, px + 3, pz + 3, 20, ph, pal)
        if i == 1:
            skel_figure(g, px, ph - 2, pz + 3)
    # corridor through the mid wall at ground, 3 wide, linking left turret to center
    carve_box(g, MID_X0, 1, -1, MID_X1, 4, 1)
    cobweb_fill(g, MID_X0, 1, MID_Z0, MID_X1, MID_Y, MID_Z1, 0.04)
    moss_streaks(g, MID_X0, 0, MID_Z0, MID_X1, MID_Y, MID_Z1, '+z', n=6)

    # ----- CENTRAL TALL TOWER -----
    cx0, cx1, cz0, cz1, cy1 = CT['x0'], CT['x1'], CT['z0'], CT['z1'], CT['y1']
    shell_box(g, cx0, 0, cz0, cx1, cy1, cz1, pal, thick=2, floor=True, roof=False)
    # ruined crown — broken merlons, asymmetric spikes (as in the painting)
    jagged_top(g, cx0, cz0, cx1, cz1, cy1 - 6, cy1 + 8, pal)
    ruin_merlons(g, cx0, cz0, cx1, cz1, cy1 + 2, pal, missing=0.45)
    # floors every 12, collapsed but with a path, plus spiral
    for fy in range(0, cy1, 12):
        collapsed_floor(g, cx0 + 2, cz0 + 2, cx1 - 2, cz1 - 2, fy, pal, hole=0.4)
    spiral_stair(g, (cx0 + cx1) // 2, (cz0 + cz1) // 2, 0, cy1, 2, min(4, (cx1 - cx0) // 2 - 2), pal, step=step_id)
    # windows / scars on the front
    for y in (16, 32, 48, 64):
        window(g, (cx0 + cx1) // 2 - 1, y, cz1, pal, '+z', w=2, h=3, recess=2)
        if y in (32, 64):
            window(g, (cx0 + cx1) // 2 - 5, y + 4, cz1, pal, '+z', w=1, h=3, recess=1)
    punch_holes(g, cx0, 20, cz0, cx1, cy1 - 8, cz1, n=10, r=1)
    moss_streaks(g, cx0, 0, cz0, cx1, cy1, cz1, '+z', n=5)
    cobweb_fill(g, cx0, 10, cz0, cx1, cy1, cz1, 0.04)
    # skeletons on the upper battlements (painting has figures on the walls)
    skel_figure(g, cx0 + 2, cy1 + 3, cz1)
    skel_figure(g, cx1 - 2, cy1, cz1 - 1)
    g.mark('chest', x=(cx0 + cx1) // 2, y=1, z=cz0 + 3, face='+z', loot='ruin')
    g.mark('garrison', x=(cx0 + cx1) // 2, y=1, z=(cz0 + cz1) // 2, role='ruin')
    g.mark('camera', name='hall', x=(cx0 + cx1) // 2, y=5, z=cz1 - 2, lx=(cx0 + cx1) // 2, ly=6, lz=cz0 + 4, fov=70)
    g.mark('camera', name='towerstair', x=(cx0 + cx1) // 2 + 3, y=28, z=(cz0 + cz1) // 2 + 3,
           lx=(cx0 + cx1) // 2, ly=30, lz=(cz0 + cz1) // 2, fov=70)
    g.mark('camera', name='wallwalk', x=(cx0 + cx1) // 2, y=cy1 + 4, z=cz1 + 4,
           lx=(cx0 + cx1) // 2, ly=cy1, lz=cz0, fov=70)
    # ground link from mid wall
    carve_box(g, MID_X1 - 2, 1, -1, cx0 + 2, 4, 1)

    # Ruined connecting curtains so the three masses read as one structure (no stamped hill).
    jagged_top(g, cx1 - 2, -5, RT['x0'] + 2, 5, 2, 34, pal)
    jagged_top(g, LT['x1'] - 2, -2, CT['x0'] + 2, 8, 2, 40, pal)
    # Dominant mid-left pinnacles (the painting's jagged spikes between left and centre)
    for px, pz, ph, w in ((-20, 8, 62, 2), (-14, 10, 56, 2), (-8, 7, 66, 3),
                          (-2, 9, 58, 2), (4, 6, 48, 2), (-16, 4, 44, 2)):
        jagged_top(g, px - w, pz - w, px + w, pz + w, 18, ph, pal)
    # Break the boxy left / right silhouettes: bite corners, add depth jogs
    punch_holes(g, LT['x0'], 10, LT['z0'], LT['x1'], LT['y1'] - 6, LT['z1'], n=14, r=2)
    punch_holes(g, RT['x0'], 10, RT['z0'], RT['x1'], RT['y1'] - 4, RT['z1'], n=8, r=2)
    # 1-block jogs on the left front so it isn't a flat rectangle
    for x in range(LT['x0'], LT['x1'] + 1, 3):
        if rnd(x, 0, LT['z1'], 61) > 0.45:
            jagged_top(g, x, LT['z1'], x + 1, LT['z1'] + 2, 8, 16 + int(rnd(x, 1, 0, 62) * 20), pal)

    # ----- RIGHT GABLED TOWER + LADDER -----
    rx0, rx1, rz0, rz1, ry1 = RT['x0'], RT['x1'], RT['z0'], RT['z1'], RT['y1']
    shell_box(g, rx0, 0, rz0, rx1, ry1, rz1, pal, thick=2, floor=True, roof=False)
    # broken gable: two peaks (the painting's split/pointed top)
    mid = (rx0 + rx1) // 2
    for k in range(0, 10):
        # left peak
        fill_box(g, rx0 + k // 2, ry1 + k, rz0, mid - 1 - k // 3, ry1 + k, rz1, pal)
        # right peak
        fill_box(g, mid + 1 + k // 3, ry1 + k, rz0, rx1 - k // 2, ry1 + k, rz1, pal)
    # hollow the gable interior a bit
    carve_box(g, rx0 + 2, ry1, rz0 + 2, rx1 - 2, ry1 + 6, rz1 - 2)
    for fy in (0, 12, 24):
        if fy < ry1:
            collapsed_floor(g, rx0 + 2, rz0 + 2, rx1 - 2, rz1 - 2, fy, pal, hole=0.3)
    spiral_stair(g, (rx0 + rx1) // 2, (rz0 + rz1) // 2, 0, ry1, 1, min(3, (rx1 - rx0) // 2 - 1), pal, step=step_id)
    # dark window on the front
    window(g, mid - 1, 20, rz1, pal, '+z', w=3, h=5, recess=2)
    window(g, mid - 1, 34, rz1, pal, '+z', w=2, h=4, recess=1)
    # LADDER on the INNER face (toward the center, -x side of this tower) as in the painting
    ladder_up(g, rx0, 2, ry1 + 2, (rz0 + rz1) // 2 + 2, face='-x')
    # also visible from the front-right? the painting shows the ladder on the inner
    # (left) side of the right tower, facing the central keep — that's -x.
    cobweb_fill(g, rx0, 4, rz0, rx1, ry1, rz1, 0.05)
    moss_streaks(g, rx0, 0, rz0, rx1, ry1, rz1, '+z', n=4)
    rubble_pile(g, mid, rz1 + 3, 0, pal, r=4, h=3)
    # ground corridor from center to right
    carve_box(g, cx1 - 1, 1, -1, rx0 + 2, 4, 1)
    g.mark('chest', x=mid, y=1, z=rz0 + 2, face='+z', loot='ruin')
    skel_figure(g, rx0 + 2, ry1 + 2, rz1)

    # ----- DEAD TREES (decorations at the painted left/right of the footprint) -----
    dead_tree(g, -78, 0, 18, h=32)
    dead_tree(g, 88, 0, 16, h=30)
    # a couple of smaller ones mid-slope left
    dead_tree(g, -70, 0, 6, h=22)
    dead_tree(g, 80, 0, 8, h=20)
    dead_tree(g, -62, 0, 22, h=18)

    # more cobwebs on the lower left (painting has several on the slope/arch)
    cobweb_fill(g, ax0 - 2, 4, az - 1, ax1 + 1, 14, az + 3, 0.06)

    # relief on front faces
    relief_face(g, cx0, 8, cz1, cx1, cy1, cz1, pal, '+z', 0.08)
    relief_face(g, x0, 4, z1, x1, y1, z1, pal, '+z', 0.08)

    densify_ruin(g, pal)

    # Re-plant flank trees after the slope chew (it would strip earlier trunks).
    dead_tree(g, -78, 0, 18, h=32)
    dead_tree(g, 88, 0, 16, h=30)
    dead_tree(g, -70, 0, 6, h=22)
    dead_tree(g, 80, 0, 8, h=20)
    dead_tree(g, -62, 0, 22, h=18)


    if black:
        for path in BLACK_VEINS:
            raster_vein(g, path, main=MAGMA, glow=MAGMA, width=2)
        # a small magma pool marker at the foot (foundations will carry it to ground)
        for dx in range(-6, 7):
            for dz in range(-3, 5):
                if dx * dx + dz * dz <= 28:
                    g.set(-28 + dx, -2, 22 + dz, MAGMA)
        # unfinished / broken nether portal in a chamber (c53 tradition)
        # obsidian frame, incomplete, in the central tower ground floor
        for y in range(1, 6):
            g.set(cx0 + 3, y, cz0 + 3, OBSIDIAN)
            g.set(cx0 + 8, y, cz0 + 3, OBSIDIAN)
        for x in range(cx0 + 3, cx0 + 9):
            g.set(x, 1, cz0 + 3, OBSIDIAN)
            # broken lintel — missing two blocks
            if x not in (cx0 + 5, cx0 + 6):
                g.set(x, 5, cz0 + 3, OBSIDIAN)
        g.mark('blackPortal', x=cx0 + 5, y=1, z=cz0 + 3)

    # short foundation skirt
    xmin, ymin, zmin, xmax, ymax, zmax = g.bounds_used()
    for x in range(xmin, xmax + 1):
        for z in range(zmin, zmax + 1):
            if g.get(x, 0, z) or g.get(x, 1, z):
                if not g.get(x, 0, z):
                    g.set(x, 0, z, pal(x, 0, z))
                g.set(x, -1, z, pal(x, -1, z))
                g.set(x, -2, z, BLACKSTONE if black else COBBLE)

    # hero camera: low, slightly front, looking up at the cluster (matches the paintings)
    g.mark('camera', name='hero', x=8, y=24, z=148, lx=8, ly=44, lz=6, fov=50)
    g.mark('camera', name='hero-wide', x=6, y=22, z=170, lx=8, ly=42, lz=4, fov=50)
    g.mark('kind', name=kind)
    return g
