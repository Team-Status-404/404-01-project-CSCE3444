# =============================================================================
# conftest.py — Pytest Shared Fixtures
# =============================================================================
# This file is automatically loaded by Pytest before any tests run.
# You do NOT need to import it anywhere — Pytest finds it by convention.
#
# PURPOSE:
#   Define reusable setup/teardown logic (called "fixtures") that multiple
#   test files can share. This keeps individual test files clean and prevents
#   duplicated setup code across the test suite.
#
# SCOPE:
#   Fixtures defined here are available to ALL tests under backend/tests/.
#   If a subdirectory (e.g., tests/models/) needs its own fixtures, create a
#   separate conftest.py inside that subdirectory.
#
# CI INTEGRATION:
#   Pytest is not yet a step in backend.yaml. When added, it should run after
#   the "Install Backend Dependencies" step and before server startup checks.
#   Suggested step to add to backend.yaml:
#
#       - name: Run Tests
#         env:
#           <same secrets as the Flask startup step>
#         run: pytest --cov=. --cov-report=term-missing
#
# HOW TO USE A FIXTURE IN A TEST:
#   Just add the fixture name as a parameter to your test function.
#   Pytest will inject it automatically — no import needed.
#
#   Example:
#       def test_something(flask_test_client):
#           response = flask_test_client.get("/some-route")
#           assert response.status_code == 200
#
# COMMON FIXTURES TO ADD HERE (implement as needed):
#   - flask_test_client  : A test client for sending requests to app.py routes
#   - db_connection      : A test database session/connection (use a test DB,
#                          never point this at production Supabase)
#   - mock_finance_api   : A mock for FINANCE_DATA_KEY external calls
#   - mock_news_api      : A mock for NEWSDATA_API_KEY external calls
#   - sample_user        : A reusable dummy user object for auth-related tests
#   - sample_portfolio   : A reusable dummy portfolio for portfolio model tests
# =============================================================================

import pytest


# -----------------------------------------------------------------------------
# Add your shared fixtures below this line.
# -----------------------------------------------------------------------------

# Example (uncomment and expand when ready):
#
# @pytest.fixture
# def flask_test_client():
#     """Returns a Flask test client for route-level tests."""
#     from app import app
#     app.config["TESTING"] = True
#     with app.test_client() as client:
#         yield client