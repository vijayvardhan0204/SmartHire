import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()
import os
import json
import re

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-2.5-flash")

transcript = """
I worked on a machine learning project where we built an API using FastAPI.
I collaborated with my team and handled deployment.
"""

job_description = "Looking for a backend developer with API and database experience."

prompt = f"""
Evaluate the interview.

Job Description:
{job_description}

Transcript:
{transcript}

Return ONLY JSON:
{{
"communication_score":0-100,
"technical_score":0-100,
"confidence_score":0-100,
"voice_score":0-100,
"feedback":"short feedback"
}}
"""

response = model.generate_content(prompt)

text = response.text
print("RAW RESPONSE:\n", text)

# Clean JSON if wrapped in ```json
clean = re.sub(r"```json|```", "", text).strip()

data = json.loads(clean)

print("\nPARSED JSON:\n", data)