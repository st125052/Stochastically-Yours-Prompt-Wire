import weaviate
from weaviate.classes.init import Auth
from config.env_loader import get_env_variable
from utils.cloudwatch_utils import get_logger, publish_metric

logger = get_logger()

WEAVIATE_URL = get_env_variable("WEAVIATE_URL")
WEAVIATE_API_KEY = get_env_variable("WEAVIATE_API_KEY")

try:
    logger.info(f"Attempting connection to Weaviate at {WEAVIATE_URL}...")
    client = weaviate.connect_to_local(
        host=WEAVIATE_URL,
        auth_credentials=Auth.api_key(WEAVIATE_API_KEY),
        port=8080,
        grpc_port=50051,
    )
    logger.info("Successfully connected to Weaviate.")
    publish_metric("WeaviateConnections", 1)

except Exception as e:
    logger.error(f"Failed to connect to Weaviate: {str(e)}", exc_info=True)
    publish_metric("WeaviateConnectionErrors", 1)
    raise