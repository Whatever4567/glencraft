"""Clansman keep: v2 layout upscaled to the painting's brick pitch, fully explorable.

Local +z = gate (south). y=0 is the gate threshold / hall floor.
No stamped hillside, loch, or mountains — only the masonry, a short entry
path, and foundation skirt (the game fills down to natural ground).

Blueprint, measured against the official painting (low 3/4 from the right):
  - Gatehouse merloned front, stepped arch, portcullis ~9 bars, oak doors,
    tartan banners left and right of the arch (6x14 + fringe).
  - Upper clustered tower-house: left conical turret, mid-left pyramidal
    crow-step, mid-right slightly taller pyramidal crow-step, right conical
    turret. Tightly packed, shared walls, dense recessed windows, corbels.
  - Right curtain with a third banner, merloned round corner tower (no cone),
    then a lower merloned wall and a smaller far turret (as in the painting).
  - Interiors: gate passage, guard rooms, great hall, chambers, wall-walks,
    spiral stairs in every tower to the roofs. Corridors >= 3 wide, doors >= 2.
"""
from ids import *
from vox import *
import math

# --- measured / upscaled constants (v2 layout * 3, openings near painted size) ---
S = 3

# Gatehouse: v2 box(-7,F,5, 7,F+15,9) → *3
GH_X0, GH_X1 = -7 * S, 7 * S          # -21 .. 21
GH_Z0, GH_Z1 = 5 * S, 9 * S           # 15 .. 27
GH_Y1 = 15 * S                         # 45  merlon deck at 45
# Arch: a dominant stepped hood on the gatehouse (painting: ~1/3 of the
# gatehouse width, most of its height, heavy crow-step surround).
ARCH_X0, ARCH_X1 = -7, 7
ARCH_Y1 = 24
ARCH_DEPTH = 8
# Banners: painted ~6 wide x 14 cloth + 2 fringe, not 3x
BAN_W, BAN_H = 6, 14

# Core keep behind the gatehouse: v2 (-8..8, -5..5)
CORE_X0, CORE_X1 = -8 * S, 8 * S      # -24 .. 24
CORE_Z0, CORE_Z1 = -5 * S, 5 * S      # -15 .. 15

# Towers (centers, radii, tops) from v2 * 3
# Left cone cyl(-7, 2, r=3) to F+20, cone 10
# Pulled outward/forward of the core so the four-spire cluster reads like the painting.
LC = dict(cx=-8 * S - 4, cz=4 * S, r=3 * S + 1, y1=24 * S, cone=20)  # cx=-28, cz=12, r=10, y1=72, tip 92
# Mid-left pyramid at (-3,-2), wall to F+24, pyramid 10
ML = dict(cx=-3 * S, cz=0, half=3 * S + 1, y1=28 * S, pyr=22)         # half=10, cz=0 (more forward), y1=84, tip 106
# Mid-right pyramid at (4,-3), wall to F+26, pyramid 10
MR = dict(cx=4 * S, cz=-3 * S, half=3 * S, y1=26 * S, pyr=20)        # y1=78, tip 98
# Right cone
RC = dict(cx=8 * S + 4, cz=3 * S, r=3 * S + 1, y1=25 * S, cone=20)  # cx=28, cz=9, r=10, y1=75, tip 95
# Corner merloned tower cyl(13, 6, r=4) to F+17
CT = dict(cx=16 * S, cz=7 * S, r=4 * S, y1=17 * S)                   # cx=48, r=12, y1=51 — clear of the curtain banner
# Right curtain v2 box(8,F,6, 11,F+15,9)
CU_X0, CU_X1 = 8 * S, 14 * S         # 24 .. 42  (long merloned curtain for the third banner)
CU_Z0, CU_Z1 = 6 * S, 9 * S          # 18 .. 27
# Far-right lower wall + small turret (visible in the painting, missing in v2)
FAR_X0, FAR_X1 = CT['cx'] + CT['r'] - 1, CT['cx'] + CT['r'] + 18     # ~50 .. 69
FAR_Z0, FAR_Z1 = 8, 22
FAR_Y1 = 12 * S                       # 36, lower than the corner tower
FT = dict(cx=FAR_X1 - 4, cz=15, r=5, y1=FAR_Y1)

# Hall floors
HALL_Y1 = 12          # great hall ceiling (12 high — tall at player scale)
L2_Y = 14             # chamber floor
L3_Y = 28
L4_Y = 40
# Wall-walk on the gatehouse
WW_Y = GH_Y1

# Sampled toward the painting: red field, dark green windowpane, thin gold, dark fringe.
TARTAN = [
    'RGRRRG',
    'GGKGGG',
    'RGRRRG',
    'RGRRRG',
    'RGRRRG',
    'GYKYYG',
    'RGRRRG',
    'RGRRRG',
    'GGKGGG',
    'RGRRRG',
    'RGRRRG',
    'RGRRRG',
    'GYKYYG',
    'RFRRRF',
    'RFRRRF',
]
TMAP = dict(R=WOOLRED, G=WOOLGREEN, Y=WOOLYELLOW, K=SLATE, F=WOOLRED)


def pal(x, y, z):
    return stone_mix(x, y, z)


def slate_pal(x, y, z):
    return SLATE if rnd(x, y, z, 5) < 0.88 else STONEBRICK


def plank_pal(x, y, z):
    return PLANKS if rnd(x, y, z, 3) < 0.85 else STONEBRICK


def banner(g, x, y, z, face='+z'):
    """Hang a tartan banner; (x,y,z) is the top-left of the cloth on the wall face."""
    dx, dz = {'+z': (0, 1), '-z': (0, -1), '+x': (1, 0), '-x': (-1, 0)}[face]
    wx, wz = (1, 0) if dz else (0, 1)
    # rod
    for i in range(BAN_W):
        g.set(x + wx * i, y + 1, z + wz * i + dz, FENCE)
        g.set(x + wx * i, y + 1, z + wz * i, FENCE)
    rows = TARTAN
    for j, row in enumerate(rows):
        for i, ch in enumerate(row[:BAN_W]):
            bid = TMAP.get(ch, WOOLRED)
            g.set(x + wx * i + dx, y - j, z + wz * i + dz, bid)
    g.mark('banner', x=x, y=y, z=z, face=face)


def window_grid(g, x0, y0, z, x1, y1, pal, face='+z', ww=2, hh=3, px=6, py=7, recess=1):
    """Regular recessed windows across a facade."""
    x0, x1 = ord2(x0, x1); y0, y1 = ord2(y0, y1)
    x = x0 + 3
    while x + ww <= x1 - 2:
        y = y0 + 3
        while y + hh <= y1 - 2:
            # skip if this would punch a door zone — still ok, walls are thick
            window(g, x, y, z, pal, face=face, w=ww, h=hh, recess=recess, bars=False)
            y += py
        x += px


def build_clansman():
    # generous AABB
    g = Grid(-55, 90, -6, 130, -40, 50)

    # ========== ENTRY PATH (short, inside the footprint — not a stamped isle) ==========
    for z in range(GH_Z1 + 1, GH_Z1 + 8):
        for x in range(-4, 5):
            g.set(x, 0, z, STONEBRICK if (x + z) % 3 else COBBLE)

    # ========== GATEHOUSE ==========
    # 2-thick shell, merlon deck at GH_Y1
    shell_box(g, GH_X0, 0, GH_Z0, GH_X1, GH_Y1, GH_Z1, pal, thick=2, floor=True, roof=True)
    # thicken the front (z=GH_Z1) to 3 for the arch surround
    fill_box(g, GH_X0, 0, GH_Z1 - 2, GH_X1, GH_Y1, GH_Z1, pal)

    # Gate passage: 5 wide (>=3), 5 high, through the gatehouse into the hall
    PASS_W = 5
    PASS_H = 5
    carve_box(g, ARCH_X0 + 1, 1, GH_Z0, ARCH_X1 - 1, ARCH_Y1, GH_Z1)
    # floor of the passage stays
    floor_box(g, -2, GH_Z0, 2, GH_Z1 + 1, 0, lambda x, y, z: PLANKS if abs(x) < 2 else STONEBRICK)

    # Crow-step arch surround in the SAME grey stone as the wall (not a
    # dark lintel). Steps rise one course and step out one block, 5 rings,
    # proud by at most 2, framing the opening the way the painting does.
    archway(g, ARCH_X0, ARCH_X1, 1, ARCH_Y1, GH_Z1, pal, depth=ARCH_DEPTH, face='+z')
    carve_box(g, ARCH_X0 + 1, 1, GH_Z1 - ARCH_DEPTH, ARCH_X1 - 1, ARCH_Y1, GH_Z1)
    spring = ARCH_Y1 - 10
    for s in range(0, 5):
        xx0, xx1 = ARCH_X0 - 1 - s, ARCH_X1 + 1 + s
        lintel = ARCH_Y1 + s
        for x in range(xx0, xx1 + 1):
            g.set(x, lintel, GH_Z1, pal(x, lintel, GH_Z1))
            if s < 3:
                g.set(x, lintel, GH_Z1 + 1, pal(x, lintel, GH_Z1 + 1))
        for y in range(max(1, spring + s * 2), lintel):
            g.set(xx0, y, GH_Z1, pal(xx0, y, GH_Z1))
            g.set(xx1, y, GH_Z1, pal(xx1, y, GH_Z1))
            if s < 2:
                g.set(xx0, y, GH_Z1 + 1, pal(xx0, y, GH_Z1 + 1))
                g.set(xx1, y, GH_Z1 + 1, pal(xx1, y, GH_Z1 + 1))
    # More crow-step rings and a pointed (not rectangular) opening, same grey stone.
    for s in range(5, 8):
        xx0, xx1 = ARCH_X0 - 1 - s, ARCH_X1 + 1 + s
        lintel = ARCH_Y1 + s
        for x in range(xx0, xx1 + 1):
            g.set(x, lintel, GH_Z1, pal(x, lintel, GH_Z1))
        for y in range(max(1, spring + s * 2), lintel):
            g.set(xx0, y, GH_Z1, pal(xx0, y, GH_Z1))
            g.set(xx1, y, GH_Z1, pal(xx1, y, GH_Z1))
    # inward crow-steps that close to a point at the crown
    for s in range(1, 9):
        for y in range(ARCH_Y1 - 2 * s, ARCH_Y1 + 1 + s // 2):
            g.set(ARCH_X0 + s, y, GH_Z1, pal(ARCH_X0 + s, y, GH_Z1))
            g.set(ARCH_X1 - s, y, GH_Z1, pal(ARCH_X1 - s, y, GH_Z1))
            if s < 5:
                g.set(ARCH_X0 + s, y, GH_Z1 + 1, pal(ARCH_X0 + s, y, GH_Z1 + 1))
                g.set(ARCH_X1 - s, y, GH_Z1 + 1, pal(ARCH_X1 - s, y, GH_Z1 + 1))
    # punch a pointed opening: full width low, tapering as y approaches the crown
    for y in range(1, ARCH_Y1 + 3):
        taper = 0 if y < ARCH_Y1 - 11 else (y - (ARCH_Y1 - 11))
        xa0, xa1 = ARCH_X0 + 1 + taper, ARCH_X1 - 1 - taper
        if xa0 > xa1:
            continue
        for x in range(xa0, xa1 + 1):
            for z in range(GH_Z1 - ARCH_DEPTH, GH_Z1 + 2):
                # keep the stepped hood itself (the outer +z face at/above the lintel)
                if z >= GH_Z1 and y >= ARCH_Y1 + (x - (ARCH_X0 + ARCH_X1) // 2) * 0:
                    # still carve the interior of the opening on the wall face
                    if y < ARCH_Y1 + 2 - taper:
                        g.set0(x, y, z)
                else:
                    g.set0(x, y, z)

    # Portcullis just inside the arch
    portcullis(g, ARCH_X0 + 1, ARCH_X1 - 1, 2, ARCH_Y1 - 2, GH_Z1 - 1)

    # Double oak doors behind the portcullis (2 tall, in a 3-high opening, 3+ wide)
    door_opening(g, 0, 1, GH_Z1 - 4, face='+z', w=3, h=3)
    # kit will place T.DOOR; also put planks as a visible wooden gate leaf in the reveal
    for x in (-1, 0, 1):
        g.set(x, 1, GH_Z1 - 3, PLANKS)
        g.set(x, 2, GH_Z1 - 3, PLANKS)
    # punch a 1-block view through the center so the hall light reads like the painting
    g.set0(0, 1, GH_Z1 - 3)
    g.set0(0, 2, GH_Z1 - 3)

    # Guard rooms left and right of the passage
    # Left guard: x GH_X0+2 .. -5, z GH_Z0+2 .. GH_Z1-3, y 1..8
    carve_box(g, GH_X0 + 3, 1, GH_Z0 + 2, -5, 8, GH_Z1 - 3)
    floor_box(g, GH_X0 + 3, GH_Z0 + 2, -5, GH_Z1 - 3, 1, plank_pal)
    door_opening(g, -4, 1, (GH_Z0 + GH_Z1) // 2, face='+x', w=3, h=3)
    g.mark('chest', x=GH_X0 + 5, y=2, z=GH_Z0 + 4, face='+x', loot='guard')
    g.mark('garrison', x=GH_X0 + 7, y=2, z=(GH_Z0 + GH_Z1) // 2, role='guard')

    # Right guard
    carve_box(g, 5, 1, GH_Z0 + 2, GH_X1 - 3, 8, GH_Z1 - 3)
    floor_box(g, 5, GH_Z0 + 2, GH_X1 - 3, GH_Z1 - 3, 1, plank_pal)
    door_opening(g, 4, 1, (GH_Z0 + GH_Z1) // 2, face='-x', w=3, h=3)
    g.mark('chest', x=GH_X1 - 5, y=2, z=GH_Z0 + 4, face='-x', loot='guard')

    # Stairs from right guard up to the gatehouse wall-walk
    straight_stair(g, GH_X1 - 6, 1, GH_Z0 + 3, WW_Y - 1, pal, step=STST, face='-z', width=3)

    # Upper gatehouse floor (over the passage) — murder-hole room
    floor_box(g, GH_X0 + 2, GH_Z0 + 2, GH_X1 - 2, GH_Z1 - 2, 9, pal)
    carve_box(g, GH_X0 + 3, 10, GH_Z0 + 2, GH_X1 - 3, WW_Y - 1, GH_Z1 - 3)
    # murder holes over the passage
    for x in (-1, 1):
        g.set0(x, 9, GH_Z1 - 5)
        g.set0(x, 9, GH_Z1 - 7)

    # Wall-walk on the gatehouse roof
    wall_walk(g, GH_X0, GH_Z0, GH_X1, GH_Z1, WW_Y, pal, thick_out=2, walk=3, merlon_ht=2, pitch=2)
    corbel_wall(g, GH_X0, GH_Z0, GH_X1, GH_Z1, WW_Y - 1, pal, '+z', every=2)

    # Lower-left merloned wing (the painting's crenellated left end, lower than the keep).
    # Extends left of the gatehouse; the tall left turret rises behind it.
    LW_X0, LW_X1 = GH_X0 - 16, GH_X0 + 1
    LW_Z0, LW_Z1 = GH_Z1 - 8, GH_Z1
    LW_Y = 32
    shell_box(g, LW_X0, 0, LW_Z0, LW_X1, LW_Y, LW_Z1, pal, thick=2, floor=True, roof=True)
    wall_walk(g, LW_X0, LW_Z0, LW_X1, LW_Z1, LW_Y, pal, walk=3, merlon_ht=2, pitch=2)
    corbel_wall(g, LW_X0, LW_Z0, LW_X1, LW_Z1, LW_Y - 1, pal, '+z', every=2)
    # merloned round end bartizan
    shell_cyl(g, LW_X0 + 1, (LW_Z0 + LW_Z1) // 2, 5, 0, LW_Y + 3, pal, thick=2, floor=True, roof=True)
    merlon_ring(g, LW_X0 + 1, (LW_Z0 + LW_Z1) // 2, 5, LW_Y + 3, pal, pitch=2, ht=2)
    corbel_ring(g, LW_X0 + 1, (LW_Z0 + LW_Z1) // 2, 5, LW_Y + 2, pal, every=2)
    # walkway through to the gatehouse wall-walk
    carve_box(g, LW_X1 - 1, LW_Y + 1, (LW_Z0 + LW_Z1) // 2 - 1, GH_X0 + 2, LW_Y + 3, (LW_Z0 + LW_Z1) // 2 + 1)

    # Arrow slits / small windows on the gatehouse front, above the arch and on the piers
    slit(g, -14, 28, GH_Z1, pal, face='+z', h=3)
    slit(g, -10, 22, GH_Z1, pal, face='+z', h=3)
    slit(g, 10, 22, GH_Z1, pal, face='+z', h=3)
    slit(g, 14, 28, GH_Z1, pal, face='+z', h=3)
    slit(g, 0, 34, GH_Z1, pal, face='+z', h=3)
    # mirrored on the back
    slit(g, -14, 28, GH_Z0, pal, face='-z', h=3)
    slit(g, 14, 28, GH_Z0, pal, face='-z', h=3)

    # Two large tartan banners flanking the arch (hang beside the opening, not above it)
    banner(g, ARCH_X0 - 1 - BAN_W, ARCH_Y1 + 8, GH_Z1, face='+z')
    banner(g, ARCH_X1 + 2, ARCH_Y1 + 8, GH_Z1, face='+z')

    # Buttresses on the gatehouse front piers
    buttress(g, GH_X0 + 1, GH_Z1, 0, 24, pal, dx=0, dz=1, depth=3, width=3)
    buttress(g, GH_X1 - 3, GH_Z1, 0, 24, pal, dx=0, dz=1, depth=3, width=3)
    relief_face(g, GH_X0, 0, GH_Z1, GH_X1, WW_Y, GH_Z1, pal, '+z', 0.08)

    # ========== MAIN KEEP (core) + GREAT HALL ==========
    # Shell up through the upper floors; hall is 12 high in the center
    shell_box(g, CORE_X0, 0, CORE_Z0, CORE_X1, ML['y1'], CORE_Z1, pal, thick=2, floor=True, roof=False)
    # Extra stories filled as floors, not solid
    for fy in (0, L2_Y, L3_Y, L4_Y, WW_Y):
        if fy <= ML['y1']:
            floor_box(g, CORE_X0 + 2, CORE_Z0 + 2, CORE_X1 - 2, CORE_Z1 - 2, fy, pal if fy else plank_pal)

    # Great hall: carve the volume, leave a 3-wide gallery later
    carve_box(g, CORE_X0 + 3, 1, CORE_Z0 + 3, CORE_X1 - 3, HALL_Y1, CORE_Z1 - 2)
    floor_box(g, CORE_X0 + 3, CORE_Z0 + 3, CORE_X1 - 3, CORE_Z1 - 2, 0, plank_pal)
    # open the hall into the gate passage
    carve_box(g, -2, 1, CORE_Z1 - 2, 2, PASS_H, GH_Z0 + 1)
    # pillars down the hall (every 8, not blocking the 3-wide center aisle)
    for x in (-12, 12):
        for z in range(CORE_Z0 + 6, CORE_Z1 - 4, 8):
            fill_box(g, x, 1, z, x, HALL_Y1, z, pal)
            # capital
            fill_box(g, x - 1, HALL_Y1 - 1, z - 1, x + 1, HALL_Y1, z + 1, pal)
    # high table at the far (north / -z) end
    fill_box(g, -6, 1, CORE_Z0 + 4, 6, 2, CORE_Z0 + 6, PLANKS)
    g.mark('chest', x=0, y=1, z=CORE_Z0 + 5, face='+z', loot='hall')
    g.mark('garrison', x=-8, y=1, z=0, role='hall')
    g.mark('garrison', x=8, y=1, z=0, role='hall')
    # lamps / warm light visible through the gate (torches)
    g.mark('lamp', x=-3, y=6, z=CORE_Z1 - 4)
    g.mark('lamp', x=3, y=6, z=CORE_Z1 - 4)
    g.mark('lamp', x=0, y=10, z=0)
    # interior banners on the hall sides
    banner(g, -18, 10, CORE_Z1 - 3, face='+z')
    # actually hang on +x/-x walls
    # skip if face is awkward; a couple on the +z inner wall either side of the door
    banner(g, -16, 11, CORE_Z1 - 2, face='+z')
    banner(g, 10, 11, CORE_Z1 - 2, face='+z')

    # Treasury / side chamber off the hall (west / -x)
    carve_box(g, CORE_X0 + 3, 1, -6, CORE_X0 + 8, 6, 6)
    door_opening(g, CORE_X0 + 8, 1, 0, face='+x', w=3, h=3)
    g.mark('chest', x=CORE_X0 + 4, y=1, z=0, face='+x', loot='treasury')
    g.mark('camera', name='hall', x=0, y=4, z=12, lx=0, ly=6, lz=-8, fov=60)

    # Upper chambers (floor at L2_Y) — corridor 3 wide down the center, rooms off it
    # The hall ceiling is at 12, floor of L2 is 14: 1-block structure + floor
    floor_box(g, CORE_X0 + 2, CORE_Z0 + 2, CORE_X1 - 2, CORE_Z1 - 2, L2_Y, pal)
    carve_box(g, CORE_X0 + 3, L2_Y + 1, CORE_Z0 + 3, CORE_X1 - 3, L2_Y + 10, CORE_Z1 - 3)
    # central corridor along z, 3 wide
    # rooms: split at x=0 with a 2-thick wall, door through
    fill_box(g, -1, L2_Y + 1, CORE_Z0 + 3, 1, L2_Y + 10, CORE_Z1 - 3, pal)
    door_opening(g, 0, L2_Y + 1, 0, face='+x', w=3, h=3)
    # side rooms already open; add chests and beds (marked)
    g.mark('chest', x=CORE_X0 + 6, y=L2_Y + 1, z=-6, face='+x', loot='chamber')
    g.mark('chest', x=CORE_X1 - 6, y=L2_Y + 1, z=-6, face='-x', loot='chamber')
    g.mark('bed', x=CORE_X0 + 6, y=L2_Y + 1, z=6, face='+x')
    g.mark('bed', x=CORE_X1 - 6, y=L2_Y + 1, z=6, face='-x')

    # L3 chambers similarly
    floor_box(g, CORE_X0 + 2, CORE_Z0 + 2, CORE_X1 - 2, CORE_Z1 - 2, L3_Y, pal)
    carve_box(g, CORE_X0 + 3, L3_Y + 1, CORE_Z0 + 3, CORE_X1 - 3, min(L3_Y + 10, L4_Y - 1), CORE_Z1 - 3)
    g.mark('chest', x=0, y=L3_Y + 1, z=CORE_Z0 + 5, face='+z', loot='chamber')

    # L4 / attic access toward the roofs
    floor_box(g, CORE_X0 + 2, CORE_Z0 + 2, CORE_X1 - 2, CORE_Z1 - 2, L4_Y, pal)
    carve_box(g, CORE_X0 + 3, L4_Y + 1, CORE_Z0 + 3, CORE_X1 - 3, L4_Y + 8, CORE_Z1 - 3)

    # Straight stair core: hall → L2 → L3 → L4 along the east inner wall
    # A 3-wide stair run in a well at x=CORE_X1-6
    # hall to L2
    straight_stair(g, CORE_X1 - 7, 1, CORE_Z0 + 5, L2_Y - 1, pal, step=STST, face='+z', width=3)
    # L2 to L3
    straight_stair(g, CORE_X1 - 7, L2_Y + 1, 4, L3_Y - L2_Y - 1, pal, step=STST, face='-z', width=3)
    # L3 to L4
    straight_stair(g, CORE_X1 - 7, L3_Y + 1, CORE_Z0 + 5, L4_Y - L3_Y - 1, pal, step=STST, face='+z', width=3)

    # Windows on the keep faces (dense, like the parapet crop)
    # Front (+z) of the keep, above the gatehouse
    window_grid(g, CORE_X0 + 4, WW_Y + 3, CORE_Z1, CORE_X1 - 4, ML['y1'] - 4, pal, '+z', ww=2, hh=4, px=5, py=7, recess=2)
    window_grid(g, CORE_X0 + 4, 8, CORE_Z0, CORE_X1 - 4, ML['y1'] - 4, pal, '-z', ww=2, hh=4, px=5, py=7, recess=2)
    window_grid(g, CORE_X0, 8, CORE_Z0 + 4, CORE_X0, ML['y1'] - 4, pal, '-x', ww=2, hh=4, px=5, py=7, recess=2)
    window_grid(g, CORE_X1, 8, CORE_Z0 + 4, CORE_X1, 40, pal, '+x', ww=2, hh=4, px=5, py=7, recess=2)
    # corbel / string course under the upper-keep parapet and mid storey
    corbel_wall(g, CORE_X0, CORE_Z0, CORE_X1, CORE_Z1, WW_Y + 1, pal, '+z', every=2)
    corbel_wall(g, CORE_X0, CORE_Z0, CORE_X1, CORE_Z1, ML['y1'] - 1, pal, '+z', every=2)
    relief_face(g, CORE_X0, 8, CORE_Z1, CORE_X1, ML['y1'], CORE_Z1, pal, '+z', 0.08)

    # Keep parapet / wall-walk at mid-left wall height where the body ends, before the roofs
    # Walk around the core at y=ML['y1'] for the mid-left, but mid-right is taller —
    # put a walk at y=72 (ML y1) on the main body.
    wall_walk(g, CORE_X0, CORE_Z0, CORE_X1, CORE_Z1, ML['y1'], pal, walk=3, merlon_ht=2, pitch=2)
    g.mark('camera', name='wallwalk', x=0, y=ML['y1'] + 3, z=CORE_Z1 + 2, lx=0, ly=ML['y1'] + 2, lz=CORE_Z1 - 8, fov=70)

    # ========== FOUR UPPER TOWERS (clustered, shared with the core) ==========
    def tower_cyl(spec, cone_h, name):
        cx, cz, r, y1 = spec['cx'], spec['cz'], spec['r'], spec['y1']
        shell_cyl(g, cx, cz, r, 0, y1, pal, thick=2, floor=True, roof=True)
        # floors every 12
        for fy in range(0, y1, 12):
            fill_cyl_solid(g, cx, cz, r - 2, fy, fy, pal, r_inner=0)
            # punch a stair well later
        # spiral: inner col r=2, walk to r-2
        spiral_stair(g, cx, cz, 0, y1, 2, r - 2, pal, step=OAKST, ccw=True, well_col=True)
        # connect into the core at hall, L2, L3 with 3-wide corridors
        for fy, hh in ((1, 3), (L2_Y + 1, 3), (L3_Y + 1, 3)):
            if fy + hh < y1:
                # carve toward origin
                vx, vz = -1 if cx > 0 else (1 if cx < 0 else 0), -1 if cz > CORE_Z1 - 2 else (1 if cz < CORE_Z0 + 2 else 0)
                # open a 3-wide, 3-high passage from tower interior toward core
                for t in range(0, 8):
                    carve_box(g, cx - 1 + (0 if vz else vx * t), fy, cz - 1 + (0 if vx else vz * t),
                              cx + 1 + (0 if vz else vx * t), fy + 2, cz + 1 + (0 if vx else vz * t))
        # windows around the turret, two or three rings (as in the parapet crop)
        for y in (14, 26, 38, 50, y1 - 10):
            if 8 < y < y1 - 4:
                for ang, face in ((90, '+z'), (45, '+z'), (0, '+x'), (180, '-x'), (270, '-z')):
                    rad = math.radians(ang)
                    wx = int(round(cx + (r - 1) * math.cos(rad)))
                    wz = int(round(cz + (r - 1) * math.sin(rad)))
                    window(g, wx, y, wz, pal, face=face, w=2, h=3, recess=2)
        # slightly wider cap ring + corbel table so the turret reads as a bartizan
        shell_cyl(g, cx, cz, r + 1, y1 - 3, y1, pal, thick=2, floor=False, roof=True)
        corbel_ring(g, cx, cz, r + 1, y1 - 3, pal, every=1)
        corbel_ring(g, cx, cz, r, y1 - 1, pal, every=2)
        # merlons under the cone (a short battlement ring)
        merlon_ring(g, cx, cz, r, y1, pal, pitch=2, ht=2, jitter=False)
        # roof
        cone_roof(g, cx, cz, r + 0.6, y1 + 3, cone_h, slate_pal, thick=2)
        # roof walk / cap access: a small floor under the cone
        fill_cyl_solid(g, cx, cz, r - 3, y1, y1, pal)
        g.mark('camera', name=f'towerstair-{name}', x=cx + 3, y=20, z=cz + 3, lx=cx, ly=22, lz=cz, fov=70)
        g.mark('tower', name=name, cx=cx, cz=cz, y1=y1, r=r)

    tower_cyl(LC, LC['cone'], 'left-cone')
    tower_cyl(RC, RC['cone'], 'right-cone')

    def tower_sq(spec, name):
        cx, cz, half, y1, pyr = spec['cx'], spec['cz'], spec['half'], spec['y1'], spec['pyr']
        x0, x1, z0, z1 = cx - half, cx + half, cz - half, cz + half
        shell_box(g, x0, 0, z0, x1, y1, z1, pal, thick=2, floor=True, roof=True)
        for fy in range(0, y1, 12):
            floor_box(g, x0 + 2, z0 + 2, x1 - 2, z1 - 2, fy, pal)
        spiral_stair(g, cx, cz, 0, y1, 2, half - 2, pal, step=OAKST, ccw=True, well_col=True)
        for y in (16, 32, 48, y1 - 12):
            if 8 < y < y1 - 4:
                window(g, cx - 1, y, z1, pal, '+z', w=2, h=3, recess=1)
                window(g, cx - 1, y, z0, pal, '-z', w=2, h=3, recess=1)
                window(g, x0, y, cz - 1, pal, '-x', w=2, h=3, recess=1)
                window(g, x1, y, cz - 1, pal, '+x', w=2, h=3, recess=1)
        corbel_wall(g, x0, z0, x1, z1, y1 - 1, pal, '+z', every=2)
        merlon_rect(g, x0, z0, x1, z1, y1, pal, pitch=2, ht=2)
        pyramid_roof(g, cx, cz, half + 1, y1 + 3, pyr, slate_pal, thick=2)
        g.mark('tower', name=name, cx=cx, cz=cz, y1=y1, half=half)
        g.mark('camera', name=f'towerstair-{name}', x=cx + 3, y=24, z=cz + 3, lx=cx, ly=26, lz=cz, fov=70)

    tower_sq(ML, 'mid-left')
    tower_sq(MR, 'mid-right')

    # ========== RIGHT CURTAIN + CORNER TOWER + FAR WALL ==========
    shell_box(g, CU_X0, 0, CU_Z0, CU_X1, GH_Y1, CU_Z1, pal, thick=2, floor=True, roof=True)
    # 3-wide wall-walk on the curtain, continuous with the gatehouse
    wall_walk(g, CU_X0, CU_Z0, CU_X1, CU_Z1, WW_Y, pal, walk=3, merlon_ht=2, pitch=2)
    carve_box(g, CU_X0, WW_Y + 1, (CU_Z0 + CU_Z1) // 2 - 1, CU_X0 + 2, WW_Y + 3, (CU_Z0 + CU_Z1) // 2 + 1)
    # third tartan banner on the curtain face
    banner(g, CU_X0 + 4, WW_Y - 3, CU_Z1, face='+z')
    # interior corridor inside the curtain (3 wide) at ground, linking keep to corner
    carve_box(g, CU_X0 + 2, 1, CU_Z0 + 2, CU_X1 - 1, 4, CU_Z1 - 2)
    door_opening(g, CU_X0, 1, (CU_Z0 + CU_Z1) // 2, face='-x', w=3, h=3)

    # Corner round merloned tower (no cone) — as in c_corner.jpg
    cx, cz, r, y1 = CT['cx'], CT['cz'], CT['r'], CT['y1']
    shell_cyl(g, cx, cz, r, 0, y1, pal, thick=2, floor=True, roof=True)
    for fy in range(0, y1, 12):
        fill_cyl_solid(g, cx, cz, r - 2, fy, fy, pal, r_inner=0)
    spiral_stair(g, cx, cz, 0, y1, 2, r - 2, pal, step=OAKST, ccw=True, well_col=True)
    # connect curtain walk and ground corridor
    carve_box(g, CU_X1 - 1, 1, cz - 1, cx - 2, 3, cz + 1)
    carve_box(g, CU_X1 - 1, WW_Y + 1, cz - 1, cx - 2, WW_Y + 3, cz + 1)
    merlon_ring(g, cx, cz, r, y1, pal, pitch=2, ht=2, jitter=False)
    corbel_ring(g, cx, cz, r, y1 - 1, pal, every=2)
    # a couple of small recesses, not big windows (the painting's corner tower is mostly blank stone)
    slit(g, cx, 16, cz + r - 1, pal, '+z', h=3)
    slit(g, cx + r - 1, 22, cz, pal, '+x', h=3)
    slit(g, cx, 28, cz + r - 1, pal, '+z', h=3)
    relief_face(g, cx - r, 0, cz + r, cx + r, y1, cz + r, pal, '+z', 0.08)
    g.mark('tower', name='corner', cx=cx, cz=cz, y1=y1, r=r)
    g.mark('chest', x=cx - 2, y=1, z=cz, face='+x', loot='tower')

    # Far-right lower merloned wall + small turret (painting's far right)
    shell_box(g, FAR_X0, 0, FAR_Z0, FAR_X1, FAR_Y1, FAR_Z1, pal, thick=2, floor=True, roof=True)
    wall_walk(g, FAR_X0, FAR_Z0, FAR_X1, FAR_Z1, FAR_Y1, pal, walk=3, merlon_ht=2, pitch=2)
    # connect to corner tower at mid-height and ground
    carve_box(g, cx + 2, 1, cz - 1, FAR_X0 + 1, 3, cz + 1)
    shell_cyl(g, FT['cx'], FT['cz'], FT['r'], 0, FT['y1'], pal, thick=2, floor=True, roof=True)
    merlon_ring(g, FT['cx'], FT['cz'], FT['r'], FT['y1'], pal, pitch=2, ht=2)
    spiral_stair(g, FT['cx'], FT['cz'], 0, FT['y1'], 1, FT['r'] - 2, pal, step=OAKST, ccw=True, well_col=True)

    # ========== FOUNDATION SKIRT (short; game extends down to natural ground) ==========
    # A 1-2 block stone plinth under walls so the stamp has something to hang foundations from.
    xmin, ymin, zmin, xmax, ymax, zmax = g.bounds_used()
    # walk columns that have masonry at y=0..2 and add y=-1,-2 stone
    for x in range(xmin, xmax + 1):
        for z in range(zmin, zmax + 1):
            if g.get(x, 0, z) or g.get(x, 1, z):
                if not g.get(x, 0, z):
                    g.set(x, 0, z, pal(x, 0, z))
                g.set(x, -1, z, pal(x, -1, z))
                g.set(x, -2, z, COBBLE)

    # Exterior cameras matching the painting (low, right of the gate, looking slightly up)

    # Extra corner bartizans on the gatehouse front (painting has round turrets
    # sitting on the crenellations, not just the four big roofs).
    for bx, bz, bh, ch in (
        (GH_X0 + 2, GH_Z1 - 1, WW_Y + 8, 8),
        (GH_X1 - 2, GH_Z1 - 1, WW_Y + 8, 8),
        (CORE_X0 + 2, CORE_Z1, ML['y1'] + 6, 7),
        (CORE_X1 - 2, CORE_Z1, ML['y1'] + 6, 7),
    ):
        shell_cyl(g, bx, bz, 3, max(0, (WW_Y if bz >= GH_Z1 - 2 else ML['y1']) - 8), bh, pal, thick=2, floor=True, roof=True)
        cone_roof(g, bx, bz, 4, bh, ch, lambda x, y, z: SLATE, thick=2)
        # a couple of slit windows
        window(g, bx, bh - 5, bz + 3, pal, '+z', w=1, h=2, recess=1)

    # Forecourt: patchy stone path and purple heather in front of the gate, plus
    # a few pines at the flanks — decorations in the model so they travel with it.
    # stone path down the centre; scattered heather on the verges (not a solid carpet)
    for x in range(-26, 30):
        for z in range(GH_Z1 + 1, GH_Z1 + 16):
            u = rnd(x, 0, z, 51)
            on_path = abs(x) <= 4
            if on_path or u < 0.28:
                g.set(x, 0, z, STONE if u < 0.16 or on_path else COBBLE)
            if (not on_path) and u < 0.22:
                if not g.get(x, 0, z):
                    g.set(x, 0, z, DIRT)
                g.set(x, 1, z, HEATHER)
    # denser heather beds left and right of the path
    for x, z0 in ((-22, GH_Z1 + 3), (22, GH_Z1 + 3), (-16, GH_Z1 + 8), (18, GH_Z1 + 9)):
        for dx in range(-4, 5):
            for dz in range(-3, 5):
                if dx * dx + dz * dz <= 16 and rnd(x + dx, 1, z0 + dz, 53) < 0.7:
                    if not g.get(x + dx, 0, z0 + dz):
                        g.set(x + dx, 0, z0 + dz, DIRT)
                    g.set(x + dx, 1, z0 + dz, HEATHER)
    def _pine(px, pz, h=8):
        for k in range(h):
            g.set(px, 1 + k, pz, PINE if k < h - 2 else NEED)
            if k > h - 5:
                for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    g.set(px + dx, 1 + k, pz + dz, NEED)
    _pine(-30, GH_Z1 + 10, 11)
    _pine(32, GH_Z1 + 8, 9)
    _pine(-36, GH_Z1 + 4, 8)
    _pine(40, GH_Z1 + 12, 10)

    g.mark('camera', name='hero', x=32, y=22, z=125, lx=6, ly=44, lz=8, fov=50)
    g.mark('camera', name='hero-wide', x=22, y=14, z=72, lx=6, ly=34, lz=6, fov=55)
    g.mark('gold', x=14 * S, y=0, z=-16 * S)  # v2 placeGold offset, will snap to solidTop in game

    return g
