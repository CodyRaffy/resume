#!/usr/bin/env python3
"""
Create custom Jackson character sprites based on his real appearance:
- Orange Alaska hoodie with bear/mountain logo
- Camo cargo pants
- Brown/sandy wavy shoulder-length hair
- Blue watch/bracelet on wrist
- Barefoot

Generates 3 sprites:
  run.png   (128x192) - running pose, fists forward
  jump.png  (128x192) - jumping, arm reaching up
  slide.png (160x96)  - crouching low, fist out
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    print("ERROR: Pillow not installed. Run: pip3 install Pillow")
    sys.exit(1)

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "sprites" / "jackson"

# Jackson's color palette (from the photos)
HOODIE_ORANGE = (210, 120, 50)
HOODIE_SHADOW = (175, 95, 40)
HOODIE_HIGHLIGHT = (230, 145, 70)
HOODIE_LOGO_DARK = (90, 55, 30)  # Dark print on hoodie
CAMO_GREEN1 = (100, 110, 65)
CAMO_GREEN2 = (75, 85, 50)
CAMO_TAN = (140, 135, 95)
CAMO_DARK = (55, 60, 40)
SKIN = (225, 190, 160)
SKIN_SHADOW = (200, 165, 135)
HAIR_BROWN = (155, 120, 75)
HAIR_HIGHLIGHT = (180, 145, 95)
HAIR_SHADOW = (120, 90, 55)
WATCH_BLUE = (70, 160, 180)


def draw_camo_pattern(draw, x, y, w, h):
    """Draw a simple camo pattern in a rectangular area."""
    import random
    random.seed(42)  # Consistent pattern
    # Base color
    draw.rectangle([x, y, x + w, y + h], fill=CAMO_GREEN1)
    # Camo blobs
    for _ in range(25):
        bx = random.randint(x, x + w - 5)
        by = random.randint(y, y + h - 3)
        bw = random.randint(4, 12)
        bh = random.randint(3, 8)
        color = random.choice([CAMO_GREEN2, CAMO_TAN, CAMO_DARK, CAMO_GREEN1])
        draw.ellipse([bx, by, bx + bw, by + bh], fill=color)


def draw_hair(draw, head_cx, head_top, head_w, head_h, flowing_right=False):
    """Draw Jackson's wavy brown shoulder-length hair."""
    # Hair mass on top and sides
    hair_top = head_top - 4
    hair_left = head_cx - head_w // 2 - 6
    hair_right = head_cx + head_w // 2 + 6

    # Main hair shape
    draw.ellipse([hair_left, hair_top, hair_right, head_top + head_h * 0.6],
                 fill=HAIR_BROWN)

    # Top highlight
    draw.ellipse([hair_left + 4, hair_top, hair_right - 4, head_top + head_h * 0.3],
                 fill=HAIR_HIGHLIGHT)

    # Side hair flowing down (shoulder length)
    # Left side
    draw.ellipse([hair_left - 2, head_top + head_h * 0.2,
                  head_cx - head_w // 4, head_top + head_h + 16],
                 fill=HAIR_BROWN)
    # Right side
    rshift = 4 if flowing_right else 0
    draw.ellipse([head_cx + head_w // 4 - 2, head_top + head_h * 0.2,
                  hair_right + 2 + rshift, head_top + head_h + 16],
                 fill=HAIR_BROWN)

    # Hair wave details
    for i in range(3):
        wy = int(head_top + head_h * 0.4 + i * 8)
        draw.arc([hair_left + 2, wy, hair_left + 14, wy + 10],
                 start=180, end=360, fill=HAIR_SHADOW, width=1)
        draw.arc([hair_right - 14, wy, hair_right - 2, wy + 10],
                 start=180, end=360, fill=HAIR_SHADOW, width=1)


def draw_face(draw, cx, cy, w, h, expression='smile'):
    """Draw Jackson's face."""
    # Face shape
    draw.ellipse([cx - w//2, cy - h//2, cx + w//2, cy + h//2], fill=SKIN)
    # Slight shadow on sides
    draw.ellipse([cx - w//2, cy - h//2 + 2, cx - w//2 + 6, cy + h//2 - 2],
                 fill=SKIN_SHADOW)

    # Eyes
    eye_y = cy - h * 0.08
    eye_spread = w * 0.18
    eye_w, eye_h = 5, 4
    # White
    draw.ellipse([cx - eye_spread - eye_w, eye_y - eye_h,
                  cx - eye_spread + eye_w, eye_y + eye_h], fill=(255, 255, 255))
    draw.ellipse([cx + eye_spread - eye_w, eye_y - eye_h,
                  cx + eye_spread + eye_w, eye_y + eye_h], fill=(255, 255, 255))
    # Pupils (blue-ish)
    pupil_w = 3
    draw.ellipse([cx - eye_spread - pupil_w, eye_y - pupil_w,
                  cx - eye_spread + pupil_w, eye_y + pupil_w], fill=(60, 100, 140))
    draw.ellipse([cx + eye_spread - pupil_w, eye_y - pupil_w,
                  cx + eye_spread + pupil_w, eye_y + pupil_w], fill=(60, 100, 140))

    # Eyebrows
    brow_y = eye_y - eye_h - 3
    draw.line([cx - eye_spread - 5, brow_y, cx - eye_spread + 5, brow_y - 1],
              fill=HAIR_SHADOW, width=2)
    draw.line([cx + eye_spread - 5, brow_y - 1, cx + eye_spread + 5, brow_y],
              fill=HAIR_SHADOW, width=2)

    # Nose (small)
    nose_y = cy + h * 0.05
    draw.line([cx, nose_y - 2, cx, nose_y + 2], fill=SKIN_SHADOW, width=1)

    # Mouth
    mouth_y = cy + h * 0.22
    if expression == 'smile':
        draw.arc([cx - 7, mouth_y - 4, cx + 7, mouth_y + 6],
                 start=10, end=170, fill=(180, 80, 80), width=2)
    elif expression == 'excited':
        draw.ellipse([cx - 5, mouth_y - 2, cx + 5, mouth_y + 5],
                     fill=(180, 80, 80))
        # Teeth hint
        draw.rectangle([cx - 4, mouth_y - 1, cx + 4, mouth_y + 1],
                       fill=(240, 240, 240))
    elif expression == 'determined':
        draw.line([cx - 5, mouth_y, cx + 5, mouth_y + 1],
                  fill=(180, 80, 80), width=2)


def draw_hoodie_body(draw, cx, top, width, height, arms='fists'):
    """Draw the orange Alaska hoodie torso."""
    left = cx - width // 2
    right = cx + width // 2

    # Main hoodie body
    draw.rounded_rectangle([left, top, right, top + height],
                           radius=6, fill=HOODIE_ORANGE)

    # Kangaroo pocket
    pocket_y = top + height * 0.55
    pocket_h = height * 0.2
    draw.rounded_rectangle([left + width * 0.15, pocket_y,
                            right - width * 0.15, pocket_y + pocket_h],
                           radius=4, fill=HOODIE_SHADOW)
    # Pocket opening line
    draw.line([left + width * 0.2, pocket_y + pocket_h * 0.1,
               right - width * 0.2, pocket_y + pocket_h * 0.1],
              fill=HOODIE_HIGHLIGHT, width=1)

    # Hood strings
    draw.line([cx - 4, top + 2, cx - 6, top + 18], fill=HOODIE_SHADOW, width=1)
    draw.line([cx + 4, top + 2, cx + 6, top + 18], fill=HOODIE_SHADOW, width=1)

    # Alaska logo circle
    logo_cy = top + height * 0.32
    logo_r = int(width * 0.22)
    draw.ellipse([cx - logo_r, logo_cy - logo_r, cx + logo_r, logo_cy + logo_r],
                 outline=HOODIE_LOGO_DARK, width=2)
    # "ALASKA" text approximation (small marks)
    for i, offset in enumerate(range(-logo_r + 4, logo_r - 3, 4)):
        draw.rectangle([cx + offset, logo_cy - logo_r + 4,
                        cx + offset + 2, logo_cy - logo_r + 8],
                       fill=HOODIE_LOGO_DARK)
    # Mountain triangle in logo
    mt_y = logo_cy - 2
    draw.polygon([(cx - 6, mt_y + 5), (cx, mt_y - 5), (cx + 6, mt_y + 5)],
                 fill=HOODIE_LOGO_DARK)
    # Bear silhouette (tiny)
    draw.ellipse([cx - 4, mt_y + 4, cx + 4, mt_y + 10], fill=HOODIE_LOGO_DARK)

    # Shoulder shadow
    draw.line([left + 2, top + 3, right - 2, top + 3],
              fill=HOODIE_SHADOW, width=2)


def draw_fist(draw, x, y, size=8):
    """Draw a clenched fist."""
    draw.ellipse([x - size, y - size * 0.8, x + size, y + size * 0.8], fill=SKIN)
    # Finger lines
    for i in range(3):
        fy = y - size * 0.4 + i * (size * 0.35)
        draw.line([x - size * 0.6, fy, x + size * 0.3, fy], fill=SKIN_SHADOW, width=1)


def create_run_sprite():
    """Running pose - fists up, dynamic stride, big smile."""
    W, H = 128, 192
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = W // 2

    # === BODY POSITIONING ===
    head_cy = 36
    head_w, head_h = 34, 30
    body_top = 52
    body_w, body_h = 48, 55
    leg_top = body_top + body_h - 4

    # === LEGS (camo pants) - running stride ===
    # Left leg (forward)
    leg_left = [(cx - 18, leg_top), (cx - 22, leg_top + 20),
                (cx - 16, leg_top + 50), (cx - 8, leg_top + 55),
                (cx - 4, leg_top + 50), (cx - 6, leg_top + 20),
                (cx - 8, leg_top)]
    draw.polygon(leg_left, fill=CAMO_GREEN1)
    # Right leg (back)
    leg_right = [(cx + 4, leg_top), (cx + 8, leg_top + 20),
                 (cx + 18, leg_top + 45), (cx + 24, leg_top + 50),
                 (cx + 20, leg_top + 55), (cx + 12, leg_top + 48),
                 (cx + 2, leg_top + 20), (cx + 2, leg_top)]
    draw.polygon(leg_right, fill=CAMO_GREEN2)

    # Camo detail on legs
    import random
    random.seed(99)
    for _ in range(15):
        lx = random.randint(cx - 22, cx + 24)
        ly = random.randint(leg_top + 2, leg_top + 52)
        color = random.choice([CAMO_TAN, CAMO_DARK, CAMO_GREEN1])
        draw.ellipse([lx, ly, lx + 6, ly + 4], fill=color)

    # Feet (barefoot)
    draw.ellipse([cx - 18, leg_top + 50, cx - 6, leg_top + 58], fill=SKIN)
    draw.ellipse([cx + 16, leg_top + 48, cx + 28, leg_top + 56], fill=SKIN_SHADOW)

    # === HOODIE BODY ===
    draw_hoodie_body(draw, cx, body_top, body_w, body_h)

    # === ARMS ===
    # Left arm (forward, fist up)
    draw.rounded_rectangle([cx - body_w//2 - 8, body_top + 8,
                            cx - body_w//2 + 6, body_top + 35],
                           radius=4, fill=HOODIE_ORANGE)
    # Forearm going forward
    draw.rounded_rectangle([cx - body_w//2 - 14, body_top + 12,
                            cx - body_w//2 - 2, body_top + 28],
                           radius=4, fill=HOODIE_SHADOW)
    draw_fist(draw, cx - body_w//2 - 10, body_top + 14, 6)
    # Watch on left wrist
    draw.rectangle([cx - body_w//2 - 14, body_top + 24,
                    cx - body_w//2 - 4, body_top + 28], fill=WATCH_BLUE)

    # Right arm (back, fist)
    draw.rounded_rectangle([cx + body_w//2 - 6, body_top + 10,
                            cx + body_w//2 + 8, body_top + 38],
                           radius=4, fill=HOODIE_ORANGE)
    draw.rounded_rectangle([cx + body_w//2, body_top + 30,
                            cx + body_w//2 + 14, body_top + 42],
                           radius=4, fill=HOODIE_SHADOW)
    draw_fist(draw, cx + body_w//2 + 10, body_top + 40, 6)

    # === HEAD & HAIR ===
    draw_hair(draw, cx, head_cy - head_h//2, head_w, head_h)
    draw_face(draw, cx, head_cy, head_w, head_h, 'smile')

    # === MOTION LINES (running effect) ===
    draw.line([cx + 38, body_top + 15, cx + 52, body_top + 12],
              fill=(255, 255, 255, 120), width=2)
    draw.line([cx + 36, body_top + 28, cx + 50, body_top + 28],
              fill=(255, 255, 255, 100), width=1)
    draw.line([cx + 35, body_top + 40, cx + 48, body_top + 42],
              fill=(255, 255, 255, 80), width=1)

    return img


def create_jump_sprite():
    """Jump pose - arm reaching up high, feet off ground, body stretched."""
    W, H = 128, 192
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = W // 2

    # Shifted up slightly to show height
    head_cy = 30
    head_w, head_h = 34, 30
    body_top = 46
    body_w, body_h = 46, 52
    leg_top = body_top + body_h - 4

    # === LEGS (tucked/dangling - airborne) ===
    # Left leg straight down
    draw.rounded_rectangle([cx - 14, leg_top, cx - 2, leg_top + 48],
                           radius=4, fill=CAMO_GREEN1)
    # Right leg slightly bent
    draw.rounded_rectangle([cx + 2, leg_top, cx + 14, leg_top + 45],
                           radius=4, fill=CAMO_GREEN2)

    # Camo details
    import random
    random.seed(77)
    for _ in range(10):
        lx = random.randint(cx - 13, cx + 12)
        ly = random.randint(leg_top + 2, leg_top + 42)
        color = random.choice([CAMO_TAN, CAMO_DARK])
        draw.ellipse([lx, ly, lx + 5, ly + 3], fill=color)

    # Feet (dangling, pointed slightly down)
    draw.ellipse([cx - 15, leg_top + 44, cx - 1, leg_top + 52], fill=SKIN)
    draw.ellipse([cx + 1, leg_top + 42, cx + 15, leg_top + 50], fill=SKIN_SHADOW)

    # === HOODIE BODY ===
    draw_hoodie_body(draw, cx, body_top, body_w, body_h)

    # === ARMS ===
    # Right arm reaching UP HIGH (the signature jump pose)
    # Upper arm
    draw.rounded_rectangle([cx + body_w//2 - 8, body_top - 5,
                            cx + body_w//2 + 6, body_top + 20],
                           radius=4, fill=HOODIE_ORANGE)
    # Forearm reaching up
    draw.rounded_rectangle([cx + body_w//2 - 2, body_top - 28,
                            cx + body_w//2 + 10, body_top],
                           radius=4, fill=HOODIE_ORANGE)
    # Hand reaching up
    draw.ellipse([cx + body_w//2 - 2, body_top - 38,
                  cx + body_w//2 + 12, body_top - 26], fill=SKIN)
    # Fingers spread
    for i in range(3):
        fx = cx + body_w//2 + 1 + i * 4
        draw.line([fx, body_top - 36, fx, body_top - 42], fill=SKIN, width=2)

    # Left arm - bent at side
    draw.rounded_rectangle([cx - body_w//2 - 6, body_top + 8,
                            cx - body_w//2 + 8, body_top + 32],
                           radius=4, fill=HOODIE_ORANGE)
    draw.rounded_rectangle([cx - body_w//2 - 10, body_top + 18,
                            cx - body_w//2 + 2, body_top + 36],
                           radius=4, fill=HOODIE_SHADOW)
    draw_fist(draw, cx - body_w//2 - 4, body_top + 22, 5)
    # Watch
    draw.rectangle([cx - body_w//2 - 8, body_top + 30,
                    cx - body_w//2, body_top + 34], fill=WATCH_BLUE)

    # === HEAD & HAIR (hair flowing from jump motion) ===
    draw_hair(draw, cx, head_cy - head_h//2, head_w, head_h, flowing_right=True)
    draw_face(draw, cx, head_cy, head_w, head_h, 'excited')

    # === JUMP EFFECT LINES (below feet) ===
    for i in range(3):
        y = leg_top + 56 + i * 6
        half_w = 8 + i * 5
        alpha = 180 - i * 50
        draw.line([cx - half_w, y, cx + half_w, y],
                  fill=(255, 255, 255, alpha), width=2)

    return img


def create_slide_sprite():
    """Slide/crouch pose - low crouch, fist forward, determined face."""
    W, H = 160, 96
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Character is crouched low and leaning forward
    # Head is roughly in the left-center, body extends right

    head_cx = 65
    head_cy = 22
    head_w, head_h = 30, 26

    # === LEGS (crouched, folded under) ===
    # Left leg bent under body
    draw.rounded_rectangle([70, 55, 105, 72], radius=5, fill=CAMO_GREEN1)
    draw.rounded_rectangle([95, 60, 120, 75], radius=4, fill=CAMO_GREEN2)
    # Right leg extended slightly back
    draw.rounded_rectangle([105, 48, 140, 65], radius=5, fill=CAMO_GREEN1)
    draw.rounded_rectangle([130, 55, 148, 70], radius=4, fill=CAMO_GREEN2)

    # Camo details
    import random
    random.seed(55)
    for _ in range(12):
        lx = random.randint(70, 145)
        ly = random.randint(50, 72)
        color = random.choice([CAMO_TAN, CAMO_DARK, CAMO_GREEN1])
        draw.ellipse([lx, ly, lx + 5, ly + 3], fill=color)

    # Feet
    draw.ellipse([130, 65, 148, 74], fill=SKIN)
    draw.ellipse([96, 70, 112, 78], fill=SKIN_SHADOW)

    # === HOODIE BODY (crouched, leaning forward) ===
    # Main torso - angled forward
    body_points = [(55, 36), (110, 32), (115, 58), (60, 62)]
    draw.polygon(body_points, fill=HOODIE_ORANGE)
    # Rounded edges
    draw.rounded_rectangle([55, 32, 115, 62], radius=6, fill=HOODIE_ORANGE)

    # Hoodie pocket shadow
    draw.rounded_rectangle([68, 48, 100, 58], radius=3, fill=HOODIE_SHADOW)

    # Alaska logo (smaller, on the side since leaning)
    logo_cx, logo_cy = 85, 42
    logo_r = 8
    draw.ellipse([logo_cx - logo_r, logo_cy - logo_r,
                  logo_cx + logo_r, logo_cy + logo_r],
                 outline=HOODIE_LOGO_DARK, width=1)
    draw.polygon([(logo_cx - 3, logo_cy + 2), (logo_cx, logo_cy - 4),
                  (logo_cx + 3, logo_cy + 2)], fill=HOODIE_LOGO_DARK)

    # === ARMS ===
    # Left arm reaching forward with fist (the signature slide pose)
    draw.rounded_rectangle([35, 36, 58, 50], radius=4, fill=HOODIE_ORANGE)
    draw.rounded_rectangle([18, 38, 40, 48], radius=4, fill=HOODIE_SHADOW)
    draw_fist(draw, 16, 43, 7)
    # Watch
    draw.rectangle([30, 44, 38, 48], fill=WATCH_BLUE)

    # Right arm tucked
    draw.rounded_rectangle([108, 38, 122, 54], radius=4, fill=HOODIE_SHADOW)
    draw_fist(draw, 118, 50, 5)

    # === HEAD & HAIR ===
    # Hair (flowing back from forward motion)
    hair_top = head_cy - head_h//2 - 3
    draw.ellipse([head_cx - head_w//2 - 4, hair_top,
                  head_cx + head_w//2 + 8, head_cy + head_h * 0.2],
                 fill=HAIR_BROWN)
    # Hair flowing back
    draw.ellipse([head_cx + head_w//4, hair_top + 2,
                  head_cx + head_w//2 + 16, head_cy + head_h//2 + 8],
                 fill=HAIR_BROWN)
    draw.ellipse([head_cx - head_w//2 - 2, hair_top + 4,
                  head_cx - head_w//4, head_cy + head_h//2 + 4],
                 fill=HAIR_HIGHLIGHT)

    # Face (looking forward/down, determined)
    draw_face(draw, head_cx, head_cy, head_w, head_h, 'determined')

    # === SPEED LINES ===
    for i in range(4):
        y = 30 + i * 12
        draw.line([135 + i * 2, y, 155, y],
                  fill=(255, 255, 255, 100 - i * 20), width=1)

    return img


def add_outline(img, color=(0, 0, 0, 180), thickness=1):
    """Add a subtle dark outline around the character for better visibility."""
    # Create alpha mask
    alpha = img.split()[3]
    # Dilate the alpha slightly
    dilated = alpha.filter(ImageFilter.MaxFilter(3))
    # Create outline
    outline_img = Image.new("RGBA", img.size, (0, 0, 0, 0))
    outline_draw = ImageDraw.Draw(outline_img)
    # Where dilated but not original alpha
    for y in range(img.height):
        for x in range(img.width):
            d = dilated.getpixel((x, y))
            a = alpha.getpixel((x, y))
            if d > 30 and a < 30:
                outline_img.putpixel((x, y), color)
    # Composite: outline behind original
    result = Image.alpha_composite(outline_img, img)
    return result


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    sprites = {
        "run.png": create_run_sprite,
        "jump.png": create_jump_sprite,
        "slide.png": create_slide_sprite,
    }

    print("\n  Creating Jackson character sprites...")
    print(f"  Output: {OUTPUT_DIR}\n")

    for filename, create_fn in sprites.items():
        img = create_fn()
        img = add_outline(img)
        path = OUTPUT_DIR / filename
        img.save(str(path), "PNG", optimize=True)
        size = path.stat().st_size
        print(f"  Created {filename} ({img.width}x{img.height}, {size:,} bytes)")

    print(f"\n  All sprites saved to {OUTPUT_DIR}")
    print("  Run 'npm run dev' to see Jackson in the game!\n")


if __name__ == "__main__":
    main()
