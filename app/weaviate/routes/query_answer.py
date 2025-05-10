from flask import Blueprint, request, jsonify
from langchain.prompts import PromptTemplate
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from weaviate_client.vectorstore import vectorstore
from config.env_loader import get_env_variable
from utils.cloudwatch_utils import get_logger, publish_metric
import time

query_bp = Blueprint("query_answer", __name__)
logger = get_logger()

OPENAI_MODEL = get_env_variable("OPENAI_MODEL")
OPENAI_TEMPERATURE = float(get_env_variable("OPENAI_TEMPERATURE"))

@query_bp.route("/api/query-answer", methods=["POST"])
def query_answer():
    start_time = time.time()
    try:
        data = request.get_json()
        question = data.get("question", "")
        k = int(data.get("num_sources", 3))
        chat_history = data.get("chat_history", [])

        if not question:
            logger.warning("Missing 'question' field in request")
            return jsonify({"error": "Missing 'question'"}), 400

        logger.info(f"Received query. Model: {OPENAI_MODEL}, k: {k}")

        history_text = ""
        for turn in chat_history:
            role = turn.get("role", "")
            content = turn.get("content", "")
            if role and content:
                history_text += f"{role.capitalize()}: {content}\n"

        full_query = f"{history_text}User: {question}"

        retriever = vectorstore.as_retriever(search_kwargs={"k": k})

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

        result = chain({"query": full_query})
        answer = result["result"]
        sources = [
            doc.metadata.get("url") or doc.metadata.get("link")
            for doc in result["source_documents"]
            if doc.metadata.get("url") or doc.metadata.get("link")
        ]

        latency_ms = (time.time() - start_time) * 1000
        publish_metric("QueriesProcessed", 1)
        publish_metric("QueryLatencyMs", latency_ms, unit="Milliseconds")

        logger.info(f"Query answered successfully in {latency_ms:.2f} ms")

        return jsonify({
            "answer": answer,
            "sources": list(set(sources))
        }), 200

    except Exception as e:
        logger.error(f"Error in /api/query-answer: {str(e)}", exc_info=True)
        publish_metric("QueryErrors", 1)
        return jsonify({"error": "Internal Server Error"}), 500