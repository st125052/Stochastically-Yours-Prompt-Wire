import json
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
            payload = json.loads(record["kinesis"]["data"])

            page_content = payload.get("content") or payload.get("summary")
            if not page_content:
                print("Skipping: no content or summary available.")
                continue

            metadata = {
                "title": payload.get("title"),
                "source": payload.get("source"),
                "link": payload.get("link"),
                "publishDate": payload.get("publishDate"),
                "summary": payload.get("summary"),
            }

            response = requests.post(
                endpoint,
                json={"page_content": page_content, "metadata": metadata},
                timeout=10
            )

            if response.status_code != 200:
                print(f"Failed to index: {response.status_code} - {response.text}")
            else:
                print(f"Successfully indexed: {metadata['title']}")

        return {
            "statusCode": 200,
            "body": json.dumps("All records processed.")
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps("Processing failed.")
        }