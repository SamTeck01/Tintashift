"""Build public/models/hand.glb from the MakeHuman base mesh (CC0).

Inputs (both CC0, MakeHuman Community):
  base.obj   https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/3dobjs/base.obj
  skin.png   skins/young_caucasian_female/young_lightskinned_female_diffuse.png from
             https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip

Usage: python3 tools/build_hand.py base.obj skin.png public/models
Needs: numpy pillow trimesh pygltflib

Output frame: middle fingertip at the origin, fingers point along -x, back of the hand faces +z.
Nodes nail-1 … nail-5 (thumb … little finger) sit at each cuticle: +y runs back along the finger,
+z is the nail normal, and the uniform scale is the finger width, so a press-on tip can be parented straight on.
"""
import sys, io, struct
import numpy as np
from PIL import Image
import trimesh
import pygltflib as G

obj_path, skin_path, out_dir = sys.argv[1:4]
SIDE = "r"

# ---------- read OBJ ----------
V, VT, groups, g = [], [], {}, None
for line in open(obj_path):
    if line.startswith("v "): V.append([float(x) for x in line.split()[1:4]])
    elif line.startswith("vt "): VT.append([float(x) for x in line.split()[1:3]])
    elif line.startswith("g "): g = line.split()[1]
    elif line.startswith("f "):
        groups.setdefault(g, []).append([tuple(int(y) for y in x.split("/")[:2]) for x in line.split()[1:]])
V, VT = np.array(V), np.array(VT)
def joint(name):
    return V[sorted({c[0] - 1 for f in groups[f"joint-{SIDE}-{name}"] for c in f})].mean(0)
unit = lambda v: v / np.linalg.norm(v)

W, E = joint("hand"), joint("elbow")
J = {i: [joint(f"finger-{i}-{k}") for k in (1, 2, 3, 4)] for i in range(1, 6)}

# ---------- cut hand + forearm: hand side of a plane near the elbow, component containing the fingers ----------
body = np.array([[c[0] - 1 for c in f] for f in groups["body"]])
body_uv = np.array([[c[1] - 1 for c in f] for f in groups["body"]])
t = (V - W) @ (E - W) / np.dot(E - W, E - W)
keep = (t[body] < 0.9).all(1)
faces, faces_uv = body[keep], body_uv[keep]
parent = np.arange(len(V))
def find(a):
    while parent[a] != a:
        parent[a] = parent[parent[a]]; a = parent[a]
    return a
for f in faces:
    r = find(f[0])
    for v in f[1:]: parent[find(v)] = r
seed = find(faces[np.argmin(np.linalg.norm(V[faces].mean(1) - J[3][3], axis=1))][0])
sel = np.array([find(f[0]) == seed for f in faces])
faces, faces_uv = faces[sel], faces_uv[sel]

# ---------- hand frame ----------
fdir = unit(J[3][3] - J[3][0])
back = unit(np.cross(J[2][0] - W, J[5][0] - W))
if back @ np.array([-1.0, 1.0, 0.0]) < 0: back = -back
back = unit(back - fdir * (back @ fdir))
X, Z = -fdir, back
Y = np.cross(Z, X)
R = np.stack([X, Y, Z])                      # rows: new axes
SCALE = 1.0 / np.linalg.norm(J[3][3] - W)    # wrist → middle fingertip = 1 unit
tf = lambda p: (np.asarray(p) - J[3][3]) @ R.T * SCALE

# ---------- triangulate, split at UV seams ----------
tris, tris_uv = [], []
for f, fu in zip(faces, faces_uv):
    a = np.linalg.norm(V[f[0]] - V[f[2]]) <= np.linalg.norm(V[f[1]] - V[f[3]])
    for i, j, k in ([(0, 1, 2), (0, 2, 3)] if a else [(0, 1, 3), (1, 2, 3)]):
        tris.append([f[i], f[j], f[k]]); tris_uv.append([fu[i], fu[j], fu[k]])
pairs = {}
F = np.array([[pairs.setdefault((p, u), len(pairs)) for p, u in zip(tp, tu)] for tp, tu in zip(tris, tris_uv)])
keys = np.array(list(pairs.keys()))
P, UV = tf(V[keys[:, 0]]), VT[keys[:, 1]]

# ---------- smooth subdivision: midpoint split, then Taubin smoothing on welded positions ----------
def weld(P):
    _, inv = np.unique(np.round(P, 6), axis=0, return_inverse=True)
    return inv.reshape(-1)
def taubin(P, F, iters):
    inv = weld(P); n = inv.max() + 1
    Wp = np.zeros((n, 3)); np.add.at(Wp, inv, P); cnt = np.bincount(inv, minlength=n)[:, None]; Wp /= cnt
    e = np.unique(np.sort(np.concatenate([inv[F[:, [0, 1]]], inv[F[:, [1, 2]]], inv[F[:, [2, 0]]]]), axis=1), axis=0)
    e = e[e[:, 0] != e[:, 1]]
    deg = np.bincount(e.ravel(), minlength=n)[:, None]
    for _ in range(iters):
        for lam in (0.5, -0.52):
            acc = np.zeros((n, 3)); np.add.at(acc, e[:, 0], Wp[e[:, 1]]); np.add.at(acc, e[:, 1], Wp[e[:, 0]])
            Wp = Wp + lam * (acc / np.maximum(deg, 1) - Wp)
    return Wp[inv]
for _ in range(1):
    P, F, attr = trimesh.remesh.subdivide(P, F, vertex_attributes={"uv": UV}, return_index=False)
    UV = attr["uv"]
    P = taubin(P, F, 2)

# normals on welded positions so UV seams stay invisible
inv = weld(P)
fn = np.cross(P[F[:, 1]] - P[F[:, 0]], P[F[:, 2]] - P[F[:, 0]])
N = np.zeros((inv.max() + 1, 3))
for k in range(3): np.add.at(N, inv[F[:, k]], fn)
N = (N / np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-12))[inv]

# ---------- crop the skin texture to the UV island(s) used ----------
img = Image.open(skin_path).convert("RGB")
u0, v0 = UV.min(0) - 0.004; u1, v1 = UV.max(0) + 0.004
box = (int(u0 * img.width), int((1 - v1) * img.height), int(u1 * img.width), int((1 - v0) * img.height))
crop = img.crop(box)
crop = crop.resize((768, max(1, round(768 * crop.height / crop.width))), Image.LANCZOS)
uv = np.stack([(UV[:, 0] * img.width - box[0]) / (box[2] - box[0]), ((1 - UV[:, 1]) * img.height - box[1]) / (box[3] - box[1])], 1)
buf = io.BytesIO(); crop.save(buf, "JPEG", quality=86); jpg = buf.getvalue()

# ---------- nail anchors ----------
def seg_dist(P, a, b):
    ab = b - a; t = np.clip((P - a) @ ab / (ab @ ab), 0, 1)
    return np.linalg.norm(P - (a + np.outer(t, ab)), axis=1)
# which finger each vertex belongs to (nearest distal bone), so neighbouring fingers don't pollute the measurements
owner = 1 + np.argmin(np.stack([seg_dist(P, tf(J[i][2]), tf(J[i][3])) for i in range(1, 6)]), axis=0)
anchors = []
for i in range(1, 6):
    d3, tip = tf(J[i][2]), tf(J[i][3])
    d = unit(tip - d3); ln = np.linalg.norm(tip - d3)
    rel = P - d3; along = rel @ d
    radial = rel - np.outer(along, d)
    near = (along > 0.25 * ln) & (along < 0.85 * ln) & (owner == i)
    # the fingertip is wider than it is deep: the thin axis of the cross-section is the nail normal
    w, vec = np.linalg.eigh(np.cov(radial[near].T))
    n = unit(vec[:, 1] - d * (vec[:, 1] @ d))            # eigenvalue 0 is ~d (≈0), 1 is the thin axis, 2 the wide one
    ref = np.array([0.0, 0.0, 1.0]) if i > 1 else np.array([0.0, 0.6, 0.8])
    if n @ ref < 0: n = -n
    lat = np.cross(-d, n)
    h = (radial[near] @ n).max(); width = 2 * np.abs(radial[near] @ lat).max()
    pos = d3 + d * 0.38 * ln + n * h * 0.9
    M = np.stack([lat, -d, n], 1)                         # columns: x lateral, y back along the finger, z nail normal
    q = trimesh.transformations.quaternion_from_matrix(np.vstack([np.hstack([M, np.zeros((3, 1))]), [0, 0, 0, 1]]))  # w,x,y,z
    anchors.append((f"nail-{i}", pos, [q[1], q[2], q[3], q[0]], width))
    print(f"nail-{i} width {width:.3f} len {ln:.3f} normal {np.round(n, 2)}")

# ---------- write GLB ----------
blob = bytearray(); views, accs = [], []
def add(arr, target=None, ctype=G.FLOAT, atype=None, minmax=False):
    while len(blob) % 4: blob.append(0)
    b = arr.tobytes(); views.append(G.BufferView(buffer=0, byteOffset=len(blob), byteLength=len(b), target=target)); blob.extend(b)
    if atype:
        accs.append(G.Accessor(bufferView=len(views) - 1, componentType=ctype, count=len(arr), type=atype,
                               min=arr.min(0).tolist() if minmax else None, max=arr.max(0).tolist() if minmax else None))
    return len(accs) - 1
ip = add(P.astype(np.float32), G.ARRAY_BUFFER, atype=G.VEC3, minmax=True)
inn = add(N.astype(np.float32), G.ARRAY_BUFFER, atype=G.VEC3)
iuv = add(uv.astype(np.float32), G.ARRAY_BUFFER, atype=G.VEC2)
small = len(P) < 65536
ii = add(F.astype(np.uint16 if small else np.uint32).reshape(-1), G.ELEMENT_ARRAY_BUFFER, ctype=G.UNSIGNED_SHORT if small else G.UNSIGNED_INT, atype=G.SCALAR)
while len(blob) % 4: blob.append(0)
views.append(G.BufferView(buffer=0, byteOffset=len(blob), byteLength=len(jpg))); blob.extend(jpg)
gl = G.GLTF2(
    asset=G.Asset(version="2.0", generator="tools/build_hand.py", copyright="MakeHuman base mesh and skin, CC0"),
    scene=0, scenes=[G.Scene(nodes=list(range(6)))],
    nodes=[G.Node(name="hand", mesh=0)] + [G.Node(name=n, translation=p.tolist(), rotation=[float(x) for x in q], scale=[float(w)] * 3) for n, p, q, w in anchors],
    meshes=[G.Mesh(name="hand", primitives=[G.Primitive(attributes=G.Attributes(POSITION=ip, NORMAL=inn, TEXCOORD_0=iuv), indices=ii, material=0)])],
    materials=[G.Material(name="skin", pbrMetallicRoughness=G.PbrMetallicRoughness(baseColorTexture=G.TextureInfo(index=0), metallicFactor=0, roughnessFactor=0.55))],
    textures=[G.Texture(source=0, sampler=0)], samplers=[G.Sampler(magFilter=G.LINEAR, minFilter=G.LINEAR_MIPMAP_LINEAR)],
    images=[G.Image(bufferView=len(views) - 1, mimeType="image/jpeg")],
    buffers=[G.Buffer(byteLength=len(blob))], bufferViews=views, accessors=accs,
)
gl.set_binary_blob(bytes(blob))
gl.save_binary(f"{out_dir}/hand.glb")
print("verts", len(P), "tris", len(F), "texture", crop.size, "bbox", np.round(P.min(0), 2), np.round(P.max(0), 2))
