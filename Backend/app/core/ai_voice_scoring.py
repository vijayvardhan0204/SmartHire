import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-2.5-flash")


def calculate_voice_score(transcript: str, job_description: str):
    prompt = """You are a senior technical interviewer.

    Score the candidate based on the job role.

    Evaluate:
    1. Communication clarity
    2. Technical depth
    3. Confidence and articulation
    4. Relevance to the job description

    Job Description:
    {job_description}

    Transcript:
    {transcript}

    Rules:
    - Scores must be realistic.
    - Do not inflate scores.
    - Penalize vague answers.
    - Reward specific technical explanations.

    Return ONLY JSON:
    {
    "communication_score":0-100,
    "technical_score":0-100,
    "confidence_score":0-100,
    "voice_score":0-100,
    "feedback":"short professional hiring feedback"
    }"""

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.2,
            "response_mime_type": "application/json"
        }
    )

    result = json.loads(response.text)

    # Safety clamp
    for k in ["communication_score", "technical_score", "confidence_score", "voice_score"]:
        result[k] = max(0, min(100, int(result[k])))

    return result