from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from instance.config import get_env_variable
from .routes import bp as api_bp
from .auth import auth_bp

JWT_SECRET_KEY = get_env_variable("JWT_SECRET_KEY")
ALLOWED_ORIGINS = get_env_variable("FRONTEND_URLS").split(",")

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 900
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 86400

    CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)
    jwt.init_app(app)

    app.register_blueprint(api_bp)
    app.register_blueprint(auth_bp)

    return app