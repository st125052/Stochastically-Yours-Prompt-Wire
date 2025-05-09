from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key
from app.dynamo_utils import get_dynamodb_resource
from instance.config import get_env_variable

CHAT_TABLE = get_env_variable("DYNAMODB_CHAT_TABLE")
dynamodb = get_dynamodb_resource()
chat_table = dynamodb.Table(CHAT_TABLE)

def store_message(user_id: str, chat_id: str, role: str, message: str):
    timestamp = datetime.now(timezone.utc).isoformat()

    chat_table.put_item(Item={
        "user_id": user_id,
        "chat_id": chat_id,
        "timestamp": timestamp,
        "role": role,
        "message": message
    })

def get_chat_history(user_id: str, chat_id: str):
    response = chat_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id) & Key("chat_id").eq(chat_id),
        ScanIndexForward=True
    )
    return response.get("Items", [])

def list_chats(user_id: str):
    response = chat_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id),
        ProjectionExpression="chat_id, timestamp",
        ScanIndexForward=False
    )

    seen = set()
    chats = []

    for item in response.get("Items", []):
        cid = item["chat_id"]
        if cid not in seen:
            seen.add(cid)
            chats.append({
                "chat_id": cid,
                "last_used": item["timestamp"]
            })

    return sorted(chats, key=lambda x: x["last_used"], reverse=True)

def delete_chat(user_id: str, chat_id: str):
    response = chat_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id) & Key("chat_id").eq(chat_id),
        ProjectionExpression="user_id, chat_id, timestamp"
    )

    items = response.get("Items", [])
    if not items:
        return False

    with chat_table.batch_writer() as batch:
        for item in items:
            batch.delete_item(
                Key={
                    "user_id": item["user_id"],
                    "chat_id": item["chat_id"]
                }
            )

    return True

def delete_all_chats(user_id: str):
    response = chat_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id),
        ProjectionExpression="user_id, chat_id"
    )

    items = response.get("Items", [])
    if not items:
        return False

    with chat_table.batch_writer() as batch:
        for item in items:
            batch.delete_item(
                Key={
                    "user_id": item["user_id"],
                    "chat_id": item["chat_id"]
                }
            )

    return True