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

# Load environment variables
load_dotenv()

# Load secrets
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
WEAVIATE_URL = os.getenv("WEAVIATE_URL")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
WEAVIATE_CLASS = os.getenv("WEAVIATE_CLASS")
OPENAI_MODEL = os.getenv("OPENAI_MODEL")
OPENAI_TEMPERATURE = float(os.getenv("OPENAI_TEMPERATURE"))

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
CORS(app)

@app.route("/health", methods=["GET"])
def health_check():
    try:
        client.is_ready()
        return jsonify({"status": "healthy"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

@app.route("/query-answer", methods=["POST"])
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
    
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)