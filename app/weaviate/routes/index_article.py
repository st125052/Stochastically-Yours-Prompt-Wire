from flask import Blueprint, request, jsonify
from langchain_core.documents import Document
from weaviate_client.vectorstore import vectorstore

index_bp = Blueprint("index_article", __name__)

@index_bp.route("/api/index-article", methods=["POST"])
def index_article():
    data = request.get_json()
    page_content = data.get("page_content")
    metadata = data.get("metadata", {})

    if not page_content:
        return jsonify({"error": "Missing page_content"}), 400

    try:
        doc = Document(page_content=page_content, metadata=metadata)
        vectorstore.add_documents([doc])
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500