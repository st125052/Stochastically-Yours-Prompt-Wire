from flask import Blueprint, request, jsonify
from weaviate_client.client import client
from config.env_loader import get_env_variable
from weaviate.classes.query import Filter
from utils.cloudwatch_utils import get_logger, publish_metric

delete_bp = Blueprint("delete_article", __name__)
logger = get_logger()

WEAVIATE_CLASS = get_env_variable("WEAVIATE_CLASS")

@delete_bp.route("/weaviate/delete-article", methods=["DELETE"])
def delete_article():
    title = request.args.get("title")
    if not title:
        logger.warning("Missing 'title' in delete request")
        return jsonify({"error": "Missing title param"}), 400

    try:
        results = client.collections.get(WEAVIATE_CLASS).query.fetch_objects(
            filters=Filter.by_property("title").equal(title),
            limit=1
        )

        if not results.objects:
            logger.info(f"No article found with title: {title}")
            publish_metric("DeleteNotFound", 1)
            return jsonify({"error": "Article not found"}), 404

        uid = results.objects[0].uuid
        client.collections.get(WEAVIATE_CLASS).data.delete_by_id(uid)

        logger.info(f"Deleted article with title '{title}' and UUID: {uid}")
        publish_metric("ArticlesDeleted", 1)

        return jsonify({"status": "deleted", "uuid": uid}), 200

    except Exception as e:
        logger.error(f"Error deleting article titled '{title}': {str(e)}", exc_info=True)
        publish_metric("DeleteErrors", 1)
        return jsonify({"error": "Failed to delete article"}), 500