"""Test package. Tests must run offline: never read the developer's .env or call paid/limited APIs."""
import os

os.environ.setdefault("CTP_SKIP_DOTENV", "1")
