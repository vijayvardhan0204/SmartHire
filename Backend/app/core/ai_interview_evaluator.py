import google.generativeai as genai
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-2.5-flash")


def evaluate_interview(transcript: str, job_description: str):

    prompt = f"""
You are a senior technical interviewer.

Evaluate the candidate interview.

Job Description:
{job_description}

Transcript:
{transcript}

Return ONLY JSON in this format:

{{
"communication_score":0-100,
"technical_score":0-100,
"confidence_score":0-100,
"voice_score":0-100,
"strengths":"2-3 bullet points",
"weaknesses":"2-3 bullet points",
"recommendation":"Hire / Hold / Reject",
"feedback":"short professional feedback"
}}
"""

    response = model.generate_content(prompt)

    text = response.text

    # Safe JSON extraction
    match = re.search(r"\{.*\}", text, re.S)
    data = json.loads(match.group())

    return data