from flask import Blueprint, request, jsonify
from weaviate_client.client import client
from config.env_loader import get_env_variable
from weaviate.classes.query import Filter

delete_bp = Blueprint("delete_article", __name__)
WEAVIATE_CLASS = get_env_variable("WEAVIATE_CLASS")

@delete_bp.route("/weaviate/delete-article", methods=["DELETE"])
def delete_article():
    title = request.args.get("title")
    if not title:
        return jsonify({"error": "Missing title param"}), 400

    try:
        results = client.collections.get(WEAVIATE_CLASS).query.fetch_objects(
            filters=Filter.by_property("title").equal(title),
            limit=1
        )

        if not results.objects:
            return jsonify({"error": "Article not found"}), 404

        uid = results.objects[0].uuid
        client.collections.get(WEAVIATE_CLASS).data.delete_by_id(uid)

        return jsonify({"status": "deleted", "uuid": uid}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500