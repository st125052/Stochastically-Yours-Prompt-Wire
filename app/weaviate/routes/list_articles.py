from flask import Blueprint, jsonify
from weaviate_client.client import client
from config.env_loader import get_env_variable

list_bp = Blueprint("list_articles", __name__)
WEAVIATE_CLASS = get_env_variable("WEAVIATE_CLASS")

@list_bp.route("/weaviate/list-articles", methods=["GET"])
def list_articles():
    try:
        results = client.collections.get(WEAVIATE_CLASS).query.fetch_objects(limit=100)
        return jsonify([obj.properties for obj in results.objects]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500