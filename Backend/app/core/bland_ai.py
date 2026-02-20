import requests
import os
from dotenv import load_dotenv

load_dotenv()

BLAND_API_KEY = os.getenv("BLAND_API_KEY")
BLAND_WEBHOOK_SECRET = os.getenv("BLAND_WEBHOOK_SECRET")


def start_bland_interview(phone_number: str, candidate_name: str, job_title: str, application_id: int):

    url = "https://api.bland.ai/v1/calls"

    headers = {
        "Authorization": BLAND_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "phone_number": phone_number,
        "task": f"Conduct a screening interview for {candidate_name} applying for {job_title}. Ask about experience, skills, and communication ability.",
        "voice": "maya",
        "language": "en",
        "webhook": "https://electrical-impermanently-trish.ngrok-free.dev/applications/bland-webhook",
        "metadata": {
            "application_id": application_id
        },
        "headers": {
            "X-Bland-Secret": BLAND_WEBHOOK_SECRET
        }
    }

    print("\n==============================")
    print("CALLING BLAND AI...")
    print("Phone:", phone_number)
    print("==============================\n")

    response = requests.post(url, json=payload, headers=headers)

    print("BLAND STATUS:", response.status_code)
    print("BLAND RESPONSE:", response.text)

    return response.json()
