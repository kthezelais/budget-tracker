import uuid
import os

# Generate a secure API key if not set
API_KEY = os.getenv("API_KEY", str(uuid.uuid4()))

# Database configuration
DATABASE_URL = "sqlite:///./database/budget.db"

# App configuration
APP_NAME = "Budget Tracker API"
APP_VERSION = "0.0.1"

# Network values
HOST_IP = "0.0.0.0"
HOST_PORT = 8000
PRODUCTION_URL = "__PRODUCTION_URL__"
DEV_MODE_ENABLED = int(os.getenv("DEV_MODE_ENABLED", 1))

# Default values
DEFAULT_BUDGET_AMOUNT = 1000.0
