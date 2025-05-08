from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_weaviate import WeaviateVectorStore
from langchain.chains import RetrievalQA
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.documents import Document
import weaviate
from weaviate.classes.init import Auth
from weaviate.classes.query import Filter

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
WEAVIATE_URL = os.getenv("WEAVIATE_URL")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
WEAVIATE_CLASS = os.getenv("WEAVIATE_CLASS")
OPENAI_MODEL = os.getenv("OPENAI_MODEL")
OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE"))
PORT=int(os.getenv("PORT", 5000))
DEBUG=os.getenv("DEBUG", "false").lower() == "true"

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

client = weaviate.connect_to_local(
    host=WEAVIATE_URL,
    auth_credentials=Auth.api_key(WEAVIATE_API_KEY),
    port=8080,
    grpc_port=50051,
)

embedding = OpenAIEmbeddings()
vectorstore = WeaviateVectorStore(
    client=client,
    index_name=WEAVIATE_CLASS,
    text_key="page_content",
    embedding=embedding
)

app = Flask(__name__)
CORS(app)

@app.route("/health", methods=["GET"])
def health_check():
    try:
        client.is_ready()
        return jsonify({"status": "healthy"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/index-article", methods=["POST"])
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

@app.route("/weaviate/add-article", methods=["POST"])
def add_article():
    data = request.get_json()
    page_content = data.get("page_content")
    metadata = data.get("metadata", {})

    if not page_content:
        return jsonify({"error": "Missing page_content"}), 400

    try:
        client.collections.get(WEAVIATE_CLASS).data.insert(
            properties={
                "page_content": page_content,
                **metadata
            }
        )
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/weaviate/list-article", methods=["GET"])
def list_article():
    article_id = request.args.get("article_id")
    if not article_id:
        return jsonify({"error": "Missing article_id param"}), 400

    try:
        results = client.collections.get(WEAVIATE_CLASS).query.fetch_objects(
            filters=Filter.by_property("article_id").equal(article_id),
            limit=1
        )
        return jsonify([obj.properties for obj in results.objects]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/query-answer", methods=["POST"])
def query_answer():
    data = request.get_json()
    question = data.get("question", "")
    k = int(data.get("num_sources", 3))

    if not question:
        return jsonify({"error": "Missing 'question'"}), 400

    try:
        retriever = WeaviateVectorStore(
            client=client,
            index_name=WEAVIATE_CLASS,
            text_key="page_content",
            embedding=OpenAIEmbeddings()
        ).as_retriever(search_kwargs={"k": k})

        prompt = PromptTemplate.from_template("""
            You are a helpful assistant that answers questions about recent news articles.
            Use the following context to respond. If you don't know, just say you don't know. Don't make up answers.
            Context: {context}
            Question: {question}
            Answer:
        """.strip())

        llm = ChatOpenAI(
            model=OPENAI_MODEL,
            temperature=OPENAI_TEMPERATURE
        )

        chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=retriever,
            chain_type="stuff",
            chain_type_kwargs={"prompt": prompt},
            return_source_documents=True
        )

        result = chain({"query": question})
        answer = result["result"]
        sources = [
            doc.metadata.get("url") or doc.metadata.get("link")
            for doc in result["source_documents"]
            if doc.metadata.get("url") or doc.metadata.get("link")
        ]

        return jsonify({
            "answer": answer,
            "sources": list(set(sources))
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/weaviate/list-articles", methods=["GET"])
def list_articles():
    try:
        results = client.collections.get(WEAVIATE_CLASS).query.fetch_objects(limit=100)
        return jsonify([obj.properties for obj in results.objects]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/weaviate/delete-article", methods=["DELETE"])
def delete_article():
    title = request.args.get("title")
    if not title:
        return jsonify({"error": "Missing title param"}), 400

    try:
        results = client.collections.get(WEAVIATE_CLASS).query.fetch_objects(
            filters=Filter.by_property("title").equal(title),
            limit=1
        )
        if not results.objects:
            return jsonify({"error": "Article not found"}), 404

        uid = results.objects[0].uuid
        client.collections.get(WEAVIATE_CLASS).data.delete_by_id(uid)
        return jsonify({"status": "deleted", "uuid": uid}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)