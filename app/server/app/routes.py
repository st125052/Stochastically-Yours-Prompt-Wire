from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.chat_model import store_message, get_chat_history, list_chats, delete_chat, delete_all_chats
from app.utils.query_api import get_ai_answer
from app.dynamo_utils import get_dynamodb_resource
from instance.config import get_env_variable
import boto3

bp = Blueprint("routes", __name__)

@bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    data = request.get_json()
    question = data.get("message")
    k = int(data.get("num_sources", 3))
    chat_id = data.get("chat_id")

    if not question or not chat_id:
        return jsonify({"error": "Both 'message' and 'chat_id' are required"}), 400

    user_id = get_jwt_identity()

    try:
        store_message(user_id, chat_id, "user", question)

        answer, sources = get_ai_answer(question, k)

        store_message(user_id, chat_id, "assistant", answer)

        return jsonify({
            "response": answer,
            "sources": sources
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/chat-history", methods=["GET"])
@jwt_required()
def chat_history():
    user_id = get_jwt_identity()
    chat_id = request.args.get("chat_id")

    if not chat_id:
        return jsonify({"error": "Missing chat_id in query params"}), 400

    try:
        history = get_chat_history(user_id, chat_id)
        return jsonify({"history": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/chats", methods=["GET"])
@jwt_required()
def list_chat_threads():
    user_id = get_jwt_identity()

    try:
        threads = list_chats(user_id)
        return jsonify({"chats": threads}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route("/chat-history", methods=["DELETE"])
@jwt_required()
def delete_chat_history():
    user_id = get_jwt_identity()
    chat_id = request.args.get("chat_id")

    if not chat_id:
        return jsonify({"error": "Missing chat_id in query params"}), 400

    try:
        deleted = delete_chat(user_id, chat_id)
        if deleted:
            return jsonify({"message": "Chat deleted"}), 200
        else:
            return jsonify({"message": "No chat found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route("/chat-history/all", methods=["DELETE"])
@jwt_required()
def delete_all_user_chats():
    user_id = get_jwt_identity()

    try:
        deleted = delete_all_chats(user_id)
        if deleted:
            return jsonify({"message": "All chats deleted"}), 200
        else:
            return jsonify({"message": "No chats found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

        return jsonify({"status": "healthy"}), 200

    except boto3.exceptions.Boto3Error as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500