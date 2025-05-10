import requests
from instance.config import get_env_variable

QUERY_API_URL = get_env_variable("QUERY_TASK_API_URL")

def get_ai_answer(question: str, num_sources: int = 3, chat_history=None) -> tuple[str, list[str]]:
    try:
        body = {"num_sources": num_sources, "question": question}
        if chat_history is not None:
            body["chat_history"] = chat_history
        response = requests.post(
            QUERY_API_URL,
            json=body,
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