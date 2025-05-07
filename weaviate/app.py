from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_weaviate import WeaviateVectorStore
from langchain_core.documents import Document
import weaviate
from weaviate.classes.init import Auth

# Load environment variables
load_dotenv()

# Load secrets
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
WEAVIATE_URL = os.getenv("WEAVIATE_URL")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
WEAVIATE_CLASS = os.getenv("WEAVIATE_CLASS")

# Set LangChain key for embeddings
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# Initialize Weaviate client (v4)
client = weaviate.connect_to_weaviate_cloud(
    cluster_url=WEAVIATE_URL,
    auth_credentials=Auth.api_key(WEAVIATE_API_KEY),
    headers={"X-OpenAI-Api-Key": OPENAI_API_KEY}
)

# Initialize LangChain vector store
embedding = OpenAIEmbeddings()
vectorstore = WeaviateVectorStore(
    client=client,
    index_name=WEAVIATE_CLASS,
    text_key="page_content",
    embedding=embedding
)

# Flask app
app = Flask(__name__)

@app.route("/index-article", methods=["POST"])
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

@app.teardown_appcontext
def close_client(exception):
    client.close()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)