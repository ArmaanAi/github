import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        # Emulate a mobile device
        device = p.devices['iPhone 12']
        browser = await p.chromium.launch()
        context = await browser.new_context(**device)
        page = await context.new_page()

        try:
            await page.goto("http://localhost:3000", timeout=60000)
            await asyncio.sleep(5)
            await page.screenshot(path="final_mobile_verify.png")
            print("Mobile Screenshot taken")

            # Check for joystick
            joystick = await page.query_selector('#joystick-container')
            if joystick:
                is_visible = await joystick.is_visible()
                print(f"Joystick visible: {is_visible}")
            else:
                print("Joystick NOT found")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
