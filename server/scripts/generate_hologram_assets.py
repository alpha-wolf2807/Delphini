import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets")
VIDEO_DIR = os.path.join(PUBLIC_DIR, "videos")
IMAGE_DIR = os.path.join(PUBLIC_DIR, "images")

os.makedirs(VIDEO_DIR, exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)

# 16:9 HD resolution optimized for Pepper's Ghost
WIDTH = 1280
HEIGHT = 720
FPS = 30

def create_base_canvas():
    return Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))

def draw_glow_circle(draw, center, radius, color, width=2, glow_layers=3):
    cx, cy = center
    for i in range(glow_layers, 0, -1):
        alpha_color = tuple(int(c * (0.3 / i)) for c in color)
        r = radius + i * 2
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=alpha_color, width=width + i)
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=color, width=width)

def draw_glow_line(draw, pt1, pt2, color, width=2):
    draw.line([pt1, pt2], fill=color, width=width)

# ----------------------------------------------------
# 1. DELPHINI AVATAR (HI, WAVE, EXPLAIN, IDLE)
# ----------------------------------------------------
def render_delphini_frame(t, total_time, mode="idle"):
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    cx, cy = WIDTH // 2, HEIGHT // 2 - 20

    # Holographic background concentric rings & grid lines
    ring_rot = t * 1.5
    for r in [180, 220, 260]:
        draw_glow_circle(draw, (cx, cy), r, (0, 80, 140), width=1, glow_layers=2)
    
    # Orbiting digital ticks
    num_ticks = 24
    for i in range(num_ticks):
        angle = ring_rot + (i * 2 * math.pi / num_ticks)
        r1, r2 = 250, 265
        x1 = cx + r1 * math.cos(angle)
        y1 = cy + r1 * math.sin(angle)
        x2 = cx + r2 * math.cos(angle)
        y2 = cy + r2 * math.sin(angle)
        draw.line([(x1, y1), (x2, y2)], fill=(0, 240, 255), width=2)

    # Floating particles
    for p in range(30):
        p_angle = (p * 1.3) + t * (0.5 + (p % 3) * 0.3)
        p_dist = 80 + (p * 6) % 190
        px = cx + p_dist * math.cos(p_angle)
        py = cy + p_dist * math.sin(p_angle) * 0.8
        p_rad = 1 + (p % 3)
        p_bright = int(180 + 75 * math.sin(t * 4 + p))
        draw.ellipse([px - p_rad, py - p_rad, px + p_rad, py + p_rad], fill=(0, p_bright, 255))

    # Avatar Head & Hair Silhouette (Futuristic Hologram)
    head_y = cy - 40
    # Floating Halo Ring above head
    halo_tilt = math.sin(t * 3) * 6
    draw.ellipse([cx - 70, head_y - 120 + halo_tilt, cx + 70, head_y - 95 + halo_tilt], outline=(0, 255, 255), width=3)
    draw.ellipse([cx - 65, head_y - 117 + halo_tilt, cx + 65, head_y - 98 + halo_tilt], outline=(150, 255, 255), width=1)

    # Cyber Head Contour
    draw.ellipse([cx - 55, head_y - 75, cx + 55, head_y + 45], outline=(0, 230, 255), width=3)
    draw.ellipse([cx - 50, head_y - 70, cx + 50, head_y + 40], outline=(0, 100, 180), width=1)

    # Sleek cyber hair flowing curves
    hair_flow = math.sin(t * 2) * 5
    draw.arc([cx - 75, head_y - 85, cx + 75, head_y + 75], start=180, end=360, fill=(0, 255, 255), width=3)
    draw.line([(cx - 65, head_y - 20), (cx - 85 - hair_flow, head_y + 90)], fill=(0, 200, 255), width=2)
    draw.line([(cx + 65, head_y - 20), (cx + 85 + hair_flow, head_y + 90)], fill=(0, 200, 255), width=2)

    # Holographic Visor / Eyes
    eye_y = head_y - 20
    eye_blink = math.sin(t * 4) > 0.96
    if not eye_blink:
        draw.ellipse([cx - 35, eye_y - 4, cx - 12, eye_y + 8], fill=(0, 255, 255))
        draw.ellipse([cx + 12, eye_y - 4, cx + 35, eye_y + 8], fill=(0, 255, 255))
        # Eye glow sparks
        draw.ellipse([cx - 25, eye_y - 2, cx - 21, eye_y + 2], fill=(255, 255, 255))
        draw.ellipse([cx + 21, eye_y - 2, cx + 25, eye_y + 2], fill=(255, 255, 255))
    else:
        draw.line([(cx - 35, eye_y + 2), (cx - 12, eye_y + 2)], fill=(0, 255, 255), width=2)
        draw.line([(cx + 12, eye_y + 2), (cx + 35, eye_y + 2)], fill=(0, 255, 255), width=2)

    # Mouth / Speech Animation
    mouth_y = head_y + 25
    if mode in ["hi", "wave", "explain"]:
        mouth_open = abs(math.sin(t * 10)) * 12
        draw.ellipse([cx - 15, mouth_y - mouth_open / 2, cx + 15, mouth_y + mouth_open / 2], outline=(0, 255, 255), width=2)
    else:
        draw.line([(cx - 12, mouth_y), (cx + 12, mouth_y)], fill=(0, 255, 255), width=2)

    # Neck & Torso (Futuristic Cyber Suit)
    draw.polygon([(cx - 20, head_y + 45), (cx + 20, head_y + 45), (cx + 35, head_y + 90), (cx - 35, head_y + 90)], outline=(0, 200, 255))
    draw.polygon([(cx - 35, head_y + 90), (cx + 35, head_y + 90), (cx + 80, head_y + 200), (cx - 80, head_y + 200)], outline=(0, 230, 255), fill=(0, 30, 60))
    
    # Core Energy Reactor in Chest
    chest_y = head_y + 135
    core_pulse = 15 + math.sin(t * 6) * 4
    draw_glow_circle(draw, (cx, chest_y), int(core_pulse), (0, 255, 255), width=2, glow_layers=3)
    draw.ellipse([cx - 6, chest_y - 6, cx + 6, chest_y + 6], fill=(255, 255, 255))

    # Hand Wave Animation for HI and WAVE
    if mode in ["hi", "wave"]:
        wave_angle = -0.6 + math.sin(t * 8) * 0.4
        shoulder_x, shoulder_y = cx + 55, head_y + 105
        elbow_x = shoulder_x + 50 * math.cos(wave_angle - 0.5)
        elbow_y = shoulder_y + 50 * math.sin(wave_angle - 0.5)
        hand_x = elbow_x + 60 * math.cos(wave_angle - 1.2)
        hand_y = elbow_y + 60 * math.sin(wave_angle - 1.2)
        
        draw.line([(shoulder_x, shoulder_y), (elbow_x, elbow_y)], fill=(0, 255, 255), width=6)
        draw.line([(elbow_x, elbow_y), (hand_x, hand_y)], fill=(0, 255, 255), width=5)
        draw.ellipse([hand_x - 12, hand_y - 12, hand_x + 12, hand_y + 12], fill=(0, 255, 255))
        # Wave particles
        for wp in range(6):
            wpx = hand_x + (wp * 8) * math.cos(t * 12 + wp)
            wpy = hand_y + (wp * 8) * math.sin(t * 12 + wp)
            draw.ellipse([wpx - 2, wpy - 2, wpx + 2, wpy + 2], fill=(200, 255, 255))

    # Live Explaining Hologram Nexus Waveforms for EXPLAIN
    if mode == "explain":
        for w in range(12):
            wx = cx - 180 + w * 30
            wh = 20 + abs(math.sin(t * 12 + w * 0.8)) * 50
            draw.line([(wx, cy + 180 - wh), (wx, cy + 180 + wh)], fill=(0, 255, 255), width=3)
            draw.ellipse([wx - 3, cy + 180 - wh - 3, wx + 3, cy + 180 - wh + 3], fill=(255, 255, 255))

    # DELPHINI Holographic Interface Label
    draw.text((cx - 60, HEIGHT - 60), "DELPHINI AI", fill=(0, 255, 255))
    draw.line([(cx - 100, HEIGHT - 40), (cx + 100, HEIGHT - 40)], fill=(0, 180, 255), width=1)

    return np.array(img)

# ----------------------------------------------------
# 2. SMART STYLUS PEN (SHOW, EXPAND, ASSEMBLE, FINAL)
# ----------------------------------------------------
def render_pen_frame(t, total_time, mode="show"):
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    cx, cy = WIDTH // 2, HEIGHT // 2

    # Hologram Grid Pedestal
    grid_rot = t * 1.0
    for r in [120, 170, 230]:
        draw_glow_circle(draw, (cx, cy + 120), r, (0, 70, 130), width=1, glow_layers=2)
    
    # Ambient glowing particles
    for i in range(20):
        ang = i * 0.35 + t * 0.8
        dist = 110 + (i * 7) % 150
        px = cx + dist * math.cos(ang)
        py = cy + dist * math.sin(ang) * 0.5
        draw.ellipse([px - 2, py - 2, px + 2, py + 2], fill=(0, 220, 255))

    # Pen center angle and rotation
    tilt = -0.3 + math.sin(t * 2) * 0.1
    progress = min(1.0, max(0.0, t / (total_time * 0.75)))

    if mode == "show":
        # Rotating 3D floating pen
        rot = t * 2.2
        dx = math.cos(rot) * 220
        dy = math.sin(rot) * 60 + math.sin(t * 3) * 15

        p1 = (cx - dx * 0.9, cy - dy * 0.9 - 30)
        p2 = (cx + dx * 0.9, cy + dy * 0.9 - 30)

        # Pen Body
        draw.line([p1, p2], fill=(220, 240, 255), width=14)
        draw.line([p1, p2], fill=(0, 255, 255), width=6)
        
        # Pen Tip & Laser
        tip_x, tip_y = p2
        draw.polygon([(tip_x, tip_y - 7), (tip_x + 25 * math.cos(rot), tip_y + 25 * math.sin(rot)), (tip_x, tip_y + 7)], fill=(0, 255, 255))
        draw_glow_circle(draw, (int(tip_x), int(tip_y)), 10, (0, 255, 255), width=2)
        
        # Power Rings on Pen
        for step in [0.2, 0.4, 0.6, 0.8]:
            rx = p1[0] + (p2[0] - p1[0]) * step
            ry = p1[1] + (p2[1] - p1[1]) * step
            draw.ellipse([rx - 6, ry - 10, rx + 6, ry + 10], outline=(0, 255, 255), width=2)

    elif mode == "expand":
        # Exploded assembly view animation
        spread = progress * 130
        
        # 1. Stylus Sensor Tip
        tip_x = cx + spread * 1.5
        tip_y = cy - spread * 0.5 - 20
        draw.polygon([(tip_x - 15, tip_y - 6), (tip_x + 25, tip_y), (tip_x - 15, tip_y + 6)], fill=(0, 255, 255))
        draw_glow_circle(draw, (int(tip_x), int(tip_y)), 8, (0, 255, 255), width=2)
        draw.text((tip_x - 30, tip_y - 35), "HAPTIC SENSOR NIB", fill=(0, 255, 255))
        draw.line([(tip_x, tip_y), (tip_x, tip_y - 20)], fill=(0, 180, 255), width=1)

        # 2. Main Titanium Casing
        body_x = cx + spread * 0.5
        body_y = cy - spread * 0.2 - 20
        draw.line([(body_x - 50, body_y), (body_x + 50, body_y)], fill=(200, 240, 255), width=14)
        draw.line([(body_x - 50, body_y), (body_x + 50, body_y)], fill=(0, 230, 255), width=4)
        draw.text((body_x - 40, body_y + 25), "TITANIUM CHASSIS", fill=(0, 230, 255))
        draw.line([(body_x, body_y), (body_x, body_y + 20)], fill=(0, 180, 255), width=1)

        # 3. Quantum Logic Processor
        core_x = cx - spread * 0.4
        core_y = cy + spread * 0.1 - 20
        draw.ellipse([core_x - 18, core_y - 18, core_x + 18, core_y + 18], outline=(0, 255, 255), width=3)
        draw.ellipse([core_x - 8, core_y - 8, core_x + 8, core_y + 8], fill=(255, 255, 255))
        draw.text((core_x - 45, core_y - 35), "HOLO-LOGIC CORE", fill=(0, 255, 255))
        draw.line([(core_x, core_y), (core_x, core_y - 20)], fill=(0, 180, 255), width=1)

        # 4. Inductive Power Cell
        batt_x = cx - spread * 1.2
        batt_y = cy + spread * 0.4 - 20
        draw.rectangle([batt_x - 40, batt_y - 8, batt_x + 40, batt_y + 8], outline=(0, 255, 255), width=2, fill=(0, 50, 100))
        draw.line([(batt_x - 30, batt_y), (batt_x + 30, batt_y)], fill=(0, 255, 255), width=4)
        draw.text((batt_x - 45, batt_y + 25), "INDUCTIVE POWER CELL", fill=(0, 255, 255))
        draw.line([(batt_x, batt_y), (batt_x, batt_y + 20)], fill=(0, 180, 255), width=1)

        # 5. Magnetic Dock Lock
        dock_x = cx - spread * 1.8
        dock_y = cy + spread * 0.6 - 20
        draw.polygon([(dock_x - 12, dock_y - 10), (dock_x + 12, dock_y - 10), (dock_x + 8, dock_y + 10), (dock_x - 8, dock_y + 10)], outline=(0, 255, 255), width=2)
        draw.text((dock_x - 35, dock_y - 35), "MAG-LOCK CAP", fill=(0, 255, 255))
        draw.line([(dock_x, dock_y), (dock_x, dock_y - 20)], fill=(0, 180, 255), width=1)

        # Connection Axis Laser
        draw.line([(dock_x, dock_y), (tip_x, tip_y)], fill=(0, 80, 140), width=1)

    elif mode == "assemble":
        # Exploded parts assembling back together
        assemble_progress = 1.0 - progress
        spread = assemble_progress * 130
        
        # Drawing converging parts
        tip_x = cx + spread * 1.5
        tip_y = cy - spread * 0.5 - 20
        body_x = cx + spread * 0.5
        body_y = cy - spread * 0.2 - 20
        core_x = cx - spread * 0.4
        core_y = cy + spread * 0.1 - 20
        batt_x = cx - spread * 1.2
        batt_y = cy + spread * 0.4 - 20
        dock_x = cx - spread * 1.8
        dock_y = cy + spread * 0.6 - 20

        draw.line([(dock_x, dock_y), (tip_x, tip_y)], fill=(0, 255, 255), width=int(2 + progress * 6))
        draw.line([(batt_x, batt_y), (body_x, body_y)], fill=(220, 240, 255), width=12)
        draw_glow_circle(draw, (int(cx), int(cy - 20)), int(15 + assemble_progress * 20), (0, 255, 255), width=2)

    # Status text
    draw.text((cx - 80, HEIGHT - 55), "DELPHINI SMART PEN v3", fill=(0, 255, 255))
    draw.line([(cx - 120, HEIGHT - 35), (cx + 120, HEIGHT - 35)], fill=(0, 180, 255), width=1)

    return np.array(img)

# ----------------------------------------------------
# 3. MAGIC ENERGY VORTEX
# ----------------------------------------------------
def render_magic_frame(t, total_time):
    img = create_base_canvas()
    draw = ImageDraw.Draw(img)
    cx, cy = WIDTH // 2, HEIGHT // 2

    # Vortex Spiral Rings
    for ring in range(8):
        r_angle = t * (2.5 + ring * 0.4)
        rad_x = 40 + ring * 32
        rad_y = 20 + ring * 16
        
        box = [cx - rad_x, cy - rad_y, cx + rad_x, cy + rad_y]
        col_intensity = int(180 + 75 * math.sin(t * 3 + ring))
        draw.ellipse(box, outline=(0, col_intensity, 255), width=2)
    
    # Swirling photon trails
    for p in range(45):
        p_t = t * 3 + (p * 2 * math.pi / 45)
        dist = 30 + (p * 5) % 240
        px = cx + dist * math.cos(p_t)
        py = cy + dist * math.sin(p_t) * 0.6
        p_size = 2 + (p % 3)
        draw.ellipse([px - p_size, py - p_size, px + p_size, py + p_size], fill=(200, 255, 255))

    # Core Quantum Singularity
    sing_size = 18 + math.sin(t * 8) * 6
    draw_glow_circle(draw, (cx, cy), int(sing_size), (0, 255, 255), width=3, glow_layers=4)
    draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(255, 255, 255))

    draw.text((cx - 85, HEIGHT - 55), "QUANTUM FIELD MATRIX", fill=(0, 255, 255))
    return np.array(img)


def generate_video(filename, render_func, duration, mode="default"):
    out_path = os.path.join(VIDEO_DIR, filename)
    print(f"Rendering Video: {filename} ({duration}s @ {FPS}fps)...")
    total_frames = int(duration * FPS)
    
    writer = imageio.get_writer(out_path, fps=FPS, codec='libx264', quality=8, pixelformat='yuv420p')
    for frame_idx in range(total_frames):
        t = frame_idx / FPS
        if mode == "default":
            frame = render_func(t, duration)
        else:
            frame = render_func(t, duration, mode=mode)
        writer.append_data(frame)
    writer.close()
    print(f"  [OK] Saved Video: {out_path} ({os.path.getsize(out_path)} bytes)")

def generate_image(filename, render_func, t_sample, mode="default"):
    out_path = os.path.join(IMAGE_DIR, filename)
    print(f"Rendering Hold Image: {filename}...")
    if mode == "default":
        frame_arr = render_func(t_sample, 5.0)
    else:
        frame_arr = render_func(t_sample, 5.0, mode=mode)
    img = Image.fromarray(frame_arr)
    img.save(out_path, "PNG")
    print(f"  [OK] Saved Image: {out_path} ({os.path.getsize(out_path)} bytes)")


def main():
    print("=== DELPHINI HOLOGRAPHIC ASSET GENERATION ===")
    
    # 1. Generate Character Videos
    generate_video("delphini_hi.mp4", render_delphini_frame, 3.8, mode="hi")
    generate_video("delphini_wave.mp4", render_delphini_frame, 3.5, mode="wave")
    generate_video("delphini_explain.mp4", render_delphini_frame, 5.0, mode="explain")
    
    # 2. Generate Object Videos
    generate_video("pen_show.mp4", render_pen_frame, 4.0, mode="show")
    generate_video("pen_expand.mp4", render_pen_frame, 4.2, mode="expand")
    generate_video("pen_assemble.mp4", render_pen_frame, 3.6, mode="assemble")
    
    # 3. Generate Special Video
    generate_video("delphini_magic.mp4", render_magic_frame, 4.5)

    # 4. Generate Hold Images (The final/persistent hold frame of each sequence)
    generate_image("delphini_idle.png", render_delphini_frame, 0.5, mode="idle")
    generate_image("delphini_hi_hold.png", render_delphini_frame, 3.8, mode="hi")
    generate_image("delphini_explain_hold.png", render_delphini_frame, 5.0, mode="explain")
    generate_image("pen_final.png", render_pen_frame, 4.0, mode="show")
    generate_image("pen_components.png", render_pen_frame, 4.2, mode="expand")
    generate_image("delphini_magic_hold.png", render_magic_frame, 4.5)

    print("\nAll Delphini Holographic Assets Generated Successfully!")

if __name__ == "__main__":
    main()
