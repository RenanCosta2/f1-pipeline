FROM python:3.11-slim

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/app/dbt/

# dbt encoding settings and profile directory
ENV PYTHONIOENCODING=utf-8
ENV LANG=C.UTF-8
ENV DBT_PROFILES_DIR=/usr/app/dbt/

# Update tools and install dbt-core and dbt-bigquery
RUN python -m pip install --upgrade pip setuptools wheel --no-cache-dir \
    && python -m pip install --no-cache-dir dbt-core dbt-bigquery

COPY . .
RUN mkdir -p /app && if [ -f gcp-credentials.json ]; then cp gcp-credentials.json /app/gcp-credentials.json; fi

ENTRYPOINT ["dbt"]
