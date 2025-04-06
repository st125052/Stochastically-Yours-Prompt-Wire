import boto3
import json
import os
from datetime import datetime, timezone
import weaviate
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores.weaviate import Weaviate as LangWeaviate
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory

# AWS clients
secrets_client = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')
SECRETS_NAME = "PromptWireSecrets"

def get_secrets():
    response = secrets_client.get_secret_value(SecretId=SECRETS_NAME)
    secret = json.loads(response['SecretString'])
    return (
        secret["openai_api_key"],
        secret["openai_model"],
        secret["openai_temperature"],
        secret["weaviate_url"],
        secret["weaviate_class"],
        secret["weaviate_api_key"],
        secret["dynamodb_table"]
    )

def build_prompt():
    prompt_template = """
    You are a helpful assistant that answers questions on recent financial news articles.
    Use the following context and the prior conversation to answer the question.
    If you don't know the answer, just say you don't know.
    Do not make things up.    

    Chat History: {chat_history}
    Context: {context}
    Question: {question}

    Answer:
    """.strip()

    return PromptTemplate.from_template(template=prompt_template)

def get_user_chat_history(user_id, dynamo_table):
    table = dynamodb.Table(dynamo_table)
    response = table.get_item(Key={"user_id": user_id})
    if "Item" in response:
        return json.loads(response["Item"]["chat_history"])
    return []

def save_user_chat_history(user_id, chat_history, dynamo_table):
    table = dynamodb.Table(dynamo_table)
    table.put_item(Item={
        "user_id": user_id,
        "chat_history": json.dumps(chat_history),
        "updated_at": datetime.now(timezone.utc).isoformat()
    })

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))
    question = body.get("question", "")
    user_id = body.get("user_id", "")

    if not question or not user_id:
        return {"statusCode": 400, "body": "Missing 'question' or 'user_id' in input."}

    openai_key, openai_model, temperature, weaviate_url, weaviate_class, weaviate_key, dynamo_table = get_secrets()
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

    previous_turns = get_user_chat_history(user_id, dynamo_table)
    if not previous_turns:
        previous_turns = [{"human": "", "ai": ""}]
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    for turn in previous_turns:
        memory.chat_memory.add_user_message(turn["human"])
        memory.chat_memory.add_ai_message(turn["ai"])

    llm = ChatOpenAI(model=openai_model, temperature=float(temperature))

    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        return_source_documents=True,
        chain_type="stuff",
        chain_type_kwargs={"prompt": build_prompt()}
    )

    result = qa_chain({"question": question})

    updated_history = [
        {"human": u.content, "ai": a.content}
        for u, a in zip(memory.chat_memory.messages[::2], memory.chat_memory.messages[1::2])
    ]
    save_user_chat_history(user_id, updated_history, dynamo_table)

    sources = []
    for doc in result.get("source_documents", []):
        meta = doc.metadata
        sources.append({
            "title": meta.get("title"),
            "url": meta.get("url"),
            "published_at": meta.get("published_at"),
            "source": meta.get("source")
        })

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({
            "answer": result["answer"],
            "sources": sources
        })
    }