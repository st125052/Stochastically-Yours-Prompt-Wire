import os
from dotenv import load_dotenv

load_dotenv()

def get_env_variable(key: str, default: str = None) -> str:
    value = os.getenv(key, default)
    if value is None:
        raise RuntimeError(f"Environment variable '{key}' is not set and no default was provided.")
    return value