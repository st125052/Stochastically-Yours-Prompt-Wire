from flask import Blueprint, jsonify
from weaviate_client.client import client
from utils.cloudwatch_utils import get_logger, publish_metric

home_bp = Blueprint("home", __name__)
logger = get_logger()

@home_bp.route("/", methods=["GET"])
def home():
    logger.info("Weaviate home endpoint accessed")
    publish_metric("WeaviateHome", 1)
    return jsonify({"message": "Welcome to the Weaviate API"}), 200