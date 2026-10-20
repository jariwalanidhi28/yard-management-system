import os
import re
import cv2
import asyncio
import edge_tts
import subprocess
import numpy as np
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
OUTPUT_DIR = r"c:\wamp64\www\yms\marketing_videos"
AUDIO_DIR = os.path.join(OUTPUT_DIR, "explainer_audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

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

def get_audio_duration(file_path):
    res = subprocess.run([FFMPEG_EXE, '-i', file_path], stderr=subprocess.PIPE, text=True)
    m = re.search(r'Duration:\s*(\d+):(\d+):(\d+\.\d+)', res.stderr)
    if m:
        h, mn, s = map(float, m.groups())
        return h * 3600 + mn * 60 + s
    return 6.0

SCENES = [
    {
        "id": "scene1_problem",
        "tag": "THE WAREHOUSE CHALLENGE",
        "tag_color": (239, 68, 68), # Red
        "title": "Why Distribution Yards Lose Thousands Daily",
        "subtitle": "Unorganized yards create chronic bottlenecks, demurrage fines, and driver frustration.",
        "voice_script": "Managing a distribution yard manually is chaotic. Trucks backed up at the gate, misplaced trailers in crowded lots, and dock scheduling delays that cost companies thousands of dollars in detention fees.",
        "points": [
            ("Gate Congestion", "Long driver queues blocking entryways and delaying shipments"),
            ("Lost Trailers", "Hours wasted locating misplaced containers across massive yards"),
            ("Dock Bottlenecks", "Loading bays double-booked or sitting completely idle"),
            ("Expensive Detention", "Carriers charge $75 to $150 per hour for driver delays")
        ],
        "metric": "OVER $250,000",
        "metric_label": "Wasted yearly on yard inefficiencies & penalties"
    },
    {
        "id": "scene2_solution",
        "tag": "THE MODERN SOLUTION",
        "tag_color": (59, 130, 246), # Blue
        "title": "The All-In-One Digital Yard Management System",
        "subtitle": "Complete digital orchestration from initial gate arrival to final warehouse departure.",
        "voice_script": "Meet the modern Yard Management System. An intelligent, real-time platform engineered to automate your gates, allocate parking slots, and schedule dock loading with zero confusion.",
        "points": [
            ("Real-Time Fleet Visibility", "Instant status of every truck, trailer, and driver on site"),
            ("Automated Gate Check-In", "Issue digital and printable passes in under thirty seconds"),
            ("Smart Yard Mapping", "Visual slot allocation that prevents double-booking"),
            ("Synchronized Dock Bays", "Eliminate dwell times with conflict-free scheduling")
        ],
        "metric": "100% VISIBILITY",
        "metric_label": "Total operational control for dispatchers & security"
    },
    {
        "id": "scene3_gate",
        "tag": "STEP 1: GATE AUTOMATION",
        "tag_color": (16, 185, 129), # Green
        "title": "Rapid Gate Entry & Digital Barcode Passes",
        "subtitle": "Automate security check-in, verify credentials, and enforce safety compliance instantly.",
        "voice_script": "When a truck arrives, security verifies the driver and commercial license in seconds. The system instantly generates an official printable gate pass with a barcode, purpose of visit, and yard safety rules.",
        "points": [
            ("Driver License Verification", "Automatic alerts for expired commercial driving licenses"),
            ("Instant Gate Pass", "Unique auto-generated pass with barcode identification"),
            ("Print-Ready Documentation", "Clear yard safety rules and visit receipt for the driver"),
            ("Server-Verified Timestamps", "Accurate check-in logging for tamper-proof auditing")
        ],
        "metric": "< 45 SECONDS",
        "metric_label": "Average check-in time per freight carrier"
    },
    {
        "id": "scene4_yard_map",
        "tag": "STEP 2: SMART YARD ALLOCATION",
        "tag_color": (168, 85, 247), # Purple
        "title": "Visual Yard Map & Conflict-Free Parking",
        "subtitle": "Dynamic color-coded slot management with atomic locks to prevent lost trailers.",
        "voice_script": "Next, where does the trailer park? The interactive visual yard map assigns the vehicle to a designated, conflict-free parking slot. Green for available, red for occupied, and amber for blocked.",
        "points": [
            ("Visual Grid Map", "Grouped by zones: Dry Staging, Refrigerated, and Outbound"),
            ("Color-Coded Status", "Green Available, Red Occupied, Amber Maintenance"),
            ("Conflict-Free Concurrency", "Atomic database locking guarantees zero double-booking"),
            ("Instant Reassignment", "Move trailers between slots with a single click")
        ],
        "metric": "ZERO CONFLICTS",
        "metric_label": "Guaranteed trailer location accuracy across the yard"
    },
    {
        "id": "scene5_dock",
        "tag": "STEP 3: DOCK BAY APPOINTMENTS",
        "tag_color": (245, 158, 11), # Amber
        "title": "Optimized Multi-Bay Dock Scheduling",
        "subtitle": "Eliminate driver detention by coordinating loading and unloading windows in advance.",
        "voice_script": "When cargo is ready, the system schedules the truck to an active dock bay. Turnaround windows are strictly coordinated, preventing warehouse bottlenecks and keeping your warehouse running at peak capacity.",
        "points": [
            ("Multi-Bay Timeline", "Visual daily and weekly calendar across all facility docks"),
            ("Turnaround Windows", "Calculates exact dwell duration and loading speed"),
            ("Status Tracking", "Live updates: Scheduled, In Progress, Completed, Cancelled"),
            ("Maintenance Locking", "Automatically flags bays under repair to avoid delays")
        ],
        "metric": "+40% CAPACITY",
        "metric_label": "Increased warehouse dock throughput per shift"
    },
    {
        "id": "scene6_traceability",
        "tag": "STEP 4: COMPLETE TRACEABILITY",
        "tag_color": (6, 182, 212), # Cyan
        "title": "End-to-End Milestones & Customer Tracking",
        "subtitle": "Audit every operational event from arrival to departure with public customer visibility.",
        "voice_script": "Every single movement is audited. From gate check-in and slot parking to dock operations and departure, milestones are recorded live. Shippers can even track deliveries through the public self-service tracking portal.",
        "points": [
            ("Milestone Event Chain", "Gate In -> Yard Staging -> Dock Loading -> Gate Exit"),
            ("Public Tracking Portal", "Shippers check delivery status with tracking numbers"),
            ("Formula-Safe Export", "Download CSV compliance audits protected against injection"),
            ("Role-Based Security", "Strict Admin and Staff access permissions with secure cookies")
        ],
        "metric": "100% AUDITABLE",
        "metric_label": "Complete timestamped history for every single shipment"
    },
    {
        "id": "scene7_roi",
        "tag": "BUSINESS IMPACT & ROI",
        "tag_color": (16, 185, 129), # Green
        "title": "Transform Your Yard Into a Competitive Advantage",
        "subtitle": "Drastically cut costs, accelerate throughput, and eliminate carrier detention fees.",
        "voice_script": "The result? A sixty percent reduction in truck dwell times, zero lost trailers, eliminated detention fees, and total operational control. Transform your distribution yard today.",
        "points": [
            ("60% Less Dwell Time", "Trucks move in and out of your facility twice as fast"),
            ("Zero Detention Fees", "Save tens of thousands in carrier detention penalties"),
            ("Complete Monorepo Code", "Production-grade MERN stack ready for instant deployment"),
            ("Scalable Architecture", "Self-contained with zero required external API costs")
        ],
        "metric": "60% FASTER",
        "metric_label": "Reduction in total truck turnaround time"
    }
]

async def generate_narration_audio():
    print("Generating crystal-clear AI voice narration using edge-tts...")
    # Voice: en-US-BrianNeural (Professional, authoritative corporate tone)
    voice = "en-US-BrianNeural"
    audio_files = []

    for idx, scene in enumerate(SCENES):
        audio_path = os.path.join(AUDIO_DIR, f"{scene['id']}.mp3")
        print(f"  Synthesizing Voice [{idx+1}/{len(SCENES)}]: {scene['tag']}...")
        comm = edge_tts.Communicate(scene["voice_script"], voice, rate="+2%")
        await comm.save(audio_path)
        dur = get_audio_duration(audio_path)
        scene["audio_path"] = audio_path
        # Add 0.8s buffer for comfortable visual breathing room
        scene["duration_sec"] = max(dur + 0.8, 5.0)
        print(f"    -> Duration: {dur:.2f}s (Allocated scene time: {scene['duration_sec']:.2f}s)")
        audio_files.append(audio_path)

    # Concatenate all audio files into a single master audio track
    master_audio = os.path.join(OUTPUT_DIR, "master_narration.mp3")
    concat_list_file = os.path.join(AUDIO_DIR, "concat_list.txt")
    with open(concat_list_file, "w") as f:
        for a_file in audio_files:
            f.write(f"file '{a_file}'\n")

    subprocess.run([
        FFMPEG_EXE, '-y', '-f', 'concat', '-safe', '0',
        '-i', concat_list_file, '-c', 'copy', master_audio
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Master narration audio created: {master_audio}")
    return master_audio

# ==============================================================================
# RENDER LANDSCAPE EXPLAINER (16:9 - 1920x1080)
# ==============================================================================
def render_landscape_explainer():
    print("\n--- Rendering Landscape Explainer Video (16:9 - 1920x1080) ---")
    width, height = 1920, 1080
    fps = 30
    temp_video = os.path.join(OUTPUT_DIR, "temp_landscape.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(temp_video, fourcc, fps, (width, height))

    total_scenes = len(SCENES)

    for s_idx, scene in enumerate(SCENES):
        frames_count = int(scene["duration_sec"] * fps)
        print(f"  Rendering Landscape Scene {s_idx+1}/{total_scenes}: {scene['title']} ({frames_count} frames)...")

        for f in range(frames_count):
            prog = f / float(frames_count)

            # High-end Dark Gradient Canvas (Slate-950)
            img = Image.new("RGBA", (width, height), (10, 15, 29, 255))
            draw = ImageDraw.Draw(img)

            # Ambient cyber-grid / background lighting
            for li in range(0, width, 80):
                draw.line([li, 0, li, height], fill=(18, 26, 45, 120), width=1)
            for li in range(0, height, 80):
                draw.line([0, li, width, li], fill=(18, 26, 45, 120), width=1)

            # Ambient radial glow top center
            draw.ellipse([width//2 - 600, -200, width//2 + 600, 400], fill=(22, 38, 70, 160))

            # Top Navigation Header Bar
            header_y = 45
            draw_rounded_rect(draw, [60, header_y, width - 60, header_y + 80], radius=16,
                              fill=(15, 23, 42, 230), outline=(51, 65, 85, 200), width=1)

            # Left Brand
            f_brand = get_font(FONT_BOLD, 26)
            draw.text((95, header_y + 22), "YMS ENTERPRISE", font=f_brand, fill=(255, 255, 255, 255))
            f_brand_sub = get_font(FONT_REGULAR, 20)
            draw.text((340, header_y + 26), "• Automated Yard & Logistics Management", font=f_brand_sub, fill=(148, 163, 184, 255))

            # Right Step indicator
            f_step = get_font(FONT_BOLD, 18)
            draw_rounded_rect(draw, [width - 320, header_y + 18, width - 90, header_y + 62], radius=10,
                              fill=(30, 41, 59, 255), outline=scene["tag_color"], width=1)
            draw.text((width - 300, header_y + 26), f"PHASE {s_idx+1} OF {total_scenes}", font=f_step, fill=scene["tag_color"])

            # Left Hero Section (Explainer Header)
            content_y = 160

            # Scene Tag Badge
            f_tag = get_font(FONT_BOLD, 18)
            tag_text = scene["tag"]
            draw_rounded_rect(draw, [65, content_y, 450, content_y + 40], radius=8,
                              fill=scene["tag_color"])
            draw.text((85, content_y + 8), tag_text, font=f_tag, fill=(255, 255, 255, 255))

            # Scene Main Title
            f_title = get_font(FONT_BOLD, 46)
            draw.text((65, content_y + 55), scene["title"], font=f_title, fill=(248, 250, 252, 255))

            # Scene Subtitle
            f_sub = get_font(FONT_REGULAR, 24)
            draw.text((68, content_y + 118), scene["subtitle"], font=f_sub, fill=(148, 163, 184, 255))

            # 4 Key Feature / Workflow Cards (2x2 Grid)
            card_start_y = 360
            card_w = 540
            card_h = 165
            coords = [
                (65, card_start_y),
                (65 + card_w + 25, card_start_y),
                (65, card_start_y + card_h + 20),
                (65 + card_w + 25, card_start_y + card_h + 20)
            ]

            f_card_head = get_font(FONT_BOLD, 22)
            f_card_desc = get_font(FONT_REGULAR, 18)
            f_num = get_font(FONT_BOLD, 20)

            for p_idx, (p_title, p_desc) in enumerate(scene["points"]):
                cx, cy = coords[p_idx]
                draw_rounded_rect(draw, [cx, cy, cx + card_w, cy + card_h], radius=16,
                                  fill=(17, 24, 39, 240), outline=(51, 65, 85, 180), width=1)

                # Icon/Number pill
                draw_rounded_rect(draw, [cx + 20, cy + 22, cx + 58, cy + 60], radius=8,
                                  fill=scene["tag_color"])
                draw.text((cx + 31, cy + 28), str(p_idx + 1), font=f_num, fill=(255, 255, 255, 255))

                draw.text((cx + 75, cy + 26), p_title, font=f_card_head, fill=(241, 245, 249, 255))

                # Multi-line word wrapping for card description
                desc_words = p_desc.split(" ")
                line1 = " ".join(desc_words[:6])
                line2 = " ".join(desc_words[6:])
                draw.text((cx + 75, cy + 68), line1, font=f_card_desc, fill=(148, 163, 184, 255))
                if line2:
                    draw.text((cx + 75, cy + 96), line2, font=f_card_desc, fill=(148, 163, 184, 255))

            # Right Big Metric / Impact Showcase Panel
            right_x = 1220
            right_w = 640
            right_h = card_h * 2 + 20
            draw_rounded_rect(draw, [right_x, card_start_y, right_x + right_w, card_start_y + right_h],
                              radius=20, fill=(15, 23, 42, 250), outline=scene["tag_color"], width=2)

            # Metric Header
            draw_rounded_rect(draw, [right_x + 30, card_start_y + 35, right_x + right_w - 30, card_start_y + 75],
                              radius=8, fill=(30, 41, 59, 255))
            f_panel_tag = get_font(FONT_BOLD, 18)
            draw.text((right_x + 50, card_start_y + 44), "KEY SYSTEM DELIVERABLE", font=f_panel_tag, fill=scene["tag_color"])

            # Big Stat Number
            f_metric = get_font(FONT_BOLD, 68)
            draw.text((right_x + 45, card_start_y + 110), scene["metric"], font=f_metric, fill=(255, 255, 255, 255))

            # Metric Description
            f_metric_lbl = get_font(FONT_REGULAR, 22)
            draw.text((right_x + 50, card_start_y + 205), scene["metric_label"], font=f_metric_lbl, fill=(148, 163, 184, 255))

            # Live Workflow Diagram Box inside right panel
            wf_y = card_start_y + 265
            draw_rounded_rect(draw, [right_x + 30, wf_y, right_x + right_w - 30, wf_y + 65], radius=10,
                              fill=(24, 33, 54, 255), outline=(56, 189, 248, 100), width=1)
            f_wf = get_font(FONT_BOLD, 18)
            draw.text((right_x + 50, wf_y + 22), "▶ GATE-IN  ➜  YARD MAP  ➜  DOCK  ➜  GATE-OUT", font=f_wf, fill=(56, 189, 248, 255))

            # Bottom Subtitle / Voice Narration Caption Banner
            sub_bar_y = height - 160
            sub_bar_h = 105
            draw_rounded_rect(draw, [60, sub_bar_y, width - 60, sub_bar_y + sub_bar_h], radius=16,
                              fill=(15, 23, 42, 250), outline=(99, 102, 241, 180), width=2)

            # Speaker Icon + Tag
            draw_rounded_rect(draw, [85, sub_bar_y + 18, 235, sub_bar_y + 50], radius=6, fill=(79, 70, 229, 255))
            f_spk = get_font(FONT_BOLD, 16)
            draw.text((100, sub_bar_y + 23), "🔊 NARRATION", font=f_spk, fill=(255, 255, 255, 255))

            # Spoken Voiceover Text (Subtitles)
            f_voice = get_font(FONT_REGULAR, 22)
            draw.text((255, sub_bar_y + 20), f'"{scene["voice_script"]}"', font=f_voice, fill=(241, 245, 249, 255))

            # Bottom Scene Progress Bar
            prog_y = sub_bar_y + sub_bar_h - 6
            bar_w = width - 120
            draw.rectangle([60, prog_y, 60 + bar_w, prog_y + 6], fill=(30, 41, 59, 255))
            overall_prog = (s_idx + prog) / total_scenes
            draw.rectangle([60, prog_y, 60 + int(bar_w * overall_prog), prog_y + 6], fill=(56, 189, 248, 255))

            frame_np = np.array(img.convert("RGB"))
            frame_bgr = cv2.cvtColor(frame_np, cv2.COLOR_RGB2BGR)
            writer.write(frame_bgr)

    writer.release()
    print(f"Temporary landscape video rendered: {temp_video}")
    return temp_video

# ==============================================================================
# RENDER VERTICAL EXPLAINER (9:16 - 1080x1920)
# ==============================================================================
def render_vertical_explainer():
    print("\n--- Rendering Vertical Explainer Video (9:16 - 1080x1920) ---")
    width, height = 1080, 1920
    fps = 30
    temp_video = os.path.join(OUTPUT_DIR, "temp_vertical.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(temp_video, fourcc, fps, (width, height))

    total_scenes = len(SCENES)

    for s_idx, scene in enumerate(SCENES):
        frames_count = int(scene["duration_sec"] * fps)
        print(f"  Rendering Vertical Scene {s_idx+1}/{total_scenes}: {scene['title']} ({frames_count} frames)...")

        for f in range(frames_count):
            prog = f / float(frames_count)

            img = Image.new("RGBA", (width, height), (10, 15, 29, 255))
            draw = ImageDraw.Draw(img)

            # Top Header Card
            top_y = 65
            draw_rounded_rect(draw, [40, top_y, width - 40, top_y + 130], radius=20,
                              fill=(17, 24, 39, 240), outline=scene["tag_color"], width=2)
            f_top = get_font(FONT_BOLD, 34)
            draw.text((70, top_y + 25), "YARD MANAGEMENT SYSTEM", font=f_top, fill=(255, 255, 255, 255))
            f_top_sub = get_font(FONT_REGULAR, 22)
            draw.text((72, top_y + 75), f"HOW IT WORKS • PHASE {s_idx+1} OF {total_scenes}", font=f_top_sub, fill=(148, 163, 184, 255))

            # Phase Tag
            tag_y = 230
            draw_rounded_rect(draw, [50, tag_y, 450, tag_y + 46], radius=10, fill=scene["tag_color"])
            f_tag = get_font(FONT_BOLD, 20)
            draw.text((70, tag_y + 11), scene["tag"], font=f_tag, fill=(255, 255, 255, 255))

            # Scene Title
            f_title = get_font(FONT_BOLD, 46)
            # Wrap title for vertical
            t_words = scene["title"].split(" ")
            t_line1 = " ".join(t_words[:4])
            t_line2 = " ".join(t_words[4:])
            draw.text((50, tag_y + 70), t_line1, font=f_title, fill=(248, 250, 252, 255))
            if t_line2:
                draw.text((50, tag_y + 130), t_line2, font=f_title, fill=(248, 250, 252, 255))

            # Big Metric Hero Card in Center
            hero_y = tag_y + 220
            hero_h = 240
            draw_rounded_rect(draw, [50, hero_y, width - 50, hero_y + hero_h], radius=24,
                              fill=(15, 23, 42, 250), outline=scene["tag_color"], width=2)

            f_hl = get_font(FONT_BOLD, 22)
            draw.text((80, hero_y + 25), "KEY DELIVERABLE & RESULT", font=f_hl, fill=scene["tag_color"])

            f_m = get_font(FONT_BOLD, 64)
            draw.text((80, hero_y + 65), scene["metric"], font=f_m, fill=(255, 255, 255, 255))

            f_ml = get_font(FONT_REGULAR, 26)
            draw.text((82, hero_y + 160), scene["metric_label"], font=f_ml, fill=(148, 163, 184, 255))

            # 4 Vertical Explainer Feature Rows
            rows_y = hero_y + hero_h + 35
            row_h = 135
            f_rh = get_font(FONT_BOLD, 26)
            f_rd = get_font(FONT_REGULAR, 22)
            f_num = get_font(FONT_BOLD, 22)

            for p_idx, (p_title, p_desc) in enumerate(scene["points"]):
                ry = rows_y + p_idx * (row_h + 16)
                draw_rounded_rect(draw, [50, ry, width - 50, ry + row_h], radius=16,
                                  fill=(17, 24, 39, 240), outline=(51, 65, 85, 180), width=1)

                # Step Badge
                draw_rounded_rect(draw, [75, ry + 20, 115, ry + 60], radius=8, fill=scene["tag_color"])
                draw.text((87, ry + 26), str(p_idx + 1), font=f_num, fill=(255, 255, 255, 255))

                draw.text((135, ry + 24), p_title, font=f_rh, fill=(241, 245, 249, 255))

                desc_short = p_desc if len(p_desc) <= 52 else p_desc[:49] + "..."
                draw.text((135, ry + 72), desc_short, font=f_rd, fill=(148, 163, 184, 255))

            # Bottom Subtitle / Voice Caption Card
            cap_y = 1440
            cap_h = 360
            draw_rounded_rect(draw, [40, cap_y, width - 40, cap_y + cap_h], radius=24,
                              fill=(15, 23, 42, 255), outline=(99, 102, 241, 200), width=2)

            draw_rounded_rect(draw, [70, cap_y + 25, 260, cap_y + 68], radius=8, fill=(79, 70, 229, 255))
            f_spk = get_font(FONT_BOLD, 20)
            draw.text((90, cap_y + 34), "🔊 NARRATION", font=f_spk, fill=(255, 255, 255, 255))

            f_sub_body = get_font(FONT_REGULAR, 28)
            # Wrap subtitle text
            sub_words = scene["voice_script"].split(" ")
            s_lines = []
            curr_line = []
            for w in sub_words:
                curr_line.append(w)
                if len(" ".join(curr_line)) > 34:
                    s_lines.append(" ".join(curr_line))
                    curr_line = []
            if curr_line:
                s_lines.append(" ".join(curr_line))

            for l_idx, line in enumerate(s_lines[:5]):
                draw.text((70, cap_y + 90 + l_idx * 45), line, font=f_sub_body, fill=(241, 245, 249, 255))

            # Bottom Overall Progress Bar
            bar_y = height - 50
            total_w = width - 80
            draw.rectangle([40, bar_y, 40 + total_w, bar_y + 10], fill=(30, 41, 59, 255))
            overall_prog = (s_idx + prog) / total_scenes
            draw.rectangle([40, bar_y, 40 + int(total_w * overall_prog), bar_y + 10], fill=(56, 189, 248, 255))

            frame_np = np.array(img.convert("RGB"))
            frame_bgr = cv2.cvtColor(frame_np, cv2.COLOR_RGB2BGR)
            writer.write(frame_bgr)

    writer.release()
    print(f"Temporary vertical video rendered: {temp_video}")
    return temp_video

def multiplex_audio_and_video(video_path, audio_path, output_path):
    print(f"\nMultiplexing voiceover audio into {output_path}...")
    cmd = [
        FFMPEG_EXE, '-y',
        '-i', video_path,
        '-i', audio_path,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        output_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        print(f"SUCCESS: Final video created: {output_path} ({os.path.getsize(output_path)} bytes)")
    else:
        print(f"ERROR: Multiplexing failed:\n{res.stderr.decode('utf-8', errors='ignore')}")

async def main():
    print("=" * 70)
    print("STARTING FULL NARRATED MARKETING EXPLAINER VIDEO GENERATION")
    print("=" * 70)

    # 1. Generate Voice Narration & Audio Track
    master_audio = await generate_narration_audio()

    # 2. Render Landscape Video (16:9)
    temp_landscape = render_landscape_explainer()
    final_landscape = os.path.join(OUTPUT_DIR, "yms_narrated_commercial_16x9.mp4")
    multiplex_audio_and_video(temp_landscape, master_audio, final_landscape)

    # 3. Render Vertical Video (9:16)
    temp_vertical = render_vertical_explainer()
    final_vertical = os.path.join(OUTPUT_DIR, "yms_narrated_reel_9x16.mp4")
    multiplex_audio_and_video(temp_vertical, master_audio, final_vertical)

    # Cleanup temp video files
    if os.path.exists(temp_landscape):
        os.remove(temp_landscape)
    if os.path.exists(temp_vertical):
        os.remove(temp_vertical)

    print("\n" + "=" * 70)
    print("ALL NARRATED MARKETING EXPLAINER VIDEOS GENERATED SUCCESSFULLY!")
    print(f"16:9 Landscape: {final_landscape}")
    print(f"9:16 Vertical:  {final_vertical}")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
