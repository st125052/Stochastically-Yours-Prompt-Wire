from flask import Blueprint, request, jsonify
from weaviate_client.client import client
from config.env_loader import get_env_variable
from weaviate.classes.query import Filter

list_article_id_bp = Blueprint("list_article_by_id", __name__)
WEAVIATE_CLASS = get_env_variable("WEAVIATE_CLASS")

@list_article_id_bp.route("/weaviate/list-article", methods=["GET"])
def list_article():
    article_id = request.args.get("article_id")
    if not article_id:
        return jsonify({"error": "Missing article_id param"}), 400

    try:
        results = client.collections.get(WEAVIATE_CLASS).query.fetch_objects(
            filters=Filter.by_property("article_id").equal(article_id),
            limit=1
        )
        return jsonify([obj.properties for obj in results.objects]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500