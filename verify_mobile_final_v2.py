
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        # Emulate a mobile device
        device = p.devices['iPhone 12']
        browser = await p.chromium.launch()
        context = await browser.new_context(**device)
        page = await context.new_page()

        # Connect to the running dev server
        await page.goto('http://localhost:5173')
        await page.wait_for_selector('canvas')

        # Check start screen
        print("Start screen visible")

        # Click Start Mission
        await page.click('text=START MISSION')
        await asyncio.sleep(1) # Wait for transition

        # Check joystick visibility after start
        joystick = page.locator('#joystick-container')
        is_visible = await joystick.is_visible()
        print(f"Joystick visible after start: {is_visible}")

        # Take a screenshot after starting
        await page.screenshot(path='mobile_after_start.png')

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
