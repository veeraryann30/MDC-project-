"""Security hardening checks: secret handling, admin gate and production settings."""
import os
import subprocess
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from fastapi import HTTPException

from backend.app.security.auth import require_admin


class TestSecurityHardening(unittest.TestCase):
    def _run_isolated(self, code, **env):
        full_env = {k: v for k, v in os.environ.items() if k not in ("APP_ENV", "AUTH_SECRET_KEY")}
        full_env.update(env)
        return subprocess.run([sys.executable, "-c", code], cwd=ROOT, env=full_env, capture_output=True, text=True)

    def test_production_refuses_missing_secret(self):
        r = self._run_isolated("import backend.app.security.auth", APP_ENV="production")
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("AUTH_SECRET_KEY must be set", r.stderr)

    def test_production_refuses_old_public_default_secret(self):
        r = self._run_isolated(
            "import backend.app.security.auth",
            APP_ENV="production",
            AUTH_SECRET_KEY="catch-the-phish-super-secure-jwt-key-2026-xyz-token",
        )
        self.assertNotEqual(r.returncode, 0)

    def test_production_accepts_strong_secret(self):
        r = self._run_isolated("import backend.app.security.auth", APP_ENV="production", AUTH_SECRET_KEY="x" * 40)
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_cors_never_wildcard_by_default(self):
        from backend.app.core.config import settings
        self.assertNotIn("*", settings.CORS_ORIGINS)

    def test_require_admin_rejects_non_admin(self):
        with self.assertRaises(HTTPException) as ctx:
            require_admin({"sub": "1", "role": "analyst"})
        self.assertEqual(ctx.exception.status_code, 403)

    def test_require_admin_accepts_admin(self):
        self.assertEqual(require_admin({"sub": "1", "role": "admin"})["role"], "admin")


if __name__ == "__main__":
    unittest.main()
