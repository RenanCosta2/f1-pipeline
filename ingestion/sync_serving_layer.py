import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv
from google.cloud import bigquery
from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, INTEGER, FLOAT, TEXT
import numpy as np
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("f1_pipeline.ingestion.serving_sync")


def infer_postgres_dtypes(bq_table):
    """
    Dynamically maps advanced BigQuery data types to native PostgreSQL types.
    Maps REPEATED fields to ARRAY and RECORD/JSON fields to JSONB.
    """
    dtype_map = {}
    for field in bq_table.schema:
        if field.mode == "REPEATED":
            if field.field_type in ("INTEGER", "INT64"):
                dtype_map[field.name] = ARRAY(INTEGER)
            elif field.field_type in ("FLOAT", "FLOAT64"):
                dtype_map[field.name] = ARRAY(FLOAT)
            else:
                dtype_map[field.name] = ARRAY(TEXT)
        elif field.field_type in ("JSON", "RECORD"):
            dtype_map[field.name] = JSONB
    return dtype_map


def infer_indexes(columns):
    """
    Infers recommended PostgreSQL B-Tree indexes based on common column conventions.
    """
    indexes = []
    cols = set(columns)

    # Temporal and session hierarchy
    if {"year", "round_number", "session_name"}.issubset(cols):
        indexes.append("(year, round_number, session_name)")
    elif {"year", "round_number"}.issubset(cols):
        indexes.append("(year, round_number)")
    elif "year" in cols:
        indexes.append("(year)")

    # Standings and finishing positions
    if "championship_position" in cols:
        indexes.append("(championship_position)")
    elif "finishing_position" in cols:
        indexes.append("(finishing_position)")

    # Main dimensional entities
    if "circuit_id" in cols:
        indexes.append("(circuit_id)")
    if "driver_id" in cols:
        indexes.append("(driver_id)")
    if "team_id" in cols:
        indexes.append("(team_id)")

    return indexes


def sync_serving_layer():
    """
    Synchronizes all marts models from BigQuery 'website' dataset
    to the PostgreSQL serving database (Supabase) with zero downtime.
    """
    load_dotenv()

    # Defensive path check for GCP service account credentials
    candidate_paths = [
        os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
        "/app/gcp-credentials.json",
        "/opt/airflow/config/gcp-credentials.json",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "gcp-credentials.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "gcp-credentials.json")),
    ]
    for candidate in candidate_paths:
        if candidate and os.path.exists(candidate):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = candidate
            break

    project_id = os.getenv("GCP_PROJECT_ID", "f1-analytics-platform")
    postgres_url = os.getenv("POSTGRES_CONNECTION_URL")

    if not postgres_url:
        logger.error("POSTGRES_CONNECTION_URL is required but was not provided.")
        sys.exit(1)

    if postgres_url.startswith("postgresql://"):
        postgres_url = postgres_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    logger.info(f"Connecting to BigQuery project: {project_id}...")
    bq_client = bigquery.Client(project=project_id)

    logger.info("Connecting to PostgreSQL serving layer (Supabase)...")
    engine = create_engine(postgres_url, pool_pre_ping=True)

    with engine.begin() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS website;"))

    # Auto-Discovery: dynamically lists all tables/views in website dataset
    dataset_ref = f"{project_id}.website"
    tables = [
        t.table_id for t in bq_client.list_tables(dataset_ref)
        if not t.table_id.startswith("_")
    ]
    tables.sort()
    logger.info(f"Discovered {len(tables)} models in BigQuery dataset '{dataset_ref}': {tables}")

    total_synced = 0
    start_time = datetime.now()

    for table_name in tables:
        logger.info(f"--- Synchronizing: {table_name} ---")
        try:
            # 1. Fetch table schema and infer types
            bq_table = bq_client.get_table(f"{dataset_ref}.{table_name}")
            dtype_mapping = infer_postgres_dtypes(bq_table)

            # 2. Extract records from BigQuery
            query = f"SELECT * FROM `{dataset_ref}.{table_name}`"
            df = bq_client.query(query).to_dataframe()
            rows_count = len(df)

            # Convert numpy ndarrays to python lists for psycopg2 compatibility
            for col in df.columns:
                if df[col].dtype == object:
                    df[col] = df[col].apply(lambda x: x.tolist() if isinstance(x, np.ndarray) else x)

            tmp_table = f"_tmp_{table_name}"

            # 3. Write records into temporary staging table
            df.to_sql(
                name=tmp_table,
                con=engine,
                schema="website",
                if_exists="replace",
                index=False,
                chunksize=2000,
                method="multi",
                dtype=dtype_mapping,
            )

            # 4. Atomic table swap (Zero Downtime) and index creation
            inferred_idx = infer_indexes(df.columns)

            with engine.begin() as conn:
                conn.execute(text(f"DROP TABLE IF EXISTS website.{table_name} CASCADE;"))
                conn.execute(text(f"ALTER TABLE website.{tmp_table} RENAME TO {table_name};"))

                for idx_cols in inferred_idx:
                    clean_cols = idx_cols.strip("()").replace(", ", "_").replace(" ", "_")
                    idx_name = f"idx_{table_name[:12]}_{clean_cols[:18]}"
                    conn.execute(
                        text(
                            f"CREATE INDEX IF NOT EXISTS {idx_name} "
                            f"ON website.{table_name} {idx_cols};"
                        )
                    )

            logger.info(
                f"Table website.{table_name} synchronized successfully "
                f"({rows_count} rows, {len(inferred_idx)} indexes built)."
            )
            total_synced += 1

        except Exception as e:
            logger.error(f"Error synchronizing table '{table_name}': {e}")
            raise e

    elapsed = (datetime.now() - start_time).total_seconds()
    logger.info(
        f"Serving layer synchronization completed successfully! "
        f"{total_synced}/{len(tables)} tables synced in {elapsed:.2f}s."
    )


if __name__ == "__main__":
    sync_serving_layer()
