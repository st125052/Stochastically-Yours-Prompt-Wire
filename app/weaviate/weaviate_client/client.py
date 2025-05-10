import weaviate
from weaviate.classes.init import Auth
from config.env_loader import get_env_variable

WEAVIATE_URL = get_env_variable("WEAVIATE_URL")
WEAVIATE_API_KEY = get_env_variable("WEAVIATE_API_KEY")

client = weaviate.connect_to_local(
    host=WEAVIATE_URL,
    auth_credentials=Auth.api_key(WEAVIATE_API_KEY),
    port=8080,
    grpc_port=50051,
)