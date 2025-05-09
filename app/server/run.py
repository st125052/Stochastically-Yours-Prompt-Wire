from app import create_app
from instance.config import get_env_variable

# Local constants
PORT = int(get_env_variable("PORT", default=5000))
DEBUG = get_env_variable("DEBUG", default="False").lower() == "true"

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)