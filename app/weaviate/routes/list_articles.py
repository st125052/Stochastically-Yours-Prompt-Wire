from flask import Blueprint, jsonify
from weaviate_client.client import client
from config.env_loader import get_env_variable
from utils.cloudwatch_utils import get_logger, publish_metric

list_bp = Blueprint("list_articles", __name__)
logger = get_logger()

WEAVIATE_CLASS = get_env_variable("WEAVIATE_CLASS")

@list_bp.route("/weaviate/list-articles", methods=["GET"])
def list_articles():
    try:
        results = client.collections.get(WEAVIATE_CLASS).query.fetch_objects(limit=100)
        articles = [obj.properties for obj in results.objects]

        logger.info(f"Listed {len(articles)} articles from class '{WEAVIATE_CLASS}'")
        publish_metric("ArticlesListed", len(articles))

        return jsonify(articles), 200

    except Exception as e:
        logger.error(f"Failed to list articles: {str(e)}", exc_info=True)
        publish_metric("ListErrors", 1)
        return jsonify({"error": "Failed to retrieve articles"}), 500