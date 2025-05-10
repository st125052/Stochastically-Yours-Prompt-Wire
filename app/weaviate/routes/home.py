from flask import Blueprint, jsonify
from weaviate_client.client import client

home_bp = Blueprint("home", __name__)

@home_bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the Weaviate API"}), 200