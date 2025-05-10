from flask import Blueprint, jsonify
from weaviate_client.client import client

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    try:
        client.is_ready()
        return jsonify({"status": "healthy"}), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "unhealthy"}), 500