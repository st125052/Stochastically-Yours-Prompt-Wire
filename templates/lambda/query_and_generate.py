import boto3
import json
import os
import weaviate
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores.weaviate import Weaviate as LangWeaviate
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

secrets_client = boto3.client('secretsmanager')
SECRETS_NAME = "PromptWireEmbeddingSecrets"

def get_secrets():
    response = secrets_client.get_secret_value(SecretId=SECRETS_NAME)
    secret = json.loads(response['SecretString'])
    return secret["openai_api_key"], secret['openai_model'], secret['openai_temperature'], secret["weaviate_url"], secret["weaviate_class"], secret["weaviate_api_key"]

def build_prompt():
    prompt_template = """
    You are a helpful assistant that answers questions on recent news articles.
    Use the following context to answer the question. If you don't know the answer, just say you don't know.
    Don't make things up.    

    Context: {context}
    Question: {question}
    Answer:
    """.strip()

    PROMPT = PromptTemplate.from_template(
        template = prompt_template
    )
    return PROMPT

def lambda_handler(event, context):
    body = json.loads(event['body'])
    question = body.get("question", "")
    if not question:
        return {"statusCode": 400, "body": "Missing 'question' in input."}

    openai_key, openai_model, temperature, weaviate_url, weaviate_class, weaviate_key = get_secrets()
    os.environ["OPENAI_API_KEY"] = openai_key

    weaviate_client = weaviate.Client(
        url=weaviate_url,
        additional_headers={"Authorization": f"Bearer {weaviate_key}"}
    )

    retriever = LangWeaviate(
        client=weaviate_client,
        index_name=weaviate_class,
        text_key="page_content",
        embedding=OpenAIEmbeddings()
    ).as_retriever(search_kwargs={"k": int(body.get("num_sources", "3"))})

    llm = ChatOpenAI(model=openai_model, temperature=float(temperature))

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
        chain_type_kwargs={"prompt": build_prompt()}
    )

    answer = qa_chain.run(question)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"answer": answer})
    }