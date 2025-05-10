from langchain_openai import OpenAIEmbeddings
from langchain_weaviate import WeaviateVectorStore
from config.env_loader import get_env_variable
from weaviate_client.client import client

embedding = OpenAIEmbeddings()
WEAVIATE_CLASS = get_env_variable("WEAVIATE_CLASS")

vectorstore = WeaviateVectorStore(
    client=client,
    index_name=WEAVIATE_CLASS,
    text_key="page_content",
    embedding=embedding
)