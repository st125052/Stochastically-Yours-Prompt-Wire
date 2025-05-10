from flask import Blueprint, jsonify
from weaviate_client.client import client
from utils.cloudwatch_utils import get_logger, publish_metric

health_bp = Blueprint("health", __name__)
logger = get_logger()

@health_bp.route("/health", methods=["GET"])
def health_check():
    try:
        client.is_ready()
        logger.info("Weaviate health check passed.")
        publish_metric("WeaviateHealth", 1)
        return jsonify({"status": "healthy"}), 200
    except Exception as e:
        logger.error(f"Weaviate health check failed: {str(e)}")
        publish_metric("WeaviateHealth", 0)
        return jsonify({"error": str(e), "status": "unhealthy"}), 500