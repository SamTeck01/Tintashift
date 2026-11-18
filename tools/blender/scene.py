"""TINTAShift hero scene in Blender (Cycles, CPU): scanned hand + modelled aluminium Shifter + almond Smart Tips.

Usage (pip install bpy; Python 3.13):
  python3 tools/blender/scene.py --shot wide  --aspect desktop --set si001 --out out.png
  python3 tools/blender/scene.py --shot close --aspect phone   --out out.png
  python3 tools/blender/scene.py --shot move  --frames 1-48 --out frames/####.png   (wide -> close)
  add --maps to also write <out>-id.png (R keep: hand/device/decor, G nail, B 0) for the hero shader,
  --blend file.blend to save the scene, --samples N (default 96).

Nails are pure green #00FF00 (the key colour tools/build_hero.py repaints), on a plain white table,
so a render drops in as docs/source-images/alu-wide-<set>.png / alu-close-<set>.png.
Hand: "Female Hand" by yanix (Sketchfab), CC-BY 4.0 -- credited on the site.
"""
import argparse, math, os, sys
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
HAND = os.path.join(ROOT, "docs/3d/female-hand-yanix.glb")
FONT_B = os.path.join(ROOT, "docs/3d/fonts/Inter-Bold.otf")
FONT_L = os.path.join(ROOT, "docs/3d/fonts/Inter-Light.otf")
CM = 0.01

ap = argparse.ArgumentParser()
ap.add_argument("--shot", default="wide", choices=["wide", "close", "move"])
ap.add_argument("--aspect", default="desktop", choices=["desktop", "phone"])
ap.add_argument("--set", default="si001")
ap.add_argument("--samples", type=int, default=96)
ap.add_argument("--scale", type=float, default=1.0, help="resolution multiplier")
ap.add_argument("--frames", default="1-48")
ap.add_argument("--out", default="/tmp/tinta.png")
ap.add_argument("--maps", action="store_true")
ap.add_argument("--blend", default="")
A = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])

bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene
COL = S.collection

# ---------------------------------------------------------------- materials
def mat(name, **kw):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    for k, v in kw.items(): p.inputs[k].default_value = v
    return m, p

def link(m, a, b): m.node_tree.links.new(a, b)

def skin_material():
    m, p = mat("skin", **{"Base Color": (0.86, 0.64, 0.54, 1), "Roughness": 0.48, "Subsurface Weight": 1.0,
                          "Subsurface Radius": (1.0, 0.35, 0.2), "Subsurface Scale": 0.004,
                          "Specular IOR Level": 0.45, "Sheen Weight": 0.15, "Sheen Roughness": 0.4})
    n = m.node_tree.nodes
    ao = n.new("ShaderNodeAmbientOcclusion"); ao.inputs["Distance"].default_value = 0.012
    geo = n.new("ShaderNodeNewGeometry")
    pr = n.new("ShaderNodeMapRange"); link(m, geo.outputs["Pointiness"], pr.inputs[0])
    pr.inputs[1].default_value, pr.inputs[2].default_value = 0.5, 0.56          # convex: knuckles, tips
    noise = n.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 90; noise.inputs["Detail"].default_value = 6
    blot = n.new("ShaderNodeTexNoise"); blot.inputs["Scale"].default_value = 35
    base = n.new("ShaderNodeMix"); base.data_type = "RGBA"
    base.inputs[6].default_value = (0.87, 0.66, 0.56, 1); base.inputs[7].default_value = (0.84, 0.58, 0.50, 1)
    link(m, blot.outputs["Fac"], base.inputs[0])
    red = n.new("ShaderNodeMix"); red.data_type = "RGBA"
    link(m, base.outputs[2], red.inputs[6]); red.inputs[7].default_value = (0.82, 0.50, 0.45, 1)
    link(m, pr.outputs[0], red.inputs[0])
    cre = n.new("ShaderNodeMix"); cre.data_type = "RGBA"
    link(m, red.outputs[2], cre.inputs[6]); cre.inputs[7].default_value = (0.55, 0.30, 0.26, 1)
    inv = n.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1
    link(m, ao.outputs["AO"], inv.inputs[1]); link(m, inv.outputs[0], cre.inputs[0])
    link(m, cre.outputs[2], p.inputs["Base Color"])
    bump = n.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.08; bump.inputs["Distance"].default_value = 0.0002
    link(m, noise.outputs["Fac"], bump.inputs["Height"]); link(m, bump.outputs["Normal"], p.inputs["Normal"])
    return m

SKIN = skin_material()
ALU, alu_p = mat("aluminium", **{"Base Color": (0.80, 0.81, 0.82, 1), "Metallic": 1.0, "Roughness": 0.62,
                                  "Anisotropic": 0.0})
_n = ALU.node_tree.nodes
_nz = _n.new("ShaderNodeTexNoise"); _nz.inputs["Scale"].default_value = 2500
_bp = _n.new("ShaderNodeBump"); _bp.inputs["Strength"].default_value = 0.05
link(ALU, _nz.outputs["Fac"], _bp.inputs["Height"]); link(ALU, _bp.outputs["Normal"], alu_p.inputs["Normal"])
ENGRAVE, _ = mat("engrave", **{"Base Color": (0.30, 0.31, 0.33, 1), "Metallic": 1.0, "Roughness": 0.4})
BUTTON, _ = mat("button", **{"Base Color": (0.62, 0.63, 0.65, 1), "Roughness": 0.35, "Transmission Weight": 0.3})
HOLE, _ = mat("hole", **{"Base Color": (0.05, 0.05, 0.06, 1), "Roughness": 0.8})
RIM, _ = mat("rim", **{"Base Color": (0.92, 0.92, 0.91, 1), "Roughness": 0.35, "Subsurface Weight": 0.3})
NAIL, _ = mat("nail", **{"Base Color": (0.0, 1.0, 0.0, 1), "Roughness": 0.12, "Coat Weight": 1.0, "Coat Roughness": 0.03})
PINK, _ = mat("bow", **{"Base Color": (0.98, 0.70, 0.78, 1), "Roughness": 0.35, "Coat Weight": 0.6})
PEARL, _ = mat("pearl", **{"Base Color": (0.96, 0.95, 0.92, 1), "Roughness": 0.15, "Coat Weight": 1.0,
                           "Sheen Weight": 0.5, "Subsurface Weight": 0.3})
GOLD, _ = mat("gold", **{"Base Color": (1.0, 0.83, 0.55, 1), "Metallic": 1.0, "Roughness": 0.2})
SHELL, _ = mat("shell", **{"Base Color": (0.97, 0.93, 0.95, 1), "Roughness": 0.2, "Coat Weight": 1.0,
                           "Sheen Weight": 0.6, "Subsurface Weight": 0.4})
TABLE, _ = mat("table", **{"Base Color": (0.93, 0.93, 0.925, 1), "Roughness": 0.7})

def obj_from_bm(name, bm, material, index):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); COL.objects.link(o)
    me.materials.append(material); o.pass_index = index
    for f in me.polygons: f.use_smooth = True
    return o

# ---------------------------------------------------------------- hand
bpy.ops.import_scene.gltf(filepath=HAND)
parts = [o for o in bpy.data.objects if o.type == "MESH"]
for o in parts: o.data.materials.clear()
bpy.ops.object.select_all(action="DESELECT")
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
hand = bpy.context.object
mw = hand.matrix_world.copy(); hand.parent = None; hand.matrix_world = mw
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)  # bake glTF node transforms
for o in [o for o in bpy.data.objects if o.type == "EMPTY"]: bpy.data.objects.remove(o)
# scan axes: z = wrist->fingers, y = back of hand, x = thumb side (right hand). Map to world:
# fingers +X, back of hand +Z, and mirror so it is a LEFT hand (thumb on -Y, towards the camera) like the reference.
K = 0.175 / 10.24
M = Matrix(((0, 0, K), (-K, 0, 0), (0, K, 0)))
bm = bmesh.new(); bm.from_mesh(hand.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0005)
for v in bm.verts: v.co = M @ v.co
bmesh.ops.reverse_faces(bm, faces=bm.faces)          # the mirror flips winding
bm.normal_update()
xmin = min(v.co.x for v in bm.verts)
wr = np.array([tuple(v.co) for v in bm.verts if v.co.x < xmin + 0.008])
WRIST = dict(x=xmin, cy=(wr[:, 1].max() + wr[:, 1].min()) / 2, cz=(wr[:, 2].max() + wr[:, 2].min()) / 2,
             ry=(wr[:, 1].max() - wr[:, 1].min()) / 2, rz=(wr[:, 2].max() - wr[:, 2].min()) / 2)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x < xmin + 0.012], context="VERTS")   # scanned cuff edge
# forearm grown out of the open wrist loop: ring 0 is the scan's edge, later rings ease into a smooth ellipse
edge = [e for e in bm.edges if e.is_boundary]
loop = list({v for e in edge for v in e.verts})
cy = sum(v.co.y for v in loop) / len(loop); cz0 = sum(v.co.z for v in loop) / len(loop)
loop.sort(key=lambda v: math.atan2(v.co.z - cz0, v.co.y - cy))
x_e = sum(v.co.x for v in loop) / len(loop)
ry0 = (max(v.co.y for v in loop) - min(v.co.y for v in loop)) / 2
rz0 = (max(v.co.z for v in loop) - min(v.co.z for v in loop)) / 2
prev = loop; n = len(loop)
for k in range(1, 30):
    t = k / 29; dx = 0.004 * k + 0.00032 * k * k          # dense near the wrist
    blend = min(1.0, k / 6) ** 1.5; g = 1 + 0.15 * min(1.0, dx / 0.2)
    ring = []
    for v0 in loop:
        a_ = math.atan2(v0.co.z - cz0, v0.co.y - cy)
        ey, ez = cy + ry0 * g * math.cos(a_), cz0 - dx * 0.05 + rz0 * g * math.sin(a_) * (0.9 if math.sin(a_) < 0 else 1)
        ring.append(bm.verts.new((x_e - dx, v0.co.y * (1 - blend) + ey * blend, (v0.co.z - dx * 0.05) * (1 - blend) + ez * blend)))
    for j in range(n):
        try: bm.faces.new((prev[j], prev[(j + 1) % n], ring[(j + 1) % n], ring[j]))
        except ValueError: pass
    prev = ring
bm.faces.new(prev)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
zmin = min(v.co.z for v in bm.verts if v.co.x > 0.0)
for v in bm.verts: v.co.z -= zmin - 0.0004
bm.to_mesh(hand.data); bm.free()
hand.data.materials.append(SKIN); hand.pass_index = 1; hand.name = "hand"

def forearm():
    w = WRIST; dz = -(zmin - 0.0004); bm = bmesh.new(); rings = []; n = 48
    for k in range(26):
        t = k / 25; x = w["x"] + 0.032 - t * 0.28
        g = 1 + 0.16 * t ** 0.8; ramp = 0.86 + 0.14 * min(1.0, t / 0.12); ry, rz = w["ry"] * ramp * g, w["rz"] * 0.97 * ramp * (1 + 0.08 * t)
        cz = w["cz"] + dz - 0.004 * t
        cz = max(cz, rz + 0.0003)                                 # rests on the table
        rings.append([bm.verts.new((x, w["cy"] + ry * math.cos(2 * math.pi * j / n),
                                    cz + rz * math.sin(2 * math.pi * j / n) * (0.92 if math.sin(2 * math.pi * j / n) < 0 else 1)))
                      for j in range(n)])
    for a, b in zip(rings, rings[1:]):
        for j in range(n): bm.faces.new((a[j], a[(j + 1) % n], b[(j + 1) % n], b[j]))
    bm.faces.new(rings[-1]); bm.faces.new(list(reversed(rings[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = obj_from_bm("forearm", bm, SKIN, 1)
    sub = o.modifiers.new("s", "SUBSURF"); sub.levels = sub.render_levels = 1
    return o
for f in hand.data.polygons: f.use_smooth = True
bvh_bm = bmesh.new(); bvh_bm.from_mesh(hand.data); bvh = BVHTree.FromBMesh(bvh_bm)
V = np.array([v.co for v in hand.data.vertices])

def scan(p):  # scan-space point -> world
    return M @ Vector(p) + Vector((0, 0, -(zmin - 0.0004)))

# fingertips in scan space (found by taking the furthest vertex per finger), thumb..pinky
TIPS = {"thumb": (3.36, 0.53, 6.75), "index": (-0.13, 0.29, 10.24), "middle": (-2.0, 0.01, 10.14),
        "ring": (-3.54, -0.56, 9.09), "pinky": (-4.44, -1.0, 7.12)}
NAIL_W = {"thumb": 1.35, "index": 1.12, "middle": 1.18, "ring": 1.08, "pinky": 0.9}   # cm
NAIL_L = {"thumb": 2.3, "index": 2.2, "middle": 2.35, "ring": 2.15, "pinky": 1.75}      # cm, cuticle -> point

def finger_frame(tip):
    """Axis (towards the tip), back-of-finger normal, and the point on the back of the finger at the cuticle."""
    t = np.array(tip)
    near = V[np.linalg.norm(V - t, axis=1) < 1.2 * CM]
    ax = t - near.mean(0); ax /= np.linalg.norm(ax)
    for _ in range(4):                     # refine on this finger only: points near the line through the tip
        d = V - t; along = d @ ax; perp = np.linalg.norm(d - np.outer(along, ax), axis=1)
        sel = V[(along < 0) & (along > -3.5 * CM) & (perp < 0.9 * CM)]
        u, sv, vt = np.linalg.svd(sel - sel.mean(0)); ax = vt[0] * np.sign(vt[0] @ (t - sel.mean(0)))
    ax = Vector(ax).normalized()
    up = Vector((0, 0, 1)); up = (up - ax * up.dot(ax)).normalized()
    # cuticle: 1.25 cm back from the tip along the axis, then cast down onto the back of the finger
    q = Vector(t) - ax * 1.25 * CM
    hit = bvh.ray_cast(q + up * 3 * CM, -up)
    cut = hit[0] if hit[0] else q
    nrm = hit[1] if hit[0] else up
    nrm = (nrm - ax * nrm.dot(ax)).normalized()
    side = ax.cross(nrm).normalized()
    nrm = side.cross(ax).normalized()
    return ax, nrm, side, cut

def almond_nail(name, L, W, frame):
    ax, nrm, side, base = frame
    nu, nv = 28, 14
    bm = bmesh.new(); grid = []
    for i in range(nu + 1):
        u = i / nu
        hw = 0.5 * W * (0.55 + 0.45 * min(1.0, u / 0.12) ** 0.5) * max(0.0, 1 - u ** 2.0) ** 0.5
        hw = max(hw, 0.0009 if i < nu else 0.0006)
        row = []
        for j in range(nv + 1):
            v = j / nv * 2 - 1; x = v * hw
            h = -0.33 * (x / (0.5 * W)) ** 2 * 0.5 * W           # C-curve across the nail
            h -= 0.10 * L * max(0.0, u - 0.45) ** 2               # gentle downward sweep past the fingertip
            p = base + ax * (u * L) + side * x + nrm * (h + 0.0005)
            row.append(bm.verts.new(p))
        grid.append(row)
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = obj_from_bm(name, bm, NAIL, 3)
    if Vector(o.data.polygons[len(o.data.polygons) // 2].normal).dot(nrm) < 0:
        o.data.flip_normals()
    sol = o.modifiers.new("thick", "SOLIDIFY"); sol.thickness = 0.0007; sol.offset = -1
    sub = o.modifiers.new("sub", "SUBSURF"); sub.levels = sub.render_levels = 2
    return o

def nail_point(frame, L, u, lift=0.0):
    ax, nrm, side, base = frame
    return base + ax * (u * L) + nrm * (0.0012 + lift)

# ---------------------------------------------------------------- decorations
def place(o, frame, p, roll=0.0):
    ax, nrm, side, _ = frame
    R = Matrix((ax, side, nrm)).transposed().to_4x4()
    o.matrix_world = Matrix.Translation(p) @ R @ Matrix.Rotation(roll, 4, "Z")

def pearl(frame, p, r=0.0012):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=r)
    o = obj_from_bm("pearl", bm, PEARL, 4); place(o, frame, p + frame[1] * r * 0.6); return o

def bow(frame, p, size=0.0055):
    bm = bmesh.new()
    for s in (-1, 1):                                    # two loops
        g = bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1)
        bmesh.ops.transform(bm, matrix=Matrix.Diagonal((0.36, 0.5, 0.2, 1)) @ Matrix.Rotation(0.25 * s, 4, "Z"),
                            verts=g["verts"])
        bmesh.ops.translate(bm, vec=(0.05 * s, 0.42 * s, 0.05), verts=g["verts"])
        g = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1)   # tails
        bmesh.ops.transform(bm, matrix=Matrix.Diagonal((0.42, 0.11, 0.07, 1)) @ Matrix.Rotation(0.55 * s, 4, "Z"),
                            verts=g["verts"])
        bmesh.ops.translate(bm, vec=(0.3, 0.17 * s, 0.02), verts=g["verts"])
    g = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1)     # knot
    bmesh.ops.transform(bm, matrix=Matrix.Diagonal((0.14, 0.15, 0.14, 1)), verts=g["verts"])
    bmesh.ops.translate(bm, vec=(0, 0, 0.12), verts=g["verts"])
    bmesh.ops.scale(bm, vec=(size, size, size), verts=bm.verts)
    o = obj_from_bm("bow", bm, PINK, 4); place(o, frame, p, math.pi / 2); return o

def star(frame, p, r=0.0024, roll=0.3):
    bm = bmesh.new(); pts = []
    for k in range(10):
        a = k * math.pi / 5; rr = r if k % 2 == 0 else r * 0.45
        pts.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), 0)))
    f = bm.faces.new(pts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, 0, 0.0006), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
    o = obj_from_bm("star", bm, GOLD, 4); o.data.polygons.foreach_set("use_smooth", [False] * len(o.data.polygons))
    place(o, frame, p, roll); return o

def shell(frame, p, r=0.0035):
    bm = bmesh.new(); n = 18
    c = bm.verts.new((0, 0, 0.0008)); ring = []
    for k in range(n + 1):
        a = math.pi * (0.1 + 0.8 * k / n)
        rr = r * (1 + 0.06 * math.cos(k * math.pi * 1.0))
        ring.append(bm.verts.new((-rr * math.sin(a) * 0.15 + rr * math.cos(a) * 0 - r * 0.2 + rr * (1 - math.sin(a)) * 0,
                                  rr * math.cos(a), 0.0008 * (1 - abs(math.cos(a))) + 0.0004 * (k % 2))))
    for k in range(n): bm.faces.new((c, ring[k], ring[k + 1]))
    for v in ring: v.co.x = -abs(v.co.y) * 0.2 + math.sqrt(max(r * r - v.co.y ** 2, 0))
    o = obj_from_bm("shell", bm, SHELL, 4)
    sol = o.modifiers.new("t", "SOLIDIFY"); sol.thickness = 0.0005
    place(o, frame, p, math.pi); return o

# per set: finger -> list of (kind, u along the nail)
DECOR = {
    "si001":     {"index": [("bow", 0.42)], "ring": [("bow", 0.40)], "middle": [("pearl", 0.30), ("pearl", 0.42), ("pearl", 0.54)]},
    "si002":     {"index": [("pearl", 0.35), ("pearl", 0.5)], "ring": [("pearl", 0.4)], "middle": [("bow", 0.42)]},
    "spotlight": {"index": [("star", 0.45)], "middle": [("star", 0.35), ("star", 0.58)], "ring": [("star", 0.45)]},
    "chapter":   {"index": [("shell", 0.35)], "ring": [("shell", 0.35)], "middle": [("pearl", 0.3), ("pearl", 0.6)]},
    "spectrum":  {"middle": [("star", 0.4)], "index": [("pearl", 0.3), ("pearl", 0.45), ("pearl", 0.6)]},
}
FRAMES, NAILS = {}, {}
for f, tip in TIPS.items():
    fr = finger_frame(scan(tip)); FRAMES[f] = fr
    NAILS[f] = almond_nail("nail_" + f, NAIL_L[f] * CM, NAIL_W[f] * CM, fr)
    for kind, u in DECOR.get(A.set, {}).get(f, []):
        p = nail_point(fr, NAIL_L[f] * CM, u)
        {"bow": bow, "pearl": pearl, "star": star, "shell": shell}[kind](fr, p)

# ---------------------------------------------------------------- the Shifter (aluminium)
DEV_L, DEV_R, DEV_CR = 11.0 * CM, 1.55 * CM, 0.45 * CM     # length, circumradius, corner radius

def rounded_triangle(R, cr, n=16):
    pts = []
    for k in range(3):
        a = math.pi / 2 + k * 2 * math.pi / 3
        c = Vector((math.cos(a), math.sin(a))) * (R - cr * 2)
        for i in range(n + 1):
            b = a - math.pi / 3 + i / n * 2 * math.pi / 3
            pts.append(c + Vector((math.cos(b), math.sin(b))) * cr)
    return pts

def build_device():
    """Bar along +X, open end at x = DEV_L, one flat face down (rests on z=0)."""
    prof = rounded_triangle(DEV_R, DEV_CR)
    prof = [Vector((p.x, -p.y)) for p in prof]  # apex down -> flip so a flat face is down
    prof = [Vector((p.y, p.x)) for p in prof]
    zlow = min(p.y for p in prof)
    bm = bmesh.new()
    rings = []
    rim = 0.0012
    for x, s in [(0, 0.985), (0.0012, 1.0), (DEV_L - 0.0012, 1.0), (DEV_L, 0.99)]:
        rings.append([bm.verts.new((x, p.x * s, p.y * s - zlow)) for p in prof])
    inner = [bm.verts.new((DEV_L, p.x * 0.80, (p.y) * 0.80 - zlow)) for p in prof]
    deep = [bm.verts.new((DEV_L - 0.012, p.x * 0.80, (p.y) * 0.80 - zlow)) for p in prof]
    n = len(prof)
    def bridge(a, b):
        for i in range(n): bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bridge(rings[1], rings[0]); bridge(rings[2], rings[1]); bridge(rings[3], rings[2])
    bm.faces.new(list(reversed(rings[0])))
    o = obj_from_bm("shifter", bm, ALU, 2)
    bm2 = bmesh.new()                                       # white rim + dark interior of the open end
    r_out = [bm2.verts.new((DEV_L + 0.0003, p.x * 0.985, p.y * 0.985 - zlow)) for p in prof]
    r_in = [bm2.verts.new((DEV_L + 0.0003, p.x * 0.80, p.y * 0.80 - zlow)) for p in prof]
    r_deep = [bm2.verts.new((DEV_L - 0.010, p.x * 0.80, p.y * 0.80 - zlow)) for p in prof]
    for i in range(n):
        j = (i + 1) % n
        bm2.faces.new((r_out[i], r_out[j], r_in[j], r_in[i]))
        bm2.faces.new((r_in[i], r_in[j], r_deep[j], r_deep[i]))
    bm2.faces.new(r_deep)
    rimo = obj_from_bm("rim", bm2, RIM, 2); rimo.parent = o
    o.data.materials.append(HOLE)
    # find the top-front face: points of the profile with the largest -y + z (faces the camera at -Y)
    top_z = max(p.y for p in prof) - zlow
    return o, zlow, top_z

shifter, ZLOW, TOPZ = build_device()

def face_frame():
    """Frame on the camera-facing flat face of the bar: centre, normal (y,z), up-along-face."""
    a = math.radians(-30)                       # the flat faces are at 90, 210, 330 deg in (y,z) after the flips
    nrm = Vector((0, math.cos(math.radians(210)), math.sin(math.radians(210))))
    return nrm

def put_on_face(o, x, lateral, depth=0.0):
    """Place a flat object (built in XY, +Z out) on the camera-facing face of the bar, at x along it."""
    ys = [v.co.y for v in shifter.data.vertices]; zs = [v.co.z for v in shifter.data.vertices]
    # the face toward -Y: its outward normal is the profile normal with the most -Y
    best = None
    for poly in shifter.data.polygons:
        if abs(poly.normal.x) < 0.1 and (best is None or poly.normal.y < best.normal.y): best = poly
    nrm = Vector(best.normal); up = Vector((0, 0, 1)); up = (up - nrm * up.dot(nrm)).normalized()
    # centre of that face: support point of the profile in direction nrm
    sup = max((Vector((0, v.co.y, v.co.z)) for v in shifter.data.vertices), key=lambda p: p.dot(nrm))
    c = Vector((x, 0, 0)) + nrm * sup.dot(nrm) + Vector((0, 0, 0))
    c = Vector((x, sup.y, sup.z)) + up * lateral - nrm * depth
    R = Matrix((Vector((1, 0, 0)), up, nrm)).transposed().to_4x4()
    o.matrix_world = Matrix.Translation(c) @ R
    o.parent = shifter; o.matrix_parent_inverse = shifter.matrix_world.inverted()
    return nrm

def text_obj(body, font, size, x, lateral):
    cu = bpy.data.curves.new(body, "FONT"); cu.body = body; cu.font = bpy.data.fonts.load(font)
    cu.size = size; cu.extrude = 0.00025; cu.align_y = "CENTER"
    o = bpy.data.objects.new(body, cu); COL.objects.link(o); o.data.materials.append(ENGRAVE); o.pass_index = 2
    put_on_face(o, x, lateral, depth=0.0002)
    return o

t1 = text_obj("TINTA", FONT_B, 0.011, 0.012, 0.0)
bpy.context.view_layer.update()
w1 = t1.dimensions.x
t2 = text_obj("Shift", FONT_L, 0.011, 0.012 + w1 + 0.0003, 0.0)

def oval(name, cx, a, b, material, h, lateral=0.0):
    bm = bmesh.new(); ring = []
    for k in range(48):
        t = k / 48 * 2 * math.pi
        ring.append(bm.verts.new((a * math.cos(t), b * math.sin(t), 0)))
    f = bm.faces.new(ring)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, 0, h), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.translate(bm, vec=(0, 0, -h * 0.6), verts=bm.verts)
    o = obj_from_bm(name, bm, material, 2)
    bev = o.modifiers.new("b", "BEVEL"); bev.width = min(h, a, b) * 0.4; bev.segments = 3
    put_on_face(o, cx, lateral); return o

oval("button", DEV_L - 0.030, 0.0050, 0.0030, BUTTON, 0.0006)
for i in range(4):
    for j in range(2):
        oval("hole", DEV_L - 0.0175 + i * 0.0021, 0.00042, 0.00042, HOLE, 0.0003, lateral=(j - 0.5) * 0.0021)

# nail holder: a short white almond tab sticking out of the open end (opening shot only)
def holder():
    bm = bmesh.new(); nu = 12; L = 0.016; W = 0.0085
    top, bot = [], []
    for i in range(nu + 1):
        u = i / nu; hw = 0.5 * W * (1 - u ** 1.8) ** 0.6 + 0.0002
        top.append((u * L, hw)); bot.append((u * L, -hw))
    pts = [bm.verts.new((x, y, 0)) for x, y in top + list(reversed(bot))[1:-1]]
    f = bm.faces.new(pts)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, 0, 0.0012), verts=[e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)])
    o = obj_from_bm("holder", bm, RIM, 2)
    bev = o.modifiers.new("b", "BEVEL"); bev.width = 0.0005; bev.segments = 3
    o.location = (DEV_L - 0.004, 0, -ZLOW - 0.0006); o.parent = shifter
    return o

HOLDER = holder()

# ---------------------------------------------------------------- table, light, world
bpy.ops.mesh.primitive_plane_add(size=6)
table = bpy.context.object; table.data.materials.append(TABLE); table.name = "table"

S.world = bpy.data.worlds.new("studio"); S.world.use_nodes = True
bg = [n for n in S.world.node_tree.nodes if n.type == "BACKGROUND"][0]
bg.inputs[0].default_value = (1, 1, 1, 1); bg.inputs[1].default_value = 0.035

def area(name, loc, target, size, energy):
    L = bpy.data.lights.new(name, "AREA"); L.shape = "RECTANGLE"; L.size, L.size_y = size, size * 0.7; L.energy = energy
    o = bpy.data.objects.new(name, L); COL.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return o

area("key", (-0.25, 0.35, 0.75), (0.05, 0, 0), 0.9, 9)      # big softbox behind-left: soft shadows toward camera
area("fill", (0.4, -0.6, 0.45), (0.05, 0, 0), 1.2, 3)

# ---------------------------------------------------------------- shots
HAND_CENTER = Vector((0.10, 0.0, 0.02))
FR_IDX = FRAMES["index"]

def device_wide():
    # beside the hand, below it in frame, open end towards the fingertips, roughly parallel to the fingers
    return Matrix.Translation((0.075, -0.115, 0)) @ Matrix.Rotation(math.radians(-8), 4, "Z")

def device_close():
    # open end meets the index fingertip, finger and device in one straight line
    ax, nrm, side, base = FR_IDX
    tip = base + ax * (NAIL_L["index"] * CM * 0.55)
    xaxis = -ax; zaxis = (Vector((0, 0, 1)) - xaxis * xaxis.z).normalized(); yaxis = zaxis.cross(xaxis)
    R = Matrix((xaxis, yaxis, zaxis)).transposed().to_4x4()
    # local point at the centre of the opening
    open_c = Vector((DEV_L, 0, -ZLOW))
    m = R; p = tip - (m.to_3x3() @ open_c)
    return Matrix.Translation(p) @ R

def cam(name, loc, look, lens):
    c = bpy.data.cameras.new(name); c.lens = lens; c.clip_start = 0.01
    c.dof.use_dof = True; c.dof.aperture_fstop = 5.6
    o = bpy.data.objects.new(name, c); COL.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    c.dof.focus_distance = (Vector(look) - Vector(loc)).length
    return o

phone = A.aspect == "phone"
if phone:
    S.render.resolution_x, S.render.resolution_y = int(768 * A.scale), int(1365 * A.scale)
else:
    S.render.resolution_x, S.render.resolution_y = int(1376 * A.scale), int(768 * A.scale)

WIDE = {"desktop": ((-0.05, -0.42, 0.42), (0.11, -0.04, 0.0), 50), "phone": ((0.11, -0.30, 0.40), (0.135, -0.06, 0.0), 58)}
tipw = FR_IDX[3] + FR_IDX[0] * 0.02
CLOSE = {"desktop": (tipw + Vector((-0.10, -0.27, 0.17)), tipw + Vector((0.03, 0, -0.005)), 60),
         "phone": (tipw + Vector((-0.06, -0.24, 0.19)), tipw + Vector((0.015, 0, -0.008)), 60)}

def lerp(a, b, t): return Vector(a).lerp(Vector(b), t)

def set_shot(t):
    """t = 0 opening shot, 1 close-up. Device turns and slides into the fingertip, camera pushes in."""
    e = t * t * (3 - 2 * t)
    w, c = WIDE[A.aspect], CLOSE[A.aspect]
    loc, look, lens = lerp(w[0], c[0], e), lerp(w[1], c[1], e), w[2] + (c[2] - w[2]) * e
    camo = S.camera
    camo.location = loc; camo.rotation_euler = (look - loc).to_track_quat("-Z", "Y").to_euler()
    camo.data.lens = lens; camo.data.dof.focus_distance = (look - loc).length
    camo.data.dof.aperture_fstop = 8.0 - 2.0 * e
    d0, d1 = device_wide(), device_close()
    l0 = d0.translation; l1 = d1.translation
    x0, x1 = d0.col[0].xyz, d1.col[0].xyz
    yaw0, yaw1 = math.atan2(x0.y, x0.x), math.atan2(x1.y, x1.x)
    while yaw1 < yaw0: yaw1 += 2 * math.pi          # counter-clockwise: the body swings toward the camera, clear of the hand
    pitch1 = math.asin(max(-1, min(1, x1.z)))
    ed = min(1.0, max(0.0, (t - 0.05) / 0.85)); ed = ed * ed * (3 - 2 * ed)
    ep = min(1.0, max(0.0, (t - 0.6) / 0.4)); ep = ep * ep * (3 - 2 * ep)     # tilt up only at the end
    R = Matrix.Rotation(yaw0 + (yaw1 - yaw0) * ed, 4, "Z") @ Matrix.Rotation(-pitch1 * ep, 4, "Y")
    # keep the device's opening on the path: interpolate the opening point, not the origin
    oc = Vector((DEV_L, 0, -ZLOW))
    p0 = d0 @ oc; p1 = d1 @ oc
    pz = p0.z + (p1.z - p0.z) * ep
    ctrl = Vector((p1.x + 0.07, p1.y - 0.05, 0))     # pass in front of the fingertips, never through the hand
    pxy = p0 * (1 - ed) ** 2 + ctrl * 2 * ed * (1 - ed) + p1 * ed ** 2; pxy.z = pz
    shifter.matrix_world = Matrix.Translation(pxy - R.to_3x3() @ oc) @ R
    HOLDER.hide_render = t > 0.5

S.camera = cam("cam", (0, -0.4, 0.4), (0.1, 0, 0), 50)
S.render.engine = "CYCLES"; S.cycles.device = "CPU"; S.cycles.samples = A.samples
S.cycles.use_denoising = True
S.cycles.max_bounces = 8
S.view_settings.view_transform = "Standard"; S.view_settings.exposure = float(os.environ.get("EXPO", "0"))
S.render.image_settings.file_format = "PNG"
S.render.film_transparent = False

def render(path):
    S.render.filepath = path; bpy.ops.render.render(write_still=True)

def render_maps(path):
    """Flat ID render: R = keeps own colour (hand, device, decorations), G = nail, B = 0, table black."""
    saved = {o: [s.material for s in o.material_slots] for o in S.objects if o.type in ("MESH", "FONT")}
    def flat(name, rgb):
        m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
        for n in list(nt.nodes):
            if n.type != "OUTPUT_MATERIAL": nt.nodes.remove(n)
        e = nt.nodes.new("ShaderNodeEmission"); e.inputs[0].default_value = (*rgb, 1)
        nt.links.new(e.outputs[0], nt.nodes["Material Output"].inputs[0]); return m
    red, green, black = flat("id_r", (1, 0, 0)), flat("id_g", (0, 1, 0)), flat("id_k", (0, 0, 0))
    for o in saved:
        m = green if o.pass_index == 3 else red if o.pass_index in (1, 2, 4) else black
        for s in o.material_slots: s.material = m
    lights = [o for o in S.objects if o.type == "LIGHT"]
    for l in lights: l.hide_render = True
    bgv = bg.inputs[1].default_value; bg.inputs[1].default_value = 0
    smp, dn, fs = S.cycles.samples, S.cycles.use_denoising, S.camera.data.dof.use_dof
    S.cycles.samples, S.cycles.use_denoising = 16, False
    render(path)
    S.cycles.samples, S.cycles.use_denoising = smp, dn
    bg.inputs[1].default_value = bgv
    for l in lights: l.hide_render = False
    for o, mats in saved.items():
        for s, m in zip(o.material_slots, mats): s.material = m

if A.shot == "move":
    a, b = [int(x) for x in A.frames.split("-")]
    N = 48
    for f in range(a, b + 1):
        set_shot((f - 1) / (N - 1))
        render(A.out.replace("####", f"{f:04d}"))
        if A.maps: render_maps(A.out.replace("####", f"{f:04d}-id"))
else:
    set_shot(0.0 if A.shot == "wide" else 1.0)
    render(A.out)
    if A.maps: render_maps(os.path.splitext(A.out)[0] + "-id.png")
if A.blend: bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(A.blend))
if os.environ.get("DEBUG"):
    for o in S.objects:
        if o.type in ("MESH", "FONT"): print("DBG", o.name, tuple(round(d, 4) for d in o.dimensions), tuple(round(v, 4) for v in o.matrix_world.translation))
