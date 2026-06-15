import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:3000", timeout=60000)
            await asyncio.sleep(5)
            await page.screenshot(path="final_pc_verify.png")
            print("PC Screenshot taken")

            # Check for canvas
            canvas = await page.query_selector('canvas')
            if canvas:
                print("Canvas found")
            else:
                print("Canvas NOT found")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
