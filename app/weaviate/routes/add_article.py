from flask import Blueprint, request, jsonify
from weaviate_client.client import client
from config.env_loader import get_env_variable

add_article_bp = Blueprint("add_article", __name__)
WEAVIATE_CLASS = get_env_variable("WEAVIATE_CLASS")

@add_article_bp.route("/weaviate/add-article", methods=["POST"])
def add_article():
    data = request.get_json()
    page_content = data.get("page_content")
    metadata = data.get("metadata", {})

    if not page_content:
        return jsonify({"error": "Missing page_content"}), 400

    try:
        client.collections.get(WEAVIATE_CLASS).data.insert(
            properties={
                "page_content": page_content,
                **metadata
            }
        )
        return jsonify({"status": "success"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500