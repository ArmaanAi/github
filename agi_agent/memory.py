import chromadb
from chromadb.config import Settings

class LongTermMemory:
    def __init__(self):
        # Initialize local persistent storage
        self.client = chromadb.PersistentClient(path="./agi_memory")
        self.collection = self.client.get_or_create_collection(name="agi_knowledge")

    def store(self, task, research, answer):
        """Store task results and research data for future reflection."""
        # Generate a safer ID
        safe_id = "".join([c if c.isalnum() else "_" for c in task])[:50]
        self.collection.add(
            documents=[f"Task: {task}\nResearch: {research}\nAnswer: {answer}"],
            metadatas=[{"type": "task_result", "task": task}],
            ids=[f"id_{safe_id}"]
        )
        print(f"[Memory] Stored knowledge for: {task}")

    def store_opinion(self, topic, opinion):
        """Specifically stores formed opinions for self-improvement."""
        self.collection.add(
            documents=[f"Topic: {topic}\nOpinion: {opinion}"],
            metadatas=[{"type": "opinion", "topic": topic}],
            ids=[f"opinion_{topic.replace(' ', '_')[:50]}"]
        )

    def get_recent_data(self):
        """Retrieve recent findings to inform self-reflection."""
        results = self.collection.peek(limit=5)
        return "\n---\n".join(results['documents']) if results['documents'] else "No memory yet."

    def find_related(self, query):
        """Query memory for related past experiences."""
        return self.collection.query(query_texts=[query], n_results=3)
