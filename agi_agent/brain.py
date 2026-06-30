import os
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import json

class DualBrain:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.anthropic_client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    async def reflect(self, state, recent_memory):
        """Uses both models to analyze the current state and generate new goals."""
        prompt = (
            f"System State: {json.dumps(state)}\n"
            f"Recent Memory: {recent_memory}\n"
            "Reflect on this data. What are our new goals and opinions?\n"
            "Respond ONLY with a JSON object. Keys: 'new_goals' (list), 'new_opinions' (dict)."
        )

        try:
            response = await self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
            # Robust JSON extraction
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            return json.loads(content)
        except Exception as e:
            print(f"[Brain] Reflection failed: {e}. Returning empty updates.")
            return {"new_goals": [], "new_opinions": {}}

    async def analyze(self, task, research_data):
        """Cross-verify research data using both models."""
        # GPT-4o analyzes the research
        gpt_analysis = await self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "Analyze this research for accuracy and opinions."},
                      {"role": "user", "content": f"Task: {task}\nData: {research_data}"}]
        )

        # Claude reviews GPT-4o's analysis
        claude_review = await self.anthropic_client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=2048,
            messages=[{"role": "user", "content": f"Review this analysis and find gaps or bias: {gpt_analysis.choices[0].message.content}"}]
        )

        return {"gpt": gpt_analysis.choices[0].message.content, "claude": claude_review.content[0].text}

    async def synthesize(self, analysis):
        """Combine analysis into a final superior answer."""
        prompt = f"Merge these analyses into a single, perfectly correct, and opinionated conclusion: {analysis}"
        response = await self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content

    async def generate_curiosity_task(self, state):
        """Generate a new task based on internal 'wishes'."""
        prompt = f"Based on your wishes: {state['wishes']}, what is one complex topic we should explore on the internet now?"
        try:
            response = await self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=100,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            print(f"[Brain] Failed to generate curiosity task: {e}")
            return "Reflect on current knowledge."
