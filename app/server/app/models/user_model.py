import bcrypt
from datetime import datetime, timezone
from app.dynamo_utils import get_dynamodb_resource
from instance.config import get_env_variable

USERS_TABLE = get_env_variable("DYNAMODB_USERS_TABLE")

dynamodb = get_dynamodb_resource()
users_table = dynamodb.Table(USERS_TABLE)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def user_exists(user_id: str) -> bool:
    response = users_table.get_item(Key={'user_id': user_id})
    return 'Item' in response

def create_user(user_id: str, name: str, email: str, password: str) -> bool:
    if user_exists(user_id):
        return False

    hashed_pw = hash_password(password)
    users_table.put_item(Item={
        'user_id': user_id,
        'name': name,
        'email': email,
        'password_hash': hashed_pw,
        'created_at': datetime.now(timezone.utc).isoformat()
    })
    return True

def get_user(user_id: str):
    response = users_table.get_item(Key={'user_id': user_id})
    return response.get('Item')

def get_user_by_email(email: str):
    response = users_table.scan(
        FilterExpression='email = :email',
        ExpressionAttributeValues={':email': email}
    )
    items = response.get('Items', [])
    return items[0] if items else None