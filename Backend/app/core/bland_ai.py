import requests
import os

BLAND_API_KEY = os.getenv("BLAND_API_KEY")



def start_bland_interview(phone_number: str, candidate_name: str, job_title: str, application_id: int):

    url = "https://api.bland.ai/v1/calls"

    headers = {
        "Authorization": f"Bearer {BLAND_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "phone_number": phone_number,
        "task": f"Conduct a screening interview for {candidate_name} applying for {job_title}. Ask about experience, skills, and communication ability.",
        "voice": "maya",
        "language": "en",
        "metadata": {
        "application_id": application_id
    },
        "webhook": "https://electrical-impermanently-trish.ngrok-free.dev/applications/bland-webhook"
    }

    print("CALLING BLAND AI...")

    response = requests.post(url, json=payload, headers=headers)

    # ✅ print AFTER request
    print("BLAND STATUS:", response.status_code)
    print("BLAND RESPONSE:", response.text)

    return response.json()
