import boto3
import hashlib
import json
import requests
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')
kinesis = boto3.client('kinesis')
secrets_client = boto3.client('secretsmanager')

SECRETS_NAME = "PromptWireSecrets"  

def get_secrets():
    secret_response = secrets_client.get_secret_value(SecretId=SECRETS_NAME)
    secrets = json.loads(secret_response['SecretString'])
    return secrets['news_api_url'], secrets['news_api_key'], secrets['dynamodb_table'], secrets['kinesis_stream']

def generate_article_id(title, published_at):
    return hashlib.sha256(f"{title}_{published_at}".encode()).hexdigest()

def get_api_response(api_url, api_key):
    params = {
        "language": "en",
        "pageSize": 10,
    }
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json"
    }
    news_response = requests.get(api_url, headers=headers, params=params)
    if news_response.status_code != 200:
        return {
            'statusCode': 500,
            'body': f"Failed to fetch articles: {news_response.text}"
        }
    else :
        return {
            'statusCode': 200,
            'body': news_response.json()
        }
    
def send_to_kinesis_and_dynamo(articles, table_name, stream_name):
    success_count = 0
    table = dynamodb.Table(table_name)
    
    for article in articles:
        title = article.get("title")
        content = article.get("content")
        published_at = article.get("publishedAt")

        if not title or not content or not published_at:
            continue

        article_id = generate_article_id(title, published_at)

        if 'Item' in table.get_item(Key={'article_id': article_id}):
            continue

        table.put_item(Item={
            'article_id': article_id,
            'title': title,
            'published_at': published_at,
            'ingested_at': datetime.now(timezone.utc).isoformat(),
        })

        document_payload = {
            "page_content": content,
            "metadata": {
                "article_id": article_id,
                "title": title,
                "published_at": published_at,
                "source": article.get("source", {}).get("name", "unknown")
            }
        }

        kinesis.put_record(
            StreamName=stream_name,
            PartitionKey=article_id,
            Data=json.dumps(document_payload)
        )

        success_count += 1
    return success_count

def lambda_handler(event, context):
    news_api_url, news_api_key, dynamodb_table, kinesis_stream = get_secrets()

    success_count = 0
    articles = []

    news_response = get_api_response(news_api_url, news_api_key)

    if news_response['statusCode'] == 200:
        articles = news_response['body'].get('articles', [])
        success_count = send_to_kinesis_and_dynamo(articles, dynamodb_table, kinesis_stream)

    return {
        'statusCode': 200,
        'body': f"Successfully ingested {success_count} articles."
    }