import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SNAPSHOT_DIR = r"c:\wamp64\www\yms\marketing_videos\actual_ui_snapshots"
OUTPUT_DIR = r"c:\wamp64\www\yms\marketing_videos"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Font paths
FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REGULAR = r"C:\Windows\Fonts\segoeui.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def draw_rounded_rect(draw, bbox, radius, fill, outline=None, width=1):
    x0, y0, x1, y1 = bbox
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)

def blend_frames(f1, f2, alpha):
    """Smooth crossfade blend between two BGR numpy frames."""
    return cv2.addWeighted(f1, 1.0 - alpha, f2, alpha, 0)

# ==============================================================================
# 1. GENERATE VERTICAL REEL (9:16 - 1080x1920)
# ==============================================================================
def render_vertical_reel():
    print("\n--- Rendering 9:16 Vertical Reel (YouTube Shorts / Instagram Reels) ---")
    width, height = 1080, 1920
    fps = 30
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out_path = os.path.join(OUTPUT_DIR, "yms_real_ui_reel_9x16.mp4")
    writer = cv2.VideoWriter(out_path, fourcc, fps, (width, height))

    scenes = [
        {
            "img_name": "02_dashboard.png",
            "tag": "REAL-TIME OPERATIONS",
            "title": "Live Yard Telemetry & Alerts",
            "bullets": [
                "Real-time fleet & slot occupancy metrics",
                "Automated driver license expiry warnings",
                "Live gate visit turnaround KPIs"
            ],
            "zoom_center": (960, 400),
            "duration_sec": 5.0
        },
        {
            "img_name": "04_printable_gate_pass.png",
            "tag": "GATE PASS AUTOMATION",
            "title": "Instant Gate Check-In & Printable Pass",
            "bullets": [
                "Automated unique gate pass generation",
                "Driver & vehicle verification on arrival",
                "Print-ready receipt with barcode & safety rules"
            ],
            "zoom_center": (960, 540),
            "duration_sec": 5.0
        },
        {
            "img_name": "05_yard_map.png",
            "tag": "VISUAL YARD MANAGEMENT",
            "title": "Interactive Visual Yard Map",
            "bullets": [
                "Color-coded slots (Available, Occupied, Blocked)",
                "Atomic MongoDB concurrency locks",
                "Instant slot reassignment & trailer tracking"
            ],
            "zoom_center": (960, 520),
            "duration_sec": 5.0
        },
        {
            "img_name": "07_dock_appointments.png",
            "tag": "DOCK SCHEDULING",
            "title": "Multi-Bay Dock Appointments",
            "bullets": [
                "Eliminate yard congestion & driver detention",
                "Conflict-free loading & unloading windows",
                "Live status: Scheduled, In Progress, Completed"
            ],
            "zoom_center": (960, 480),
            "duration_sec": 5.0
        },
        {
            "img_name": "09_shipment_timeline.png",
            "tag": "END-TO-END TRACEABILITY",
            "title": "Real Shipment Milestone Timeline",
            "bullets": [
                "Gate-In -> Yard Slot -> Dock Bay -> Departure",
                "Customer-facing public tracking portal",
                "Formula-safe CSV analytics export"
            ],
            "zoom_center": (960, 520),
            "duration_sec": 5.0
        },
        {
            "img_name": "01_login.png",
            "tag": "PRODUCTION MERN STACK",
            "title": "Ready for Distribution Centers & 3PLs",
            "bullets": [
                "Full Source Code: MongoDB, Express, React, Node",
                "Role-Based Security: Admin & Staff permissions",
                "Zero external API dependencies needed"
            ],
            "zoom_center": (960, 540),
            "duration_sec": 5.0
        }
    ]

    total_scenes = len(scenes)

    for s_idx, scene in enumerate(scenes):
        print(f"  Rendering Reel Scene {s_idx + 1}/{total_scenes}: {scene['title']}")
        img_path = os.path.join(SNAPSHOT_DIR, scene["img_name"])
        raw_img = Image.open(img_path).convert("RGBA")
        raw_w, raw_h = raw_img.size

        # Duration frames
        scene_frames = int(scene["duration_sec"] * fps)
        cx, cy = scene["zoom_center"]

        for f in range(scene_frames):
            progress = f / float(scene_frames)
            # Subtle smooth zoom (from 1.0 to 1.14)
            current_zoom = 1.0 + 0.14 * (progress ** 0.8)

            # Crop region around center
            crop_w = int(raw_w / current_zoom)
            crop_h = int(raw_h / current_zoom)
            left = max(0, min(raw_w - crop_w, int(cx - crop_w / 2)))
            top = max(0, min(raw_h - crop_h, int(cy - crop_h / 2)))
            cropped = raw_img.crop((left, top, left + crop_w, top + crop_h))

            # Resize to fit inside reel center viewport (1000 width x 900 height)
            disp_w = 1000
            disp_h = 880
            ui_resized = cropped.resize((disp_w, disp_h), Image.Resampling.LANCZOS)

            # Create vertical canvas (1080 x 1920)
            canvas = Image.new("RGBA", (width, height), (10, 15, 29, 255))
            draw = ImageDraw.Draw(canvas)

            # Ambient background gradient glow
            for gi in range(300):
                g_alpha = int(35 * (1 - gi / 300.0))
                draw.rectangle([0, 100 + gi * 4, width, 104 + gi * 4], fill=(15, 23, 42, 255))

            # Top Header Bar
            header_y = 70
            draw_rounded_rect(draw, [40, header_y, width - 40, header_y + 170], radius=24,
                              fill=(17, 24, 39, 240), outline=(56, 189, 248, 120), width=2)

            # Header Badge
            draw_rounded_rect(draw, [70, header_y + 24, 460, header_y + 64], radius=12,
                              fill=(14, 116, 144, 255))
            f_badge = get_font(FONT_BOLD, 22)
            draw.text((90, header_y + 30), "ENTERPRISE MERN PLATFORM", font=f_badge, fill=(255, 255, 255, 255))

            # Header Live Indicator
            draw.ellipse([880, header_y + 36, 898, header_y + 54], fill=(34, 197, 94, 255))
            f_live = get_font(FONT_BOLD, 20)
            draw.text((912, header_y + 34), "LIVE SYSTEM", font=f_live, fill=(34, 197, 94, 255))

            # Header Main Title
            f_head = get_font(FONT_BOLD, 46)
            draw.text((70, header_y + 85), "Yard Management System", font=f_head, fill=(248, 250, 252, 255))
            f_subhead = get_font(FONT_REGULAR, 26)
            draw.text((72, header_y + 138), "Complete Digital Yard, Gate & Dock Operations", font=f_subhead, fill=(148, 163, 184, 255))

            # Center Display: UI Screenshot with frame & shadow
            ui_x = (width - disp_w) // 2
            ui_y = 280

            # Outer border / device bezel
            draw_rounded_rect(draw, [ui_x - 12, ui_y - 12, ui_x + disp_w + 12, ui_y + disp_h + 12],
                              radius=20, fill=(30, 41, 59, 255), outline=(59, 130, 246, 180), width=2)
            canvas.paste(ui_resized, (ui_x, ui_y))

            # Floating screenshot watermark tag
            draw_rounded_rect(draw, [ui_x + 20, ui_y + 20, ui_x + 360, ui_y + 60], radius=10,
                              fill=(15, 23, 42, 220), outline=(56, 189, 248, 200), width=1)
            f_watermark = get_font(FONT_BOLD, 20)
            draw.text((ui_x + 35, ui_y + 26), "ACTUAL RUNNING SOFTWARE", font=f_watermark, fill=(56, 189, 248, 255))

            # Bottom Lower-Third Glassmorphism Card
            card_y = 1200
            card_h = 570
            draw_rounded_rect(draw, [40, card_y, width - 40, card_y + card_h], radius=28,
                              fill=(15, 23, 42, 245), outline=(99, 102, 241, 140), width=2)

            # Feature Tag Badge
            tag_w = 400
            draw_rounded_rect(draw, [70, card_y + 35, 70 + tag_w, card_y + 80], radius=12,
                              fill=(79, 70, 229, 255))
            f_tag = get_font(FONT_BOLD, 22)
            draw.text((95, card_y + 44), scene["tag"], font=f_tag, fill=(255, 255, 255, 255))

            # Scene Title
            f_title = get_font(FONT_BOLD, 42)
            draw.text((70, card_y + 105), scene["title"], font=f_title, fill=(255, 255, 255, 255))

            # Bullet points
            bullet_y = card_y + 185
            f_bullet = get_font(FONT_REGULAR, 30)
            f_check = get_font(FONT_BOLD, 30)
            for b_idx, bullet in enumerate(scene["bullets"]):
                by = bullet_y + b_idx * 78
                # Checkmark icon circle
                draw.ellipse([70, by + 4, 102, by + 36], fill=(16, 185, 129, 255))
                draw.text((78, by + 2), "✓", font=f_check, fill=(255, 255, 255, 255))
                draw.text((120, by + 2), bullet, font=f_bullet, fill=(226, 232, 240, 255))

            # Bottom Scene Progress Bar
            bar_y = card_y + card_h - 40
            total_bar_w = width - 140
            draw.rectangle([70, bar_y, 70 + total_bar_w, bar_y + 8], fill=(51, 65, 85, 255))
            
            # Progress fill across scenes
            overall_progress = (s_idx + progress) / total_scenes
            filled_w = int(total_bar_w * overall_progress)
            draw.rectangle([70, bar_y, 70 + filled_w, bar_y + 8], fill=(56, 189, 248, 255))

            # Footer Call to Action
            f_cta = get_font(FONT_BOLD, 26)
            draw.text((70, 1810), "⚡ Built for High-Volume Yards • 100% MERN Monorepo", font=f_cta, fill=(148, 163, 184, 255))

            # Convert PIL RGB to OpenCV BGR
            frame_np = np.array(canvas.convert("RGB"))
            frame_bgr = cv2.cvtColor(frame_np, cv2.COLOR_RGB2BGR)

            writer.write(frame_bgr)

    writer.release()
    print(f"Vertical Reel saved successfully: {out_path} ({os.path.getsize(out_path)} bytes)")

# ==============================================================================
# 2. GENERATE LANDSCAPE PRESENTATION (16:9 - 1920x1080)
# ==============================================================================
def render_landscape_presentation():
    print("\n--- Rendering 16:9 Landscape Presentation (LinkedIn / YouTube) ---")
    width, height = 1920, 1080
    fps = 30
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out_path = os.path.join(OUTPUT_DIR, "yms_real_ui_presentation_16x9.mp4")
    writer = cv2.VideoWriter(out_path, fourcc, fps, (width, height))

    scenes = [
        {
            "img_name": "02_dashboard.png",
            "section": "01 / FLEET TELEMETRY & OVERVIEW",
            "title": "Real-Time Operations Dashboard & Driver Expiry Telemetry",
            "subtitle": "Live Recharts fleet KPIs, turnaround time calculations & instant driver CDL compliance notifications.",
            "pan_start": (0.0, 0.0),
            "pan_end": (0.05, 0.04),
            "duration_sec": 6.0
        },
        {
            "img_name": "04_printable_gate_pass.png",
            "section": "02 / GATE MANAGEMENT & PASSES",
            "title": "Automated Gate Check-In with Official Printable Passes",
            "subtitle": "Unique pass numbers, server-verified entry timestamps, driver authorization & print-ready receipts.",
            "pan_start": (0.02, 0.02),
            "pan_end": (0.0, 0.0),
            "duration_sec": 6.0
        },
        {
            "img_name": "05_yard_map.png",
            "section": "03 / INTERACTIVE YARD ALLOCATION",
            "title": "Visual Yard Map Grid with Conflict-Free Slot Locks",
            "subtitle": "Color-coded parking zones (Available / Occupied / Blocked), atomic updates & live trailer movement history.",
            "pan_start": (0.0, 0.03),
            "pan_end": (0.04, 0.0),
            "duration_sec": 6.0
        },
        {
            "img_name": "06_slot_allocated_modal.png",
            "section": "04 / SLOT ASSET AUDIT",
            "title": "Detailed Vehicle Allocation & Real-Time Driver Manifest",
            "subtitle": "Single-click inspection of active trailers, driver license records, assigned bay, and check-in duration.",
            "pan_start": (0.03, 0.0),
            "pan_end": (0.0, 0.02),
            "duration_sec": 5.5
        },
        {
            "img_name": "07_dock_appointments.png",
            "section": "05 / DOCK BAY SCHEDULING",
            "title": "Multi-Bay Appointment Management & Turnaround Optimization",
            "subtitle": "Prevent yard congestion and driver detention fees with strict loading/unloading operational time-slots.",
            "pan_start": (0.0, 0.02),
            "pan_end": (0.03, 0.05),
            "duration_sec": 6.0
        },
        {
            "img_name": "09_shipment_timeline.png",
            "section": "06 / SHIPMENT MILESTONES",
            "title": "Complete Shipment Milestone Auditing & Event Timeline",
            "subtitle": "Real-time lifecycle tracking: Gate Check-in -> Yard Allocated -> Dock Loading -> Exit Departure.",
            "pan_start": (0.02, 0.04),
            "pan_end": (0.0, 0.0),
            "duration_sec": 6.0
        },
        {
            "img_name": "11_public_tracking.png",
            "section": "07 / PUBLIC PORTAL & ENTERPRISE ARCHITECTURE",
            "title": "Shipper Self-Service Portal • Zero External Dependencies",
            "subtitle": "Production-ready MERN Stack (MongoDB, Express, React, Node) with HTTP-only JWT & secure CSV exports.",
            "pan_start": (0.0, 0.0),
            "pan_end": (0.03, 0.03),
            "duration_sec": 6.0
        }
    ]

    total_scenes = len(scenes)

    for s_idx, scene in enumerate(scenes):
        print(f"  Rendering Landscape Scene {s_idx + 1}/{total_scenes}: {scene['title']}")
        img_path = os.path.join(SNAPSHOT_DIR, scene["img_name"])
        raw_img = Image.open(img_path).convert("RGBA")
        raw_w, raw_h = raw_img.size

        scene_frames = int(scene["duration_sec"] * fps)
        p_start_x, p_start_y = scene["pan_start"]
        p_end_x, p_end_y = scene["pan_end"]

        for f in range(scene_frames):
            prog = f / float(scene_frames)
            
            # Subtle pan and zoom (1.00 -> 1.05)
            zoom = 1.0 + 0.05 * prog
            cw = int(raw_w / zoom)
            ch = int(raw_h / zoom)

            cur_px = p_start_x + (p_end_x - p_start_x) * prog
            cur_py = p_start_y + (p_end_y - p_start_y) * prog

            left = int((raw_w - cw) * cur_px)
            top = int((raw_h - ch) * cur_py)
            cropped = raw_img.crop((left, top, left + cw, top + ch))
            frame_img = cropped.resize((width, height), Image.Resampling.LANCZOS)

            draw = ImageDraw.Draw(frame_img)

            # Top branding bar (translucent dark ribbon)
            top_bar_h = 70
            draw.rectangle([0, 0, width, top_bar_h], fill=(15, 23, 42, 230))
            draw.line([0, top_bar_h, width, top_bar_h], fill=(56, 189, 248, 120), width=1)

            # Left logo text
            f_logo = get_font(FONT_BOLD, 26)
            draw.text((40, 18), "YMS ENTERPRISE", font=f_logo, fill=(255, 255, 255, 255))
            f_logo_sub = get_font(FONT_REGULAR, 20)
            draw.text((275, 24), "• Full MERN Logistics Platform", font=f_logo_sub, fill=(148, 163, 184, 255))

            # Right status watermark badge
            badge_x = width - 440
            draw_rounded_rect(draw, [badge_x, 14, badge_x + 400, 56], radius=10,
                              fill=(30, 41, 59, 220), outline=(52, 211, 153, 180), width=1)
            draw.ellipse([badge_x + 18, 28, badge_x + 32, 42], fill=(34, 197, 94, 255))
            f_stat = get_font(FONT_BOLD, 18)
            draw.text((badge_x + 42, 24), "ACTUAL SYSTEM SCREENSHOT", font=f_stat, fill=(52, 211, 153, 255))

            # Bottom Lower-Third Widescreen Overlay
            lower_h = 160
            lower_y = height - lower_h - 30
            card_w = width - 80
            draw_rounded_rect(draw, [40, lower_y, 40 + card_w, lower_y + lower_h], radius=18,
                              fill=(15, 23, 42, 245), outline=(99, 102, 241, 160), width=2)

            # Section Accent Pill
            f_sec = get_font(FONT_BOLD, 18)
            sec_w = 420
            draw_rounded_rect(draw, [65, lower_y + 18, 65 + sec_w, lower_y + 48], radius=8,
                              fill=(79, 70, 229, 255))
            draw.text((80, lower_y + 22), scene["section"], font=f_sec, fill=(255, 255, 255, 255))

            # Scene Title
            f_title = get_font(FONT_BOLD, 32)
            draw.text((65, lower_y + 60), scene["title"], font=f_title, fill=(248, 250, 252, 255))

            # Subtitle
            f_sub = get_font(FONT_REGULAR, 22)
            draw.text((65, lower_y + 106), scene["subtitle"], font=f_sub, fill=(148, 163, 184, 255))

            # Bottom Timeline Tracker Bar
            bar_y = lower_y + lower_h - 6
            overall_prog = (s_idx + prog) / total_scenes
            draw.rectangle([40, bar_y, 40 + card_w, bar_y + 6], fill=(30, 41, 59, 255))
            draw.rectangle([40, bar_y, 40 + int(card_w * overall_prog), bar_y + 6], fill=(56, 189, 248, 255))

            frame_np = np.array(frame_img.convert("RGB"))
            frame_bgr = cv2.cvtColor(frame_np, cv2.COLOR_RGB2BGR)

            writer.write(frame_bgr)

    writer.release()
    print(f"Landscape Presentation saved successfully: {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    render_vertical_reel()
    render_landscape_presentation()
    print("\nALL REAL-UI MARKETING VIDEOS PRODUCED SUCCESSFULLY!")
