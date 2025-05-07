import json
import base64
import boto3
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
        endpoint = f"{base_url}/index-article"

        for record in event["Records"]:
            payload = json.loads(base64.b64decode(record["kinesis"]["data"]))

            page_content = payload.get("page_content")
            metadata = payload.get("metadata", {})

            if not page_content:
                print("Skipping: empty page_content")
                continue

            response = requests.post(
                endpoint,
                json={"page_content": page_content, "metadata": metadata},
                timeout=10
            )

            if response.status_code != 200:
                print(f"[FAILED] {metadata.get('title')} - {response.status_code}: {response.text}")
            else:
                print(f"[SUCCESS] Indexed: {metadata.get('title')}")

        return {
            "statusCode": 200,
            "body": json.dumps("All records processed.")
        }

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps("Processing failed.")
        }
