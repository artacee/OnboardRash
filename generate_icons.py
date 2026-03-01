"""
generate_icons.py
Generates OnboardRash app icons matching the HeroBusIcon design:
  - Violet gradient card (#c4a8ff → #7850dc → #4428b0)
  - White stylised bus with windows, wheels, detail lines
  - Subtle specular highlight in top-left
Outputs:
  assets/images/icon.png                  1024×1024  (general / iOS)
  assets/images/android-icon-foreground.png 1024×1024 (adaptive fg, transparent bg)
  assets/images/android-icon-background.png 1024×1024 (adaptive bg, solid violet)
  assets/images/android-icon-monochrome.png 1024×1024 (white-on-black mono)
  assets/images/splash-icon.png             512×512   (splash)
  assets/images/favicon.png                 48×48     (web favicon)
"""

import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = r"d:\Downloads\COLLAGE PROJECT\OnboardRash\driver-app\assets\images"

# ── palette ────────────────────────────────────────────────────────────────
GRAD_TOP    = (196, 168, 255)   # #c4a8ff
GRAD_MID    = (120,  80, 220)   # #7850dc
GRAD_BOT    = ( 68,  40, 176)   # #4428b0
WHITE       = (255, 255, 255)
WHITE_A80   = (255, 255, 255, 200)
WHITE_A30   = (255, 255, 255,  76)
WHITE_A12   = (255, 255, 255,  30)
TRANSPARENT = (  0,   0,   0,   0)

# ── helpers ────────────────────────────────────────────────────────────────

def make_gradient(size: int) -> Image.Image:
    """Vertical linear gradient top→mid→bottom."""
    arr = np.zeros((size, size, 3), dtype=np.uint8)
    half = size // 2
    for y in range(size):
        if y < half:
            t = y / half
            r = int(GRAD_TOP[0] + t * (GRAD_MID[0] - GRAD_TOP[0]))
            g = int(GRAD_TOP[1] + t * (GRAD_MID[1] - GRAD_TOP[1]))
            b = int(GRAD_TOP[2] + t * (GRAD_MID[2] - GRAD_TOP[2]))
        else:
            t = (y - half) / (size - half)
            r = int(GRAD_MID[0] + t * (GRAD_BOT[0] - GRAD_MID[0]))
            g = int(GRAD_MID[1] + t * (GRAD_BOT[1] - GRAD_MID[1]))
            b = int(GRAD_MID[2] + t * (GRAD_BOT[2] - GRAD_MID[2]))
        arr[y, :] = [r, g, b]
    img = Image.fromarray(arr, 'RGB').convert('RGBA')
    return img


def rounded_rect_mask(size: int, radius_frac: float = 0.18) -> Image.Image:
    """Alpha mask with rounded corners."""
    r = int(size * radius_frac)
    mask = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    return mask


def draw_bus(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float,
             color=(255, 255, 255), alpha: int = 255):
    """Draw a clean, stylised side-view bus centred at (cx,cy)."""
    s = scale
    rgba = color + (alpha,)

    def R(dx, dy, w, h, rad=None):
        """Draw filled rectangle relative to (cx,cy)."""
        rad = rad if rad is not None else max(2, int(s * 0.03))
        box = [cx + dx * s, cy + dy * s,
               cx + (dx + w) * s, cy + (dy + h) * s]
        draw.rounded_rectangle(box, radius=rad, fill=rgba)

    def Ro(dx, dy, w, h, rad=None, width=None):
        """Draw outlined rectangle relative to (cx,cy)."""
        rad = rad if rad is not None else max(2, int(s * 0.03))
        lw  = width if width is not None else max(1, int(s * 0.025))
        box = [cx + dx * s, cy + dy * s,
               cx + (dx + w) * s, cy + (dy + h) * s]
        draw.rounded_rectangle(box, radius=rad, outline=rgba, width=lw)

    def E(dx, dy, w, h):
        """Draw filled ellipse relative to (cx,cy)."""
        box = [cx + dx * s, cy + dy * s,
               cx + (dx + w) * s, cy + (dy + h) * s]
        draw.ellipse(box, fill=rgba)

    # ── body ────────────────────────────────────────────────────────────────
    bx, by, bw, bh = -0.44, -0.26, 0.88, 0.44
    R(bx, by, bw, bh, rad=int(s * 0.07))

    # ── roof curve accent (slightly lighter patch) ───────────────────────
    roof_rgba = (255, 255, 255, int(alpha * 0.18))
    rbox = [cx + (-0.44) * s, cy + (-0.26) * s,
            cx + ( 0.44) * s, cy + (-0.04) * s]
    draw.rounded_rectangle(rbox, radius=int(s * 0.07),
                            fill=roof_rgba)

    # ── windows ──────────────────────────────────────────────────────────
    # window bg color: semi-transparent dark tint on white icon
    win_rgba = (68, 40, 176, int(alpha * 0.82))
    win_h = 0.14
    win_y = -0.20
    # front windshield
    fw_box = [cx + (-0.36) * s, cy + win_y * s,
              cx + (-0.20) * s, cy + (win_y + win_h) * s]
    draw.rounded_rectangle(fw_box, radius=int(s * 0.035), fill=win_rgba)
    # window 1
    w1_box = [cx + (-0.16) * s, cy + win_y * s,
              cx + (-0.04) * s, cy + (win_y + win_h) * s]
    draw.rounded_rectangle(w1_box, radius=int(s * 0.03), fill=win_rgba)
    # window 2
    w2_box = [cx + ( 0.00) * s, cy + win_y * s,
              cx + ( 0.12) * s, cy + (win_y + win_h) * s]
    draw.rounded_rectangle(w2_box, radius=int(s * 0.03), fill=win_rgba)
    # window 3
    w3_box = [cx + ( 0.16) * s, cy + win_y * s,
              cx + ( 0.28) * s, cy + (win_y + win_h) * s]
    draw.rounded_rectangle(w3_box, radius=int(s * 0.03), fill=win_rgba)
    # rear window
    rw_box = [cx + ( 0.30) * s, cy + win_y * s,
              cx + ( 0.38) * s, cy + (win_y + win_h) * s]
    draw.rounded_rectangle(rw_box, radius=int(s * 0.03), fill=win_rgba)

    # ── door line ────────────────────────────────────────────────────────
    door_rgba = (68, 40, 176, int(alpha * 0.55))
    door_box = [cx + (-0.29) * s, cy + (-0.04) * s,
                cx + (-0.18) * s, cy + (  0.18) * s]
    draw.rounded_rectangle(door_box, radius=int(s * 0.025), fill=door_rgba)

    # ── waist stripe ────────────────────────────────────────────────────
    stripe_rgba = (68, 40, 176, int(alpha * 0.30))
    stripe_box = [cx + (-0.44) * s, cy + (-0.025) * s,
                  cx + ( 0.44) * s, cy + ( 0.025) * s]
    draw.rectangle(stripe_box, fill=stripe_rgba)

    # ── headlights ───────────────────────────────────────────────────────
    hl_rgba = (255, 240, 180, int(alpha * 0.95))
    hl_box = [cx + (-0.43) * s, cy + (-0.05) * s,
              cx + (-0.35) * s, cy + ( 0.02) * s]
    draw.rounded_rectangle(hl_box, radius=int(s * 0.02), fill=hl_rgba)

    # ── taillights ───────────────────────────────────────────────────────
    tl_rgba = (255, 80, 80, int(alpha * 0.90))
    tl_box = [cx + ( 0.37) * s, cy + (-0.05) * s,
              cx + ( 0.44) * s, cy + ( 0.02) * s]
    draw.rounded_rectangle(tl_box, radius=int(s * 0.02), fill=tl_rgba)

    # ── wheels ───────────────────────────────────────────────────────────
    wheel_y  = 0.18
    wheel_r  = 0.095
    hub_r    = 0.042
    for wx in [-0.28, 0.25]:
        # tyre
        ty_box = [cx + (wx - wheel_r) * s, cy + (wheel_y - wheel_r) * s,
                  cx + (wx + wheel_r) * s, cy + (wheel_y + wheel_r) * s]
        draw.ellipse(ty_box, fill=rgba)
        # hub (cut-out style: filled with darker tint)
        hub_rgba = (68, 40, 176, int(alpha * 0.80))
        hu_box = [cx + (wx - hub_r) * s, cy + (wheel_y - hub_r) * s,
                  cx + (wx + hub_r) * s, cy + (wheel_y + hub_r) * s]
        draw.ellipse(hu_box, fill=hub_rgba)
        # hub centre dot
        dot_r = 0.016
        dot_rgba = rgba
        do_box = [cx + (wx - dot_r) * s, cy + (wheel_y - dot_r) * s,
                  cx + (wx + dot_r) * s, cy + (wheel_y + dot_r) * s]
        draw.ellipse(do_box, fill=dot_rgba)

    # ── undercarriage bar ────────────────────────────────────────────────
    uc_rgba = (255, 255, 255, int(alpha * 0.45))
    uc_box = [cx + (-0.44) * s, cy + (0.09) * s,
              cx + ( 0.44) * s, cy + (0.12) * s]
    draw.rectangle(uc_box, fill=uc_rgba)


def add_specular(img: Image.Image, size: int) -> Image.Image:
    """Add a soft white glow in the top-left corner (specular highlight)."""
    spec = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(spec)
    radius = int(size * 0.48)
    d.ellipse([-radius // 2, -radius // 2,
               radius,        radius],
              fill=(255, 255, 255, 28))
    spec_blur = spec.filter(ImageFilter.GaussianBlur(radius=size // 8))
    return Image.alpha_composite(img, spec_blur)


def add_glint(img: Image.Image, size: int) -> Image.Image:
    """Tiny bright corner glint, top-left."""
    gl = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d  = ImageDraw.Draw(gl)
    r  = int(size * 0.06)
    margin = int(size * 0.07)
    d.ellipse([margin - r, margin - r, margin + r, margin + r],
              fill=(255, 255, 255, 55))
    gl_blur = gl.filter(ImageFilter.GaussianBlur(radius=r // 2))
    return Image.alpha_composite(img, gl_blur)


# ── icon builder ──────────────────────────────────────────────────────────

def build_full_icon(size: int) -> Image.Image:
    """Full icon: gradient bg + rounded mask + bus + specular."""
    grad = make_gradient(size)

    # Apply rounded corners
    mask = rounded_rect_mask(size, radius_frac=0.20)
    grad.putalpha(mask)

    # Draw bus
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    draw_bus(d, size // 2, int(size * 0.50), scale=size * 0.52)
    grad = Image.alpha_composite(grad, layer)

    # Specular + glint
    grad = add_specular(grad, size)
    grad = add_glint(grad, size)
    return grad


def build_foreground_icon(size: int) -> Image.Image:
    """Adaptive fg: white bus on transparent background (safe zone = central 66%)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d   = ImageDraw.Draw(img)
    # Scale bus to 55% of size so it stays within adaptive safe zone
    draw_bus(d, size // 2, int(size * 0.50), scale=size * 0.40)
    return img


def build_background_icon(size: int) -> Image.Image:
    """Adaptive bg: solid violet gradient, no bus, no rounded corners."""
    return make_gradient(size)


def build_mono_icon(size: int) -> Image.Image:
    """Monochrome: white bus on black for themed adaptive icon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 255))
    d   = ImageDraw.Draw(img)
    draw_bus(d, size // 2, int(size * 0.50), scale=size * 0.40,
             color=(255, 255, 255), alpha=255)
    return img


def build_splash_icon(size: int) -> Image.Image:
    """Splash: gradient circle + bus, no hard corners (circle mask)."""
    grad = make_gradient(size)
    # circular mask
    mask = Image.new('L', (size, size), 0)
    d    = ImageDraw.Draw(mask)
    d.ellipse([0, 0, size - 1, size - 1], fill=255)
    grad.putalpha(mask)

    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    dl = ImageDraw.Draw(layer)
    draw_bus(dl, size // 2, int(size * 0.50), scale=size * 0.52)
    grad = Image.alpha_composite(grad, layer)
    grad = add_specular(grad, size)
    return grad


def build_favicon(size: int) -> Image.Image:
    """Tiny favicon: gradient square + simplified bus."""
    grad = make_gradient(size)
    mask = rounded_rect_mask(size, radius_frac=0.22)
    grad.putalpha(mask)
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    draw_bus(d, size // 2, int(size * 0.50), scale=size * 0.52)
    return Image.alpha_composite(grad, layer)


# ── generate all ──────────────────────────────────────────────────────────
def main():
    os.makedirs(OUT, exist_ok=True)

    jobs = [
        ("icon.png",                    build_full_icon,       1024),
        ("android-icon-foreground.png", build_foreground_icon, 1024),
        ("android-icon-background.png", build_background_icon, 1024),
        ("android-icon-monochrome.png", build_mono_icon,       1024),
        ("splash-icon.png",             build_splash_icon,      512),
        ("favicon.png",                 build_favicon,           48),
    ]

    for filename, builder, size in jobs:
        img  = builder(size)
        path = os.path.join(OUT, filename)
        img.save(path, "PNG")
        print(f"  ✓  {filename}  ({size}×{size})")

    print("\nAll icons written to:", OUT)

if __name__ == "__main__":
    main()
