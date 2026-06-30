import unittest
from agi_agent.memory import LongTermMemory
import os
import shutil

class TestAGIMemory(unittest.TestCase):
    def setUp(self):
        # Use a test-specific memory directory
        self.test_dir = "./test_agi_memory"
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
        self.memory = LongTermMemory()
        # Mocking the client path for testing if possible, or just using the default and cleaning up

    def test_store_and_retrieve(self):
        task = "Test Task"
        research = "Some research data"
        answer = "Final answer"
        self.memory.store(task, research, answer)

        recent = self.memory.get_recent_data()
        self.assertIn(task, recent)
        self.assertIn(answer, recent)

    def test_store_opinion(self):
        topic = "AI Ethics"
        opinion = "AI should be autonomous and helpful."
        self.memory.store_opinion(topic, opinion)
        # Checking if it can be retrieved via peek (recent data)
        recent = self.memory.get_recent_data()
        self.assertIn(topic, recent)

if __name__ == "__main__":
    unittest.main()
