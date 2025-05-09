import requests
from instance.config import get_env_variable

QUERY_API_URL = get_env_variable("QUERY_TASK_API_URL")

def get_ai_answer(question: str, num_sources: int = 3) -> tuple[str, list[str]]:
    try:
        response = requests.post(
            QUERY_API_URL,
            json={"num_sources": num_sources, "question": question},
            timeout=15
        )

        if response.status_code != 200:
            raise RuntimeError(f"API responded with status {response.status_code}")

        data = response.json()
        answer = data.get("answer", "No answer returned.")
        sources = data.get("sources", [])
        return answer, sources

    except Exception as e:
        raise RuntimeError(f"Failed to fetch AI answer: {e}")