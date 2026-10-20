import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = r"c:\wamp64\www\yms\marketing_videos"
os.makedirs(OUTPUT_DIR, exist_ok=True)

IMG_DIR = r"C:\Users\User 1\.gemini\antigravity\brain\2e891ca7-3ccd-4890-9385-a746b36eeea2"

# -------------------------------------------------------------
# Helper: Create text overlay on PIL Image
# -------------------------------------------------------------
def get_font(size):
    try:
        # Standard Windows fonts
        return ImageFont.truetype("arialbd.ttf", size)
    except:
        return ImageFont.load_default()

def create_banner_overlay(pil_img, title, subtitle="", badge_text="ENTERPRISE YMS", color=(37, 99, 235)):
    draw = ImageDraw.Draw(pil_img)
    w, h = pil_img.size

    # Top badge
    font_badge = get_font(max(16, int(h * 0.024)))
    badge_w = len(badge_text) * 11
    badge_box = [(40, 40), (40 + badge_w + 30, 85)]
    draw.rounded_rectangle(badge_box, radius=8, fill=color)
    draw.text((55, 52), badge_text, fill=(255, 255, 255), font=font_badge)

    # Bottom Gradient overlay
    overlay = Image.new("RGBA", pil_img.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    grad_start = int(h * 0.70)
    for y in range(grad_start, h):
        alpha = int(210 * ((y - grad_start) / (h - grad_start)))
        overlay_draw.line([(0, y), (w, y)], fill=(15, 23, 42, alpha))

    pil_img = Image.alpha_composite(pil_img.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(pil_img)

    # Title & Subtitle
    font_title = get_font(max(24, int(h * 0.045)))
    font_sub = get_font(max(18, int(h * 0.028)))

    draw.text((45, int(h * 0.77)), title, fill=(255, 255, 255), font=font_title)
    if subtitle:
        draw.text((45, int(h * 0.85)), subtitle, fill=(56, 189, 248), font=font_sub)

    return pil_img.convert("RGB")

# -------------------------------------------------------------
# Video 1: 9:16 Vertical Reel / TikTok / YouTube Shorts (1080x1920)
# -------------------------------------------------------------
def make_vertical_reel():
    print("Generating 9:16 Vertical Reel / Short Video...")
    fps = 30
    duration_per_scene = 4.0 # seconds
    w, h = 1080, 1920
    out_path = os.path.join(OUTPUT_DIR, "yms_mobile_reel_9x16.mp4")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(out_path, fourcc, fps, (w, h))

    scenes = [
        {
            "img": os.path.join(IMG_DIR, "social_story_reel_promo_1792407966813.jpg"),
            "badge": "LOGISTICS REDEFINED",
            "title": "ELIMINATE YARD DELAYS",
            "subtitle": "Real-Time Gate & Dock Automation"
        },
        {
            "img": os.path.join(IMG_DIR, "yms_yard_map_grid_1792407783888.jpg"),
            "badge": "VISUAL TELEMETRY",
            "title": "LIVE YARD PARKING GRID",
            "subtitle": "Zero Lost Trailers • 100% Slot Control"
        },
        {
            "img": os.path.join(IMG_DIR, "yms_gate_dock_scheduling_1792407803853.jpg"),
            "badge": "SMART SCHEDULING",
            "title": "ZERO DOCK COLLISIONS",
            "subtitle": "Automated Passes & Anti-Overlap Bays"
        },
        {
            "img": os.path.join(IMG_DIR, "yms_operations_dashboard_1792407766144.jpg"),
            "badge": "40% FASTER TURNAROUND",
            "title": "MODERN MERN PLATFORM",
            "subtitle": "Self-Contained • Zero Monthly API Fees"
        }
    ]

    total_frames_per_scene = int(fps * duration_per_scene)

    for sc in scenes:
        raw_img = Image.open(sc["img"]).convert("RGB")
        # Resize to fit 1080x1920 maintaining aspect or center cropping
        target_w, target_h = w, h
        img_ratio = raw_img.width / raw_img.height
        target_ratio = target_w / target_h

        if img_ratio > target_ratio:
            # Image is wider, scale by height
            scale_h = target_h
            scale_w = int(scale_h * img_ratio)
        else:
            # Image is taller, scale by width
            scale_w = target_w
            scale_h = int(scale_w / img_ratio)

        scaled_img = raw_img.resize((scale_w, scale_h), Image.Resampling.LANCZOS)
        
        # Smooth Ken Burns zoom effect across frames
        for f in range(total_frames_per_scene):
            zoom_factor = 1.0 + (f / total_frames_per_scene) * 0.08
            curr_w = int(target_w * zoom_factor)
            curr_h = int(target_h * zoom_factor)

            cropped = scaled_img.crop((
                (scaled_img.width - curr_w) // 2,
                (scaled_img.height - curr_h) // 2,
                (scaled_img.width + curr_w) // 2,
                (scaled_img.height + curr_h) // 2
            )).resize((target_w, target_h), Image.Resampling.BILINEAR)

            overlaid = create_banner_overlay(cropped, sc["title"], sc["subtitle"], sc["badge"])
            frame_np = cv2.cvtColor(np.array(overlaid), cv2.COLOR_RGB2BGR)

            # Fade in transition for first 15 frames
            if f < 15:
                alpha = f / 15.0
                frame_np = (frame_np * alpha).astype(np.uint8)

            writer.write(frame_np)

    writer.release()
    print("Vertical Reel created successfully:", out_path)

# -------------------------------------------------------------
# Video 2: 16:9 Landscape Video for LinkedIn / YouTube (1920x1080)
# -------------------------------------------------------------
def make_landscape_video():
    print("Generating 16:9 Landscape Video for LinkedIn / YouTube...")
    fps = 30
    duration_per_scene = 4.0 # seconds
    w, h = 1920, 1080
    out_path = os.path.join(OUTPUT_DIR, "yms_b2b_presentation_16x9.mp4")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(out_path, fourcc, fps, (w, h))

    scenes = [
        {
            "img": os.path.join(IMG_DIR, "social_linkedin_banner_wide_1792407987547.jpg"),
            "badge": "ENTERPRISE YMS PLATFORM",
            "title": "ACCELERATE GATE TURNAROUND BY 40%",
            "subtitle": "Live Telemetry • Interactive Grid • Conflict-Free Docks"
        },
        {
            "img": os.path.join(IMG_DIR, "yms_operations_dashboard_1792407766144.jpg"),
            "badge": "REAL-TIME COMMAND CENTER",
            "title": "OPERATIONS CONTROL DASHBOARD",
            "subtitle": "100% Calculated Metrics • Proactive CDL Compliance Alerts"
        },
        {
            "img": os.path.join(IMG_DIR, "yms_yard_map_grid_1792407783888.jpg"),
            "badge": "CONCURRENCY-SAFE PARKING",
            "title": "VISUAL YARD PARKING GRID",
            "subtitle": "Color-Coded Statuses • Atomic Allocations • Full Movement Ledger"
        },
        {
            "img": os.path.join(IMG_DIR, "yms_shipment_tracking_timeline_1792407825324.jpg"),
            "badge": "END-TO-END VISIBILITY",
            "title": "CHRONOLOGICAL MILESTONE TRACKING",
            "subtitle": "Public Tracking Portal • Formula-Safe CSV Export Analytics"
        }
    ]

    total_frames_per_scene = int(fps * duration_per_scene)

    for sc in scenes:
        raw_img = Image.open(sc["img"]).convert("RGB")
        scaled_img = raw_img.resize((w, h), Image.Resampling.LANCZOS)

        for f in range(total_frames_per_scene):
            # Slow subtle pan / zoom
            zoom_factor = 1.0 + (f / total_frames_per_scene) * 0.05
            curr_w = int(w * zoom_factor)
            curr_h = int(h * zoom_factor)

            cropped = scaled_img.resize((curr_w, curr_h), Image.Resampling.BILINEAR).crop((
                (curr_w - w) // 2,
                (curr_h - h) // 2,
                (curr_w + w) // 2,
                (curr_h + h) // 2
            ))

            overlaid = create_banner_overlay(cropped, sc["title"], sc["subtitle"], sc["badge"])
            frame_np = cv2.cvtColor(np.array(overlaid), cv2.COLOR_RGB2BGR)

            # Fade in transition
            if f < 15:
                alpha = f / 15.0
                frame_np = (frame_np * alpha).astype(np.uint8)

            writer.write(frame_np)

    writer.release()
    print("Landscape Video created successfully:", out_path)

if __name__ == "__main__":
    make_vertical_reel()
    make_landscape_video()
