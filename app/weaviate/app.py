from flask import Flask
from flask_cors import CORS
from config.env_loader import get_env_variable
from utils.cloudwatch_utils import get_logger
from routes.home import home_bp
from routes.health import health_bp
from routes.query_answer import query_bp
from routes.index_article import index_bp
from routes.list_article_by_id import list_article_id_bp
from routes.list_articles import list_bp
from routes.delete_article import delete_bp
from routes.add_article import add_article_bp

PORT = int(get_env_variable("PORT", 5000))
DEBUG = get_env_variable("DEBUG", "false").lower() == "true"
FRONTEND_URLS = get_env_variable("FRONTEND_URLS", "").split(",")

app = Flask(__name__)
CORS(app, origins=FRONTEND_URLS)

logger = get_logger()
logger.info("PromptWire Flask API started.")

app.register_blueprint(home_bp)
app.register_blueprint(health_bp)
app.register_blueprint(query_bp)
app.register_blueprint(index_bp)
app.register_blueprint(list_article_id_bp)
app.register_blueprint(list_bp)
app.register_blueprint(delete_bp)
app.register_blueprint(add_article_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)