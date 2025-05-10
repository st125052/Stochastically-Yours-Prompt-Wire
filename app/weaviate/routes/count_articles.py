from flask import Blueprint, jsonify
from weaviate_client.client import client
from config.env_loader import get_env_variable
from utils.cloudwatch_utils import get_logger, publish_metric

count_bp = Blueprint("count_articles", __name__)
logger = get_logger()

WEAVIATE_CLASS = get_env_variable("WEAVIATE_CLASS")

@count_bp.route("/weaviate/count-articles", methods=["GET"])
def count_articles():
    try:
        response = client.collections.get(WEAVIATE_CLASS).aggregate.over_all().with_meta_count().do()
        count = response.meta.count

        logger.info(f"Total articles in class '{WEAVIATE_CLASS}': {count}")
        publish_metric("ArticlesCounted", 1)

        return jsonify({"total_count": count}), 200

    except Exception as e:
        logger.error(f"Failed to count articles: {str(e)}", exc_info=True)
        publish_metric("CountErrors", 1)
        return jsonify({"error": "Failed to count articles"}), 500