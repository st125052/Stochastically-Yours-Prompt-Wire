from flask import Blueprint, request, jsonify
from weaviate_client.client import client
from config.env_loader import get_env_variable
from weaviate.classes.query import Filter
from utils.cloudwatch_utils import get_logger, publish_metric

list_article_id_bp = Blueprint("list_article_by_id", __name__)
logger = get_logger()

WEAVIATE_CLASS = get_env_variable("WEAVIATE_CLASS")

@list_article_id_bp.route("/weaviate/list-article", methods=["GET"])
def list_article():
    article_id = request.args.get("article_id")
    if not article_id:
        logger.warning("Missing 'article_id' in request")
        return jsonify({"error": "Missing article_id param"}), 400

    try:
        results = client.collections.get(WEAVIATE_CLASS).query.fetch_objects(
            filters=Filter.by_property("article_id").equal(article_id),
            limit=1
        )
        articles = [obj.properties for obj in results.objects]

        logger.info(f"Fetched {len(articles)} articles for article_id: {article_id}")
        publish_metric("ArticlesFetchedById", len(articles))

        return jsonify(articles), 200

    except Exception as e:
        logger.error(f"Error fetching article with ID {article_id}: {str(e)}", exc_info=True)
        publish_metric("ListByIdErrors", 1)
        return jsonify({"error": "Failed to retrieve article"}), 500