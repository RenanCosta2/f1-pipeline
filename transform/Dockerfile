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

# Update tools and install dbt-core and dbt-postgres
RUN python -m pip install --upgrade pip setuptools wheel --no-cache-dir \
    && python -m pip install --no-cache-dir dbt-core dbt-postgres

ENTRYPOINT ["dbt"]
