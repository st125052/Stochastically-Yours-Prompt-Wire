from flask import Blueprint, request, jsonify
from langchain_core.documents import Document
from weaviate_client.vectorstore import vectorstore
from utils.cloudwatch_utils import get_logger, publish_metric

index_bp = Blueprint("index_article", __name__)
logger = get_logger()

@index_bp.route("/api/index-article", methods=["POST"])
def index_article():
    data = request.get_json()
    page_content = data.get("page_content")
    metadata = data.get("metadata", {})

    if not page_content:
        logger.warning("Missing 'page_content' in index request")
        return jsonify({"error": "Missing page_content"}), 400

    try:
        doc = Document(page_content=page_content, metadata=metadata)
        vectorstore.add_documents([doc])

        logger.info(f"Indexed article with metadata: {metadata}")
        publish_metric("ArticlesIndexed", 1)

        return jsonify({"status": "success"}), 200

    except Exception as e:
        logger.error(f"Error indexing article: {str(e)}", exc_info=True)
        publish_metric("IndexErrors", 1)
        return jsonify({"error": "Failed to index article"}), 500