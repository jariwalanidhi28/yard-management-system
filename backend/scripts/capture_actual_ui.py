import asyncio
import os
from playwright.async_api import async_playwright

SNAPSHOT_DIR = r"c:\wamp64\www\yms\marketing_videos\actual_ui_snapshots"
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

async def capture_actual_ui():
    print("Launching Chromium to capture real UI screens...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Create full HD context (1920x1080)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()

        # 1. Login Page
        print("Capturing 1. Login Screen...")
        await page.goto("http://localhost:5173/login", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "01_login.png"))

        # Click Admin Quick Fill and Sign In
        print("Logging in as Admin...")
        await page.click("button:has-text('Admin User')")
        await page.wait_for_timeout(500)
        await page.click("button:has-text('Sign In to Console')")
        await page.wait_for_url("**/dashboard", timeout=10000)
        await page.wait_for_timeout(2000)

        # 2. Operations Dashboard
        print("Capturing 2. Dashboard with live charts & telemetry...")
        await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "02_dashboard.png"))

        # 3. Gate Operations
        print("Capturing 3. Gate Visits & Passes...")
        await page.goto("http://localhost:5173/gate-visits", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "03_gate_visits.png"))

        # Open Printable Gate Pass Modal
        print("Capturing 4. Printable Gate Pass Receipt...")
        print_buttons = page.locator("button[title='Print Gate Pass']")
        if await print_buttons.count() > 0:
            await print_buttons.first.click()
            await page.wait_for_timeout(800)
            await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "04_printable_gate_pass.png"))
            # Close modal
            await page.click("button:has-text('Close')")
            await page.wait_for_timeout(500)

        # 5. Visual Yard Map
        print("Capturing 5. Interactive Visual Yard Map...")
        await page.goto("http://localhost:5173/yard-map", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "05_yard_map.png"))

        # Click an occupied slot to show the drawer/modal
        print("Capturing 6. Allocated Slot Details Modal...")
        occupied_slot = page.locator(".slot-occupied").first
        if await occupied_slot.count() > 0:
            await occupied_slot.click()
            await page.wait_for_timeout(800)
            await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "06_slot_allocated_modal.png"))
            await page.click(".btn-close")
            await page.wait_for_timeout(500)

        # 7. Dock Appointments
        print("Capturing 7. Dock Bay Appointments & Scheduling...")
        await page.goto("http://localhost:5173/dock-appointments", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "07_dock_appointments.png"))

        # 8. Shipments
        print("Capturing 8. Shipments Management & Timeline...")
        await page.goto("http://localhost:5173/shipments", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "08_shipments.png"))

        # Open Timeline Modal
        timeline_btn = page.locator("button:has-text('Timeline')").first
        if await timeline_btn.count() > 0:
            await timeline_btn.click()
            await page.wait_for_timeout(800)
            await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "09_shipment_timeline.png"))
            await page.click("button:has-text('Close')")
            await page.wait_for_timeout(500)

        # 10. Reports & Analytics
        print("Capturing 10. Reports & Analytics...")
        await page.goto("http://localhost:5173/reports", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "10_reports.png"))

        # 11. Public Tracking Portal
        print("Capturing 11. Public Customer Tracking Portal...")
        await page.goto("http://localhost:5173/track/TRK-20261019-0001", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(SNAPSHOT_DIR, "11_public_tracking.png"))

        await browser.close()
        print("All authentic UI screen snapshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(capture_actual_ui())
