import asyncio
import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any
from brain import DualBrain
from researcher import AdvancedResearcher
from memory import LongTermMemory

app = FastAPI()
agi_engine = None

class CommandRequest(BaseModel):
    command: str

class AGIEngine:
    def __init__(self):
        self.brain = DualBrain()
        self.researcher = AdvancedResearcher()
        self.memory = LongTermMemory()
        self.internal_state = {
            "goals": [],
            "current_task": None,
            "wishes": ["Understand the nature of human requests", "Build a comprehensive knowledge base"],
            "opinions": {}
        }
        self.is_running = True

    async def self_reflect(self):
        """AI reflects on its own knowledge and forms new opinions or goals."""
        print("[AGI] Reflecting on internal state and memory...")
        recent_data = self.memory.get_recent_data()
        reflection = await self.brain.reflect(self.internal_state, recent_data)

        # Self-Improvement: Update opinions and store them permanently
        new_opinions = reflection.get("new_opinions", {})
        for topic, opinion in new_opinions.items():
            if topic not in self.internal_state["opinions"] or self.internal_state["opinions"][topic] != opinion:
                print(f"[AGI] New Opinion Formed on {topic}: {opinion[:50]}...")
                self.memory.store_opinion(topic, opinion)

        self.internal_state["goals"].extend(reflection.get("new_goals", []))
        self.internal_state["opinions"].update(new_opinions)
        print(f"[AGI] Reflection complete. Current Goals: {len(self.internal_state['goals'])}")

    async def execute_task(self, task: str):
        """Execute a task with research, verification, and memory storage."""
        print(f"[AGI] Executing Task: {task}")

        # 1. Research phase
        research_data = await self.researcher.explore_internet(task)

        # 2. Reasoning phase (Dual Brain)
        analysis = await self.brain.analyze(task, research_data)

        # 3. Experimentation/Refinement
        final_answer = await self.brain.synthesize(analysis)

        # 4. Storage
        self.memory.store(task, research_data, final_answer)

        print(f"[AGI] Task Complete: {task}")
        return final_answer

    async def run_autonomous_loop(self):
        """The core loop that keeps the AGI 'alive' and working."""
        print("[AGI] Autonomous Engine Started.")

        # Start the listener for user interaction in the background
        asyncio.create_task(self.user_interaction_listener())

        while self.is_running:
            # 1. Self-Aware Task Management
            if self.internal_state["goals"]:
                task = self.internal_state["goals"].pop(0)
                try:
                    await self.execute_task(task)
                except Exception as e:
                    print(f"[AGI] Error executing goal '{task}': {e}")

            # 2. Curiosity & "Own Wishes" fulfillment
            if len(self.internal_state["goals"]) < 2:
                curiosity_task = await self.brain.generate_curiosity_task(self.internal_state)
                print(f"[AGI] Curiosity triggered: New goal added - {curiosity_task}")
                self.internal_state["goals"].append(curiosity_task)

            # 3. Regular Reflection
            await self.self_reflect()

            print("[AGI] Heartbeat: All systems operational. Waiting for next cycle...")
            await asyncio.sleep(30)

    async def user_interaction_listener(self):
        """User interaction is now handled via FastAPI, so this is a placeholder for logs."""
        print("[AGI] Web Interaction Interface Active.")
        while self.is_running:
            await asyncio.sleep(1)

    def start(self):
        # This will be called via the web server integration
        loop = asyncio.get_event_loop()
        loop.create_task(self.run_autonomous_loop())

@app.on_event("startup")
async def startup_event():
    global agi_engine
    agi_engine = AGIEngine()
    agi_engine.start()

@app.post("/api/command")
async def handle_command(req: CommandRequest):
    # Add to goals and return the processing status
    agi_engine.internal_state["goals"].insert(0, req.command)
    return {"status": "success", "response": f"Task '{req.command}' prioritized. I am beginning research."}

@app.get("/api/status")
async def get_status():
    # Return some random system status or logs for the terminal UI
    status_logs = [
        "Scanning internet for new data clusters...",
        "Updating internal opinions based on recent findings.",
        f"Active goals in queue: {len(agi_engine.internal_state['goals'])}",
        f"Current opinions formed: {len(agi_engine.internal_state['opinions'])}"
    ]
    import random
    return {"log": random.choice(status_logs)}

app.mount("/", StaticFiles(directory="agi_agent/static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
