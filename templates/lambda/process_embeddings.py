import boto3
import json
import base64
import os
import weaviate
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores.weaviate import Weaviate as LangWeaviate
from langchain.schema import Document

secrets_client = boto3.client("secretsmanager")
SECRETS_NAME = "PromptWireSecrets"

def get_secrets():
    response = secrets_client.get_secret_value(SecretId=SECRETS_NAME)
    secret = json.loads(response["SecretString"])
    return (
        secret["openai_api_key"],
        secret["cluster_url"],
        secret["cluster_api_write_key"],
        secret["cluster_class"]
    )

def lambda_handler(event, context):
    try:
        openai_key, weaviate_url, weaviate_key, weaviate_class = get_secrets()
        os.environ["OPENAI_API_KEY"] = openai_key

        # Setup Weaviate client
        weaviate_client = weaviate.Client(
            url=weaviate_url,
            additional_headers={"Authorization": f"Bearer {weaviate_key}"}
        )

        # Setup LangChain wrapper
        vectorstore = LangWeaviate(
            client=weaviate_client,
            index_name=weaviate_class,
            text_key="page_content",
            embedding=OpenAIEmbeddings()
        )

        success_count = 0
        for record in event["Records"]:
            payload = json.loads(base64.b64decode(record["kinesis"]["data"]))
            content = payload.get("page_content", "")
            metadata = payload.get("metadata", {})

            if not content:
                continue

            doc = Document(page_content=content, metadata=metadata)
            vectorstore.add_documents([doc])
            success_count += 1

        return {
            "statusCode": 200,
            "body": json.dumps({"message": f"Embedded and indexed {success_count} documents"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
