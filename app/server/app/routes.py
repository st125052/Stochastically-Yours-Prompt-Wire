from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.chat_model import store_message, get_chat_history, list_chats, delete_chat, delete_all_chats, get_recent_chat_history
from app.utils.query_api import get_ai_answer
from app.dynamo_utils import get_dynamodb_resource
from instance.config import get_env_variable
from app.utils.cloudwatch_utils import get_logger, publish_metric
import boto3

bp = Blueprint("routes", __name__)
logger = get_logger()

# === CHAT ===
@bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    data = request.get_json()
    question = data.get("message")
    k = int(data.get("num_sources", 3))
    chat_id = data.get("chat_id")

    if not question or not chat_id:
        logger.warning("Missing 'message' or 'chat_id' in /chat request")
        return jsonify({"error": "Both 'message' and 'chat_id' are required"}), 400

    user_id = get_jwt_identity()

    try:
        logger.info(f"[CHAT] User {user_id} asked: {question} in chat_id: {chat_id}")
        store_message(user_id, chat_id, "user", question, [])

        chat_history = get_recent_chat_history(user_id, chat_id, limit=4) or []
        answer, sources = get_ai_answer(question, k, chat_history=chat_history)

        store_message(user_id, chat_id, "assistant", answer, sources)

        publish_metric("ChatsCreated", 1)
        return jsonify({"response": answer, "sources": sources}), 200

    except Exception as e:
        logger.error(f"[CHAT] Error for user {user_id}: {str(e)}", exc_info=True)
        publish_metric("ChatErrors", 1)
        return jsonify({"error": "Failed to process chat"}), 500


# === CHAT HISTORY ===
@bp.route("/chat-history", methods=["GET"])
@jwt_required()
def chat_history():
    user_id = get_jwt_identity()
    chat_id = request.args.get("chat_id")

    if not chat_id:
        logger.warning("Missing 'chat_id' in /chat-history request")
        return jsonify({"error": "Missing chat_id in query params"}), 400

    try:
        history = get_chat_history(user_id, chat_id)
        logger.info(f"[CHAT HISTORY] Returned {len(history)} messages for user {user_id}")
        publish_metric("ChatHistoryViewed", 1)
        return jsonify({"history": history}), 200

    except Exception as e:
        logger.error(f"[CHAT HISTORY] Error for user {user_id}: {str(e)}", exc_info=True)
        publish_metric("ChatHistoryErrors", 1)
        return jsonify({"error": "Failed to retrieve chat history"}), 500


# === LIST CHATS ===
@bp.route("/chats", methods=["GET"])
@jwt_required()
def list_chat_threads():
    user_id = get_jwt_identity()

    try:
        threads = list_chats(user_id)
        logger.info(f"[LIST CHATS] User {user_id} has {len(threads)} threads")
        publish_metric("ChatThreadsListed", 1)
        return jsonify({"chats": threads}), 200

    except Exception as e:
        logger.error(f"[LIST CHATS] Error for user {user_id}: {str(e)}", exc_info=True)
        publish_metric("ChatListErrors", 1)
        return jsonify({"error": "Failed to list chat threads"}), 500


# === DELETE CHAT ===
@bp.route("/delete-chat", methods=["DELETE"])
@jwt_required()
def delete_user_chat():
    user_id = get_jwt_identity()
    chat_id = request.args.get("chat_id")

    if not chat_id:
        logger.warning("Missing 'chat_id' in /delete-chat request")
        return jsonify({"error": "Missing chat_id in query params"}), 400

    try:
        deleted = delete_chat(user_id, chat_id)
        if deleted:
            logger.info(f"[DELETE CHAT] Deleted chat {chat_id} for user {user_id}")
            publish_metric("ChatsDeleted", 1)
            return jsonify({"message": "Chat deleted"}), 200
        else:
            logger.info(f"[DELETE CHAT] No chat {chat_id} found for user {user_id}")
            return jsonify({"message": "No chat found"}), 404

    except Exception as e:
        logger.error(f"[DELETE CHAT] Error: {str(e)}", exc_info=True)
        publish_metric("ChatDeleteErrors", 1)
        return jsonify({"error": "Failed to delete chat"}), 500


# === DELETE ALL CHATS ===
@bp.route("/delete-all-chats", methods=["DELETE"])
@jwt_required()
def delete_all_user_chats():
    user_id = get_jwt_identity()

    try:
        deleted = delete_all_chats(user_id)
        if deleted:
            logger.info(f"[DELETE ALL] Deleted all chats for user {user_id}")
            publish_metric("AllChatsDeleted", 1)
            return jsonify({"message": "All chats deleted"}), 200
        else:
            logger.info(f"[DELETE ALL] No chats found for user {user_id}")
            return jsonify({"message": "No chats found"}), 404

    except Exception as e:
        logger.error(f"[DELETE ALL] Error: {str(e)}", exc_info=True)
        publish_metric("DeleteAllErrors", 1)
        return jsonify({"error": "Failed to delete all chats"}), 500


# === HEALTH CHECK ===
@bp.route("/health", methods=["GET"])
def health_check():
    try:
        dynamodb = get_dynamodb_resource()

        users_table = get_env_variable("DYNAMODB_USERS_TABLE")
        chat_table = get_env_variable("DYNAMODB_CHAT_TABLE")
        articles_table = get_env_variable("DYNAMODB_ARTICLES_TABLE")
        
        dynamodb.meta.client.describe_table(TableName=users_table)
        dynamodb.meta.client.describe_table(TableName=chat_table)
        dynamodb.meta.client.describe_table(TableName=articles_table)

        logger.info("[HEALTH] All DynamoDB tables verified healthy")
        publish_metric("HealthChecks", 1)

        return jsonify({"status": "healthy"}), 200

    except boto3.exceptions.Boto3Error as e:
        logger.error(f"[HEALTH] Boto3Error: {str(e)}", exc_info=True)
        publish_metric("HealthErrors", 1)
        return jsonify({"status": "unhealthy", "error": str(e)}), 500
    except Exception as e:
        logger.error(f"[HEALTH] General Error: {str(e)}", exc_info=True)
        publish_metric("HealthErrors", 1)
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


# === HOME ===
@bp.route("/", methods=["GET"])
def home():
    logger.info("Welcome endpoint accessed")
    publish_metric("HomeHits", 1)
    return jsonify({"message": "Welcome to the Prompt Wire API"}), 200