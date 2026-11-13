"""Away Tweaks site icons, modelled and rendered in Blender.

Run headless:
    blender -b --python tools/icons/build_icons.py -- <out_dir> [icon ...]

Every icon is built from primitives in code (no downloaded models, no image
generator), lit by the same three lights and rendered by Cycles on a
transparent film, so the set reads as one family: black lacquer bodies,
violet metal, and a violet emissive accent. Rendered at 512px; the site
serves them downscaled.
"""
import math
import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = argv[0] if argv else "//icons_out"
ONLY = set(argv[1:])

# ── scene ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 160
scene.cycles.use_denoising = True
scene.cycles.device = "CPU"
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 512
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"

world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.03, 0.02, 0.06, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
scene.world = world


def look_at(obj, target=(0, 0, 0)):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = 3.3
cam = bpy.data.objects.new("cam", cam_data)
cam.location = (2.6, -5.2, 2.9)
look_at(cam)
scene.collection.objects.link(cam)
scene.camera = cam


def area(name, loc, size, power, color):
    data = bpy.data.lights.new(name, "AREA")
    data.size = size
    data.energy = power
    data.color = color
    obj = bpy.data.objects.new(name, data)
    obj.location = loc
    look_at(obj)
    scene.collection.objects.link(obj)


area("key", (-3.5, -4.0, 5.0), 4.0, 900, (1.0, 0.96, 1.0))
area("rim", (3.0, 4.0, 3.0), 3.0, 1400, (0.62, 0.3, 1.0))
area("fill", (4.5, -3.0, 0.5), 5.0, 180, (0.75, 0.6, 1.0))
area("top", (0.0, 0.0, 6.0), 6.0, 250, (0.9, 0.85, 1.0))


# ── materials ────────────────────────────────────────────────────────────
def material(name, color, metallic=0.0, rough=0.4, coat=0.0, emit=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    if coat:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = 0.08
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


BODY = material("body", (0.014, 0.011, 0.022), rough=0.32, coat=1.0)
DARK = material("dark", (0.045, 0.035, 0.075), rough=0.5)
METAL = material("metal", (0.2, 0.11, 0.36), metallic=1.0, rough=0.28)
STEEL = material("steel", (0.72, 0.68, 0.84), metallic=1.0, rough=0.22)
GLOW = material("glow", (0.3, 0.1, 0.7), rough=0.4, emit=(0.45, 0.1, 1.0), strength=1.7)
SCREEN = material("screen", (0.1, 0.04, 0.25), rough=0.25, emit=(0.36, 0.13, 0.9), strength=0.75)


# ── builders ─────────────────────────────────────────────────────────────
ROOT = None


def finish(obj, mat, bevel):
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.shade_auto_smooth(angle=0.7)
    except Exception:
        pass
    obj.select_set(False)
    obj.parent = ROOT
    return obj


def box(size, loc=(0, 0, 0), mat=BODY, bevel=0.03, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return finish(obj, mat, bevel)


def cyl(radius, depth, loc=(0, 0, 0), mat=BODY, rot=(0, 0, 0), bevel=0.02, verts=64):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, vertices=verts, location=loc, rotation=rot)
    return finish(bpy.context.object, mat, bevel)


def cone(r1, r2, depth, loc=(0, 0, 0), mat=BODY, rot=(0, 0, 0), bevel=0.0):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, vertices=64, location=loc, rotation=rot)
    return finish(bpy.context.object, mat, bevel)


def torus(major, minor, loc=(0, 0, 0), mat=GLOW, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor, major_segments=96, minor_segments=16, location=loc, rotation=rot
    )
    return finish(bpy.context.object, mat, 0)


def sphere(radius, loc=(0, 0, 0), mat=BODY, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=48, ring_count=24, location=loc)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return finish(obj, mat, 0)


def plate(points, thickness, y=0.0, mat=BODY, bevel=0.03):
    """A flat shape drawn in the XZ plane (facing the camera), given depth in Y."""
    mesh = bpy.data.meshes.new("plate")
    bm = bmesh.new()
    verts = [bm.verts.new((x, y + thickness / 2, z)) for x, z in points]
    face = bm.faces.new(verts)
    extruded = bmesh.ops.extrude_face_region(bm, geom=[face])
    moved = [e for e in extruded["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=moved, vec=(0, -thickness, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("plate", mesh)
    scene.collection.objects.link(obj)
    return finish(obj, mat, bevel)


def scaled(points, factor, dx=0.0, dz=0.0):
    return [(x * factor + dx, z * factor + dz) for x, z in points]


# ── icons ────────────────────────────────────────────────────────────────
def ram():
    box((2.5, 0.07, 1.0), (0, 0, -0.1), DARK, 0.01)
    box((2.36, 0.2, 0.82), (0, 0, 0.14), BODY, 0.04)
    box((2.36, 0.22, 0.07), (0, 0, 0.59), GLOW, 0.02)
    for i in range(4):
        box((0.42, 0.215, 0.06), (-0.78 + i * 0.52, 0, 0.14), METAL, 0.01, rot=(0, math.radians(35), 0))
    for i in range(22):
        if i == 9:
            continue
        box((0.07, 0.085, 0.16), (-1.14 + i * 0.108, 0, -0.52), STEEL, 0.005)
    return (math.radians(-12), math.radians(-14), math.radians(8))


def cpu():
    box((1.9, 1.9, 0.12), (0, 0, 0), DARK, 0.03)
    box((1.42, 1.42, 0.03), (0, 0, 0.07), GLOW, 0.0)
    box((1.3, 1.3, 0.2), (0, 0, 0.16), STEEL, 0.07)
    box((0.9, 0.9, 0.02), (0, 0, 0.262), METAL, 0.01)
    for i in range(9):
        offset = -0.72 + i * 0.18
        for x, y in ((offset, 0.86), (offset, -0.86), (0.86, offset), (-0.86, offset)):
            box((0.09, 0.09, 0.14), (x, y, 0.0), STEEL, 0.01)
    return (math.radians(48), 0, math.radians(20))


def gpu():
    box((2.6, 1.05, 0.42), (0, 0, 0), BODY, 0.07)
    box((2.62, 0.06, 0.08), (0, -0.53, 0.05), GLOW, 0.02)
    for x in (-0.68, 0.62):
        cyl(0.43, 0.06, (x, 0, 0.2), DARK, bevel=0.0)
        torus(0.43, 0.028, (x, 0, 0.225), GLOW)
        cyl(0.13, 0.1, (x, 0, 0.23), STEEL, bevel=0.02)
        for k in range(9):
            angle = k * math.tau / 9
            box(
                (0.27, 0.085, 0.025),
                (x + math.cos(angle) * 0.25, math.sin(angle) * 0.25, 0.235),
                METAL,
                0.008,
                rot=(math.radians(18), 0, angle),
            )
    box((0.06, 1.2, 0.62), (-1.33, 0, -0.06), STEEL, 0.01)
    box((1.3, 0.05, 0.12), (0.2, 0.15, -0.27), STEEL, 0.005)
    return (math.radians(52), 0, math.radians(12))


def bios():
    box((2.0, 2.0, 0.08), (0, 0, -0.12), DARK, 0.03)
    box((1.25, 0.95, 0.3), (0, 0, 0.08), BODY, 0.04)
    cyl(0.085, 0.02, (-0.44, -0.28, 0.24), GLOW, bevel=0.0)
    box((0.55, 0.035, 0.012), (0.12, 0.12, 0.236), METAL, 0.0)
    box((0.55, 0.035, 0.012), (0.12, 0.0, 0.236), METAL, 0.0)
    for i in range(6):
        x = -0.5 + i * 0.2
        for side in (-1, 1):
            box((0.08, 0.28, 0.05), (x, side * 0.58, -0.02), STEEL, 0.012)
            box((0.1, 0.12, 0.012), (x, side * 0.74, -0.076), GLOW, 0.0)
    for x, y in ((-0.82, 0.82), (0.82, 0.82), (-0.82, -0.82), (0.82, -0.82)):
        cyl(0.07, 0.03, (x, y, -0.075), STEEL, bevel=0.0)
    return (math.radians(50), 0, math.radians(-24))


def disk():
    cyl(1.25, 0.05, (0, 0, 0), METAL, bevel=0.012, verts=128)
    cyl(1.2, 0.012, (0, 0, 0.03), BODY, bevel=0.0, verts=128)
    torus(0.86, 0.016, (0, 0, 0.04), GLOW)
    torus(0.6, 0.012, (0, 0, 0.04), GLOW)
    cyl(0.4, 0.07, (0, 0, 0.02), BODY, bevel=0.01)
    torus(0.19, 0.03, (0, 0, 0.06), GLOW)
    cyl(0.16, 0.09, (0, 0, 0.02), DARK, bevel=0.0)
    return (math.radians(56), math.radians(-8), 0)


def rocket():
    cyl(0.44, 1.25, (0, 0, 0.0), BODY, bevel=0.03)
    cone(0.44, 0.02, 0.8, (0, 0, 1.02), METAL)
    torus(0.445, 0.03, (0, 0, 0.62), GLOW)
    torus(0.2, 0.045, (0, -0.42, 0.2), STEEL, rot=(math.radians(90), 0, 0))
    cyl(0.17, 0.05, (0, -0.42, 0.2), SCREEN, rot=(math.radians(90), 0, 0), bevel=0.0)
    cone(0.32, 0.44, 0.2, (0, 0, -0.72), STEEL)
    cone(0.26, 0.03, 0.7, (0, 0, -1.12), GLOW, rot=(math.radians(180), 0, 0))
    fin = [(0.0, 0.5), (0.52, -0.25), (0.52, -0.6), (0.0, -0.32)]
    for k in range(3):
        angle = math.radians(k * 120 + 30)
        obj = plate(fin, 0.08, mat=METAL, bevel=0.015)
        obj.location = (math.cos(angle) * 0.4, math.sin(angle) * 0.4, -0.4)
        obj.rotation_euler = (0, 0, angle)
    return (0, math.radians(-32), 0)


def monitor():
    box((2.5, 0.12, 1.5), (0, 0, 0.3), BODY, 0.04)
    box((2.34, 0.02, 1.34), (0, -0.065, 0.3), SCREEN, 0.0)
    for i, width in enumerate((1.5, 1.1, 1.3, 0.7)):
        box((width, 0.02, 0.085), (-1.0 + width / 2, -0.08, 0.72 - i * 0.24), GLOW, 0.0)
    box((0.26, 0.1, 0.5), (0, 0.05, -0.62), METAL, 0.02)
    box((1.1, 0.6, 0.07), (0, 0.02, -0.9), STEEL, 0.02)
    return (0, 0, math.radians(-16))


BOLT = [(0.18, 1.25), (-0.62, 0.02), (-0.1, 0.02), (-0.32, -1.25), (0.62, 0.22), (0.08, 0.22)]


def bolt():
    plate(scaled(BOLT, 1.08), 0.34, y=0.06, mat=BODY, bevel=0.05)
    plate(scaled(BOLT, 0.8, dx=-0.01), 0.1, y=-0.16, mat=GLOW, bevel=0.03)
    return (0, 0, math.radians(-20))


def network():
    box((2.3, 1.25, 0.3), (0, 0, -0.45), BODY, 0.06)
    box((2.32, 0.03, 0.05), (0, -0.63, -0.42), GLOW, 0.0)
    for i in range(4):
        cyl(0.04, 0.03, (-0.75 + i * 0.22, -0.4, -0.29), GLOW, bevel=0.0)
    for x in (-0.85, 0.85):
        cyl(0.07, 0.16, (x, 0.45, -0.25), STEEL, bevel=0.01)
        cyl(0.055, 1.35, (x, 0.45, 0.45), DARK, bevel=0.02)
    for radius in (0.34, 0.6, 0.86):
        arc(radius, 0.04, (0, 0.1, -0.2))
    cyl(0.08, 0.08, (0, 0.1, -0.2), GLOW, rot=(math.radians(90), 0, 0), bevel=0.0)
    return (math.radians(8), 0, math.radians(-18))


def arc(radius, minor, loc, start=40, end=140):
    """A glowing arc in the XZ plane, built from short segments."""
    steps = 28
    for i in range(steps):
        a0 = math.radians(start + (end - start) * i / steps)
        a1 = math.radians(start + (end - start) * (i + 1) / steps)
        mid = (a0 + a1) / 2
        length = radius * (a1 - a0) * 1.25
        box(
            (length, minor * 1.6, minor * 1.6),
            (loc[0] + math.cos(mid) * radius, loc[1], loc[2] + math.sin(mid) * radius),
            GLOW,
            0.0,
            rot=(0, -(mid + math.pi / 2), 0),
        )


def gauge():
    face = (math.radians(90), 0, 0)
    cyl(1.25, 0.24, (0, 0, 0), BODY, rot=face, bevel=0.05, verts=128)
    torus(1.25, 0.06, (0, -0.1, 0), STEEL, rot=face)
    cyl(1.1, 0.02, (0, -0.125, 0), DARK, rot=face, bevel=0.0, verts=128)
    for i in range(13):
        angle = math.radians(215 - i * 250 / 12)
        lit = i >= 8
        box(
            (0.2 if i % 3 == 0 else 0.12, 0.03, 0.055),
            (math.cos(angle) * 0.9, -0.14, math.sin(angle) * 0.9),
            GLOW if lit else STEEL,
            0.0,
            rot=(0, -angle, 0),
        )
    needle = math.radians(38)
    box(
        (0.86, 0.04, 0.07),
        (math.cos(needle) * 0.36, -0.17, math.sin(needle) * 0.36),
        GLOW,
        0.01,
        rot=(0, -needle, 0),
    )
    cyl(0.15, 0.1, (0, -0.16, 0), STEEL, rot=face, bevel=0.02)
    return (math.radians(-6), 0, math.radians(-20))


def gamepad():
    box((1.7, 0.95, 0.4), (0, 0.08, 0), BODY, 0.16)
    for side in (-1, 1):
        sphere(0.5, (side * 0.92, -0.12, -0.02), BODY, scale=(0.95, 1.25, 0.62))
        cyl(0.2, 0.05, (side * 0.42, -0.2, 0.2), DARK, bevel=0.0)
        cyl(0.15, 0.12, (side * 0.42, -0.2, 0.26), STEEL, bevel=0.03)
    box((0.42, 0.14, 0.07), (-0.92, 0.12, 0.27), METAL, 0.015)
    box((0.14, 0.42, 0.07), (-0.92, 0.12, 0.27), METAL, 0.015)
    for dx, dy in ((0.15, 0), (-0.15, 0), (0, 0.15), (0, -0.15)):
        cyl(0.075, 0.07, (0.92 + dx, 0.12 + dy, 0.28), GLOW, bevel=0.012)
    box((0.3, 0.05, 0.025), (0, 0.3, 0.2), GLOW, 0.0)
    return (math.radians(54), 0, math.radians(-14))


def layers():
    for i, mat in enumerate((BODY, METAL, STEEL)):
        box((1.8, 1.8, 0.14), (0, 0, -0.7 + i * 0.7), mat, 0.05)
        if i < 2:
            box((1.82, 1.82, 0.035), (0, 0, -0.79 + i * 0.7), GLOW, 0.0)
    return (math.radians(16), 0, math.radians(38))


SHIELD = [(0, 1.3), (0.95, 0.95), (0.95, 0.05), (0.62, -0.75), (0, -1.3), (-0.62, -0.75), (-0.95, 0.05), (-0.95, 0.95)]


def shield():
    plate(SHIELD, 0.34, y=0.06, mat=BODY, bevel=0.06)
    plate(scaled(SHIELD, 0.82), 0.06, y=-0.13, mat=METAL, bevel=0.02)
    box((0.42, 0.07, 0.15), (-0.3, -0.2, -0.16), GLOW, 0.02, rot=(0, math.radians(45), 0))
    box((0.86, 0.07, 0.15), (0.14, -0.2, 0.02), GLOW, 0.02, rot=(0, math.radians(-50), 0))
    return (0, 0, math.radians(-22))


ICONS = {
    "ram": ram,
    "cpu": cpu,
    "gpu": gpu,
    "bios": bios,
    "disk": disk,
    "rocket": rocket,
    "monitor": monitor,
    "bolt": bolt,
    "network": network,
    "gauge": gauge,
    "gamepad": gamepad,
    "layers": layers,
    "shield": shield,
}

for name, build in ICONS.items():
    if ONLY and name not in ONLY:
        continue
    ROOT = bpy.data.objects.new("root_" + name, None)
    scene.collection.objects.link(ROOT)
    ROOT.rotation_euler = build()
    scene.render.filepath = f"{OUT}/{name}.png"
    bpy.ops.render.render(write_still=True)
    doomed = [ROOT] + list(ROOT.children_recursive)
    for obj in doomed:
        bpy.data.objects.remove(obj, do_unlink=True)
    print("rendered", name)
