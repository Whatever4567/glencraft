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
LT = dict(x0=-14 * S, x1=-8 * S, z0=-2 * S, z1=4 * S, y1=14 * S)   # -42..-24, y1=42  (a bit taller than 11*3 for presence)
# arch in the left wing, painted as a big hillside opening: x=-9..-3 in v2
ARCH = dict(x0=-11 * S, x1=-4 * S, z=5 * S, y1=12 * S, depth=8)    # big hillside arch
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


def cobweb_fill(g, x0, y0, z0, x1, y1, z1, chance=0.12):
    x0, x1 = ord2(x0, x1); y0, y1 = ord2(y0, y1); z0, z1 = ord2(z0, z1)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            for z in range(z0, z1 + 1):
                if g.get(x, y, z):
                    continue
                # hang next to masonry
                near = (g.get(x + 1, y, z) or g.get(x - 1, y, z) or
                        g.get(x, y + 1, z) or g.get(x, y, z + 1) or g.get(x, y, z - 1))
                if near and rnd(x, y, z, 21) < chance:
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
    # central tower face, 3–4 vertical runs (the painting's dominant veins)
    [(10, 80, -2), (10, 60, -2), (9, 40, -1), (8, 20, 0), (7, 6, 1), (6, 0, 2), (5, -4, 3)],
    [(14, 78, -2), (15, 55, -1), (15, 35, 0), (14, 18, 1), (13, 4, 2), (12, -3, 4)],
    [(18, 74, -3), (18, 50, -2), (19, 30, -1), (20, 12, 0), (21, 2, 2), (22, -3, 4)],
    [(6, 70, -3), (5, 48, -2), (4, 28, -1), (3, 12, 0), (2, 2, 2)],
    # mid-left pinnacles down toward the arch
    [(-10, 40, 6), (-12, 28, 7), (-14, 16, 8), (-16, 6, 8), (-18, 0, 9), (-20, -3, 10)],
    [(-4, 36, 8), (-5, 22, 9), (-6, 10, 10), (-7, 2, 11), (-8, -3, 12)],
    # through / under the arch, down-left
    [(-24, 28, 12), (-26, 16, 13), (-28, 6, 14), (-30, 0, 15), (-32, -4, 16)],
    [(-18, 22, 12), (-20, 10, 13), (-22, 2, 14), (-24, -3, 15)],
    # right gable
    [(36, 46, 6), (37, 30, 7), (38, 16, 8), (39, 6, 9), (40, 0, 10), (41, -3, 11)],
    [(30, 40, 8), (31, 24, 8), (32, 10, 9), (33, 2, 10), (34, -2, 11)],
    # mid-right connecting wall
    [(22, 36, 2), (22, 20, 3), (23, 8, 4), (24, 1, 5), (25, -3, 6)],
]


def raster_vein(g, path, main=MAGMA, glow=LAVA, width=1):
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


def build_ruin(kind='mossy'):
    black = kind == 'black'
    pal = pal_black if black else pal_mossy
    step_id = DSTILE if black else OAKST
    g = Grid(-55, 60, -8, 110, -40, 30)

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
    cobweb_fill(g, x0, 8, z0, x1, y1, z1, 0.10)

    # ----- BIG ARCH in the left wing / lower left (reads as hillside arch on a slope) -----
    # A thick ruined wall containing the arch, slightly in front of the left turret.
    ax0, ax1, az, ay1, ad = ARCH['x0'] - 4, ARCH['x1'] + 2, LT['z1'] + 2, ARCH['y1'] + 4, ARCH['depth']
    # wall mass (shell) the arch is cut from
    shell_box(g, ax0, -2, az - ad, ax1, ay1 + 6, az + 2, pal, thick=2, floor=True, roof=False)
    jagged_top(g, ax0, az - ad, ax1, az + 2, ay1, ay1 + 10, pal)
    # the opening itself — tall rounded/stepped arch, >= 3 wide (painted is much wider)
    archway(g, ax0 + 3, ax1 - 3, 0, ay1, az + 2, pal, depth=ad + 2, face='+z')
    carve_box(g, ax0 + 4, 0, az - ad, ax1 - 4, ay1 - 2, az + 2)
    # cobwebs in the arch
    cobweb_fill(g, ax0 + 3, 2, az - 2, ax1 - 3, ay1, az + 2, 0.25)
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
    cobweb_fill(g, MID_X0, 1, MID_Z0, MID_X1, MID_Y, MID_Z1, 0.08)
    moss_streaks(g, MID_X0, 0, MID_Z0, MID_X1, MID_Y, MID_Z1, '+z', n=14)

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
    moss_streaks(g, cx0, 0, cz0, cx1, cy1, cz1, '+z', n=12)
    cobweb_fill(g, cx0, 10, cz0, cx1, cy1, cz1, 0.08)
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
    jagged_top(g, cx1 - 2, -4, RT['x0'] + 2, 4, 4, 28, pal)
    jagged_top(g, LT['x1'] - 2, 0, CT['x0'] + 2, 6, 4, 32, pal)
    # extra mid pinnacles (the painting's jagged mid-left spikes)
    for px, pz, ph in ((-18, 4, 52), (-10, 6, 46), (-2, 3, 50), (4, 5, 38)):
        jagged_top(g, px - 2, pz - 2, px + 2, pz + 2, 16, ph, pal)

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
    cobweb_fill(g, rx0, 4, rz0, rx1, ry1, rz1, 0.12)
    moss_streaks(g, rx0, 0, rz0, rx1, ry1, rz1, '+z', n=8)
    rubble_pile(g, mid, rz1 + 3, 0, pal, r=4, h=3)
    # ground corridor from center to right
    carve_box(g, cx1 - 1, 1, -1, rx0 + 2, 4, 1)
    g.mark('chest', x=mid, y=1, z=rz0 + 2, face='+z', loot='ruin')
    skel_figure(g, rx0 + 2, ry1 + 2, rz1)

    # ----- DEAD TREES (decorations at the painted left/right of the footprint) -----
    dead_tree(g, ax0 - 10, 0, az + 6, h=22)
    dead_tree(g, rx1 + 10, 0, rz1 + 4, h=20)
    # a couple of smaller ones mid-slope left
    dead_tree(g, ax0 - 6, 0, az - 4, h=14)

    # more cobwebs on the lower left (painting has several on the slope/arch)
    cobweb_fill(g, ax0 - 4, 0, az - 2, ax1 + 2, 16, az + 6, 0.18)

    # relief on front faces
    relief_face(g, cx0, 8, cz1, cx1, cy1, cz1, pal, '+z', 0.22)
    relief_face(g, x0, 4, z1, x1, y1, z1, pal, '+z', 0.2)

    if black:
        for path in BLACK_VEINS:
            raster_vein(g, path, main=MAGMA, glow=LAVA, width=1)
        # a small magma pool marker at the foot (foundations will carry it to ground)
        for dx in range(-3, 4):
            for dz in range(-2, 3):
                if dx * dx + dz * dz <= 8:
                    g.set(-28 + dx, -2, 16 + dz, MAGMA if dx * dx + dz * dz > 2 else LAVA)
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
    g.mark('camera', name='hero', x=12, y=20, z=145, lx=2, ly=42, lz=2, fov=50)
    g.mark('camera', name='hero-wide', x=10, y=14, z=80, lx=4, ly=40, lz=-6, fov=55)
    g.mark('kind', name=kind)
    return g
