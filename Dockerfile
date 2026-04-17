# ---- Build stage ----
FROM python:3.13-slim AS builder

WORKDIR /build

# System deps required to compile psycopg2, lxml, newspaper3k
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libxml2-dev \
    libxslt-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ---- Runtime stage ----
FROM python:3.13-slim

WORKDIR /app

# Runtime shared libraries needed by compiled packages (psycopg2, lxml, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libxml2 \
    libxslt1.1 \
    libjpeg62-turbo \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY . .

# Run as non-root for security
RUN useradd -m -r appuser && chown -R appuser:appuser /app
USER appuser

# Cloud Run injects PORT (default 8080); gunicorn binds to it.
# Workers=1, threads=8: Cloud Run scales horizontally — one process per instance
# with 8 threads handles concurrent requests without worker memory duplication.
# timeout=120 accommodates Gemini AI calls and yfinance fetches.
# NOTE: The SSE /api/stocks/<ticker>/stream endpoint requires a gevent worker
# for correct streaming under gunicorn. If SSE in production is a priority,
# add "gevent" to requirements.txt and change --threads 8 to
# --worker-class gevent --worker-connections 100
ENV PORT=8080
EXPOSE 8080

CMD exec gunicorn \
    --bind "0.0.0.0:${PORT}" \
    --workers 1 \
    --threads 8 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    app:app
