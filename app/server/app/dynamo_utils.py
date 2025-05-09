import boto3
from instance.config import get_env_variable

ACCESS_KEY_ID = get_env_variable("AWS_ACCESS_KEY_ID")
SECRET_ACCESS_KEY = get_env_variable("AWS_SECRET_ACCESS_KEY")
REGION = get_env_variable("AWS_REGION")
SESSION_TOKEN = get_env_variable("AWS_SESSION_TOKEN")

def get_dynamodb_resource():
    return boto3.resource(
        "dynamodb",
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
        region_name=REGION,
        aws_session_token=SESSION_TOKEN
    )
