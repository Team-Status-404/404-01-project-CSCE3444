# Testing Guide

This document outlines the conventions, structure, and best practices all contributors must follow when writing tests for the backend.

---

## 📁 Folder Structure

All tests live inside `backend/tests/`, mirroring the structure of `backend/models/`.

```
backend/
├── models/
│   ├── __init__.py
│   ├── alert_scheduler.py
│   ├── market_intelligence.py
│   ├── portfolio.py
│   └── user_management.py
├── app.py
└── tests/
    ├── TESTING.md
    ├── conftest.py
    ├── test_app.py
    ├── __init__.py
    └── models/
        ├── __init__.py
        ├── test_alert_scheduler.py
        ├── test_market_intelligence.py
        ├── test_portfolio.py
        └── test_user_management.py
```

- Each test file must correspond to a single source file in `models/`.
- Tests for `app.py` (e.g., route-level integration or E2E tests) go directly under `tests/`, named `test_app.py` or `test_<route_group>.py`.
- Do **not** dump unrelated tests into the root of `tests/` — always mirror the source path.
- Every subdirectory must contain an `__init__.py` file for Pytest discovery.
- Shared fixtures go in `tests/conftest.py`. If the `models/` subdirectory needs its own fixtures, add a separate `conftest.py` there.

---

## 📄 File Naming

| Type | Convention | Example |
|---|---|---|
| Unit test | `test_<filename>.py` | `test_portfolio.py` |
| Integration test | `test_<filename>_integration.py` | `test_user_management_integration.py` |
| App/route test | `test_app.py` or `test_<route_group>.py` | `test_auth_routes.py` |
| Shared fixtures | `conftest.py` | `conftest.py` |

- All test files **must** be prefixed with `test_` — this is required for Pytest discovery.
- Always use **snake_case** to match the source file's naming.
- Never name a file just `test.py` — names must be descriptive of what module they cover.

---

## ✏️ Test Function & Class Naming

### Functions
All test functions must be prefixed with `test_` and follow this pattern:

```
test_<method_or_behavior>_<condition>_<expected_result>
```

**Examples:**
```python
def test_create_portfolio_valid_data_returns_portfolio():
    ...

def test_create_portfolio_missing_user_raises_value_error():
    ...

def test_schedule_alert_invalid_threshold_raises_type_error():
    ...
```

### Classes
Group related tests using classes prefixed with `Test`, with no `__init__` method:

```python
class TestPortfolio:
    def test_create_portfolio_valid_data_returns_portfolio(self):
        ...

    def test_create_portfolio_missing_user_raises_value_error(self):
        ...
```

**Rules:**
- Be specific — avoid vague names like `test_works` or `test_error`.
- The name alone should describe the scenario being tested and the expected outcome.
- Never use `test1`, `test_a`, or similar placeholder names.

---

## 🧪 Test Types & When to Use Them

| Type | Purpose | Uses DB? | Uses External API? |
|---|---|---|---|
| **Unit** | Test a single function/class in isolation | ❌ | ❌ |
| **Integration** | Test how models interact with the DB or each other | ✅ | ❌ |
| **App/Route** | Test full Flask request/response cycle | ✅ | ❌ |

- Default to **unit tests** for logic inside `models/`.
- Use **integration tests** for database operations and cross-model interactions.
- Use **app/route tests** in `test_app.py` for testing Flask endpoints end-to-end.
- Any test that calls an external market data API must mock that API — never make live external calls in tests.

---

## ✅ Coverage Requirements

| Category | Minimum Threshold |
|---|---|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

- Coverage is enforced on every PR. Dropping below the threshold will **fail the CI pipeline**.
- Run coverage locally before pushing:
```bash
  pytest --cov=backend --cov-report=term-missing
```
- Do **not** use `# pragma: no cover` without a comment explaining why it's excluded.

---

## 🚀 Running Tests

All commands should be run from the `backend/` directory.

```bash
# Run all tests
pytest

# Run a specific file
pytest tests/models/test_portfolio.py

# Run a specific test function
pytest tests/models/test_portfolio.py::test_create_portfolio_valid_data_returns_portfolio

# Run a specific class
pytest tests/models/test_portfolio.py::TestPortfolio

# Run with coverage report
pytest --cov=backend --cov-report=term-missing

# Run in verbose mode
pytest -v
```

---

## ⚠️ General Rules

- **One assertion focus per test** — each test function should verify one behavior.
- **No shared mutable state** between tests. Use `conftest.py` fixtures to reinitialize state before each test.
- **Never skip tests permanently** — remove `@pytest.mark.skip` before merging, or open a ticket explaining why.
- **No `print()` statements in tests** — use `pytest -s` locally for debug output; remove before committing.
- Tests must be **deterministic** — no random data, no time-dependent logic without mocking (e.g., mock `datetime.now()` where needed).
- Avoid testing **implementation details** — test behavior and outputs, not internal method calls.
- All **external API calls** (market data, third-party services) must be mocked using `unittest.mock` or `pytest-mock`.
