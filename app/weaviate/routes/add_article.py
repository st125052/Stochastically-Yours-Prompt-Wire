from flask import Blueprint, request, jsonify
from weaviate_client.client import client
from config.env_loader import get_env_variable
from utils.cloudwatch_utils import get_logger, publish_metric

add_article_bp = Blueprint("add_article", __name__)
logger = get_logger()

WEAVIATE_CLASS = get_env_variable("WEAVIATE_CLASS")

@add_article_bp.route("/weaviate/add-article", methods=["POST"])
def add_article():
    data = request.get_json()
    page_content = data.get("page_content")
    metadata = data.get("metadata", {})

    if not page_content:
        logger.warning("Missing 'page_content' in manual add request")
        return jsonify({"error": "Missing page_content"}), 400

    try:
        client.collections.get(WEAVIATE_CLASS).data.insert(
            properties={
                "page_content": page_content,
                **metadata
            }
        )

        logger.info(f"Manually added article with metadata: {metadata}")
        publish_metric("ArticlesManuallyAdded", 1)

        return jsonify({"status": "success"}), 200

    except Exception as e:
        logger.error(f"Failed to manually add article: {str(e)}", exc_info=True)
        publish_metric("AddErrors", 1)
        return jsonify({"error": "Failed to add article"}), 500