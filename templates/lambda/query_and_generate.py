import boto3
import json
import requests

secrets_client = boto3.client("secretsmanager")
SECRETS_NAME = "PromptWireSecrets"

def get_secrets():
    response = secrets_client.get_secret_value(SecretId=SECRETS_NAME)
    secrets = json.loads(response["SecretString"])
    return secrets["flask_api_url"]

def lambda_handler(event, context):
    try:
        base_url = get_secrets()
        endpoint = f"{base_url}/query-answer"

        body = json.loads(event["body"])
        question = body.get("question", "")
        num_sources = body.get("num_sources", 3)

        if not question:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing question"})
            }

        res = requests.post(endpoint, json={
            "question": question,
            "num_sources": num_sources
        }, timeout=15)

        return {
            "statusCode": res.status_code,
            "headers": {"Content-Type": "application/json"},
            "body": res.text
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }