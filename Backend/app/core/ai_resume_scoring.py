from google import genai
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GOOGLE_API_KEY")
)


def analyze_resume_with_ai(resume_text: str, job_description: str):

    prompt = f"""
You are an AI HR evaluator.

Compare the resume with the job description carefully.

Resume:
{resume_text[:4000]}

Job Description:
{job_description[:3000]}

Return ONLY valid JSON in this exact format:

{{
    "score": number,
    "missing_skills": [],
    "reason": ""
}}

Do NOT include markdown.
Do NOT include explanation outside JSON.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        result_text = response.text.strip()

        # 🔥 Remove markdown if Gemini adds it
        result_text = re.sub(r"```json|```", "", result_text).strip()

        result_json = json.loads(result_text)

        return result_json

    except Exception as e:
        print("AI Resume Scoring Failed:", e)

        return {
            "score": 60,
            "missing_skills": [],
            "reason": "AI scoring temporarily unavailable"
        }