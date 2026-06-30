import asyncio
from playwright.async_api import async_playwright
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

class AdvancedResearcher:
    def __init__(self):
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"

    async def explore_internet(self, query: str):
        """High-level search that uses both Playwright and Selenium if needed."""
        print(f"[Researcher] Exploring internet for: {query}")
        data = await self.playwright_search(query)
        if not data:
            data = self.selenium_fallback(query)
        return data

    async def playwright_search(self, query: str):
        """Uses Playwright to browse dynamically rendered sites and deep links."""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent=self.user_agent)
            page = await context.new_page()

            # 1. Search Engine entry
            url = f"https://www.duckduckgo.com/?q={query.replace(' ', '+')}"
            await page.goto(url)
            await page.wait_for_timeout(2000) # Wait for results

            # 2. Extract links to "explore the whole internet"
            links = await page.eval_on_selector_all("a.result__a", "nodes => nodes.map(n => n.href)")

            collected_data = []
            # 3. Visit top 3 deep links to get "best opinions"
            for link in links[:3]:
                try:
                    await page.goto(link, timeout=10000)
                    text = await page.inner_text("body")
                    collected_data.append(f"Source: {link}\nContent: {text[:1000]}")
                except Exception as e:
                    print(f"[Researcher] Failed to visit {link}: {e}")

            await browser.close()
            return "\n\n".join(collected_data)

    def selenium_fallback(self, query: str):
        """Selenium fallback for sites that block Playwright."""
        options = Options()
        options.add_argument("--headless")
        options.add_argument(f"user-agent={self.user_agent}")
        driver = webdriver.Chrome(options=options)
        url = f"https://www.bing.com/search?q={query.replace(' ', '+')}"
        driver.get(url)
        content = driver.page_source
        driver.quit()
        return self.parse_content(content)

    def parse_content(self, html: str):
        """Extract meaningful text and opinions from HTML."""
        soup = BeautifulSoup(html, "html.parser")
        # Extract snippets, titles, and body text
        texts = soup.stripped_strings
        return " ".join(list(texts)[:2000]) # Return first 2000 characters for brevity
