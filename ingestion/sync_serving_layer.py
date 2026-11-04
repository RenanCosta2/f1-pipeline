import argparse
import csv
import io
import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv
from google.cloud import bigquery
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, INTEGER, FLOAT, TEXT
import numpy as np
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("f1_pipeline.ingestion.serving_sync")


def psql_insert_copy(table, conn, keys, data_iter):
    """
    Fast bulk loader for pandas.to_sql using PostgreSQL's native COPY FROM STDIN protocol.
    Avoids SQL AST parsing overhead of multi-row INSERT statements.
    """
    dbapi_conn = conn.connection
    with dbapi_conn.cursor() as cur:
        s_buf = io.StringIO()
        writer = csv.writer(s_buf)
        writer.writerows(data_iter)
        s_buf.seek(0)

        columns = ", ".join(f'"{k}"' for k in keys)
        table_name = f"{table.schema}.{table.name}" if table.schema else table.name
        sql = f"COPY {table_name} ({columns}) FROM STDIN WITH CSV"
        cur.copy_expert(sql=sql, file=s_buf)


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


def get_incremental_plan(engine, table_name, bq_table, full_refresh=False):
    """
    Dynamically determines the synchronization strategy (dbt-style `is_incremental()`)
    based purely on table schema introspection and target database state (zero hardcoding):
      - 'full_replace': Table does not exist yet, schema changed, has no 'year' column,
        or --full-refresh was requested.
      - 'incremental': Table has a 'year' column and exists in PostgreSQL with matching schema;
        fetches from MAX(year) onwards and performs an atomic DELETE + INSERT for that partition.

    Returns:
        tuple[str, str | None]: (strategy_name, where_clause)
    """
    if full_refresh:
        return "full_replace", None

    bq_cols = [field.name for field in bq_table.schema]
    if "year" not in bq_cols:
        return "full_replace", None

    inspector = inspect(engine)
    if not inspector.has_table(table_name, schema="website"):
        return "full_replace", None

    pg_cols = [col["name"] for col in inspector.get_columns(table_name, schema="website")]
    if set(bq_cols) != set(pg_cols):
        logger.info(
            f"Schema change detected on website.{table_name} "
            f"(BQ: {len(bq_cols)} cols vs PG: {len(pg_cols)} cols). Falling back to full_replace."
        )
        return "full_replace", None

    with engine.connect() as conn:
        row = conn.execute(
            text(f"SELECT MAX(year) FROM website.{table_name}")
        ).fetchone()
        if row and row[0] is not None:
            max_year = int(row[0])
            return "incremental", f"WHERE year >= {max_year}"

    return "full_replace", None


def sync_serving_layer(full_refresh=False, selected_tables=None):
    """
    Synchronizes marts models from BigQuery 'website' dataset
    to the PostgreSQL serving database (Supabase) with zero downtime.
    Supports dynamic schema-driven incremental watermark detection (delete+insert)
    and native PostgreSQL COPY bulk loading.
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

    if selected_tables:
        tables = [t for t in tables if t in set(selected_tables)]

    mode_label = "FULL REFRESH" if full_refresh else "INCREMENTAL (auto-detected)"
    logger.info(
        f"Discovered {len(tables)} models in '{dataset_ref}' [Mode: {mode_label}]: {tables}"
    )

    total_synced = 0
    start_time = datetime.now()

    for table_name in tables:
        table_start = datetime.now()
        try:
            # 1. Fetch table schema, infer complex types, and build incremental plan dynamically
            bq_table = bq_client.get_table(f"{dataset_ref}.{table_name}")
            dtype_mapping = infer_postgres_dtypes(bq_table)
            strategy, where_clause = get_incremental_plan(
                engine, table_name, bq_table, full_refresh=full_refresh
            )

            logger.info(
                f"--- Synchronizing: {table_name} [strategy={strategy}"
                f"{f', filter={where_clause}' if where_clause else ''}] ---"
            )

            # 2. Extract records from BigQuery (filtered by watermark when incremental)
            query = f"SELECT * FROM `{dataset_ref}.{table_name}`"
            if where_clause:
                query = f"{query} {where_clause}"

            df = bq_client.query(query).to_dataframe(create_bqstorage_client=False)
            rows_count = len(df)

            if df.empty:
                logger.info(f"No rows returned for {table_name}. Skipping.")
                total_synced += 1
                continue

            # Convert numpy ndarrays to python lists for psycopg2 compatibility
            for col in df.columns:
                if df[col].dtype == object:
                    df[col] = df[col].apply(
                        lambda x: x.tolist() if isinstance(x, np.ndarray) else x
                    )

            tmp_table = f"_tmp_{table_name}"

            # 3. Write records into temporary staging table
            # For incremental runs, clone the exact target table schema via LIKE
            # to guarantee 100% column type compatibility even if a column is all-NULL in the delta.
            if strategy == "incremental":
                with engine.begin() as conn:
                    conn.execute(text(f"DROP TABLE IF EXISTS website.{tmp_table};"))
                    conn.execute(
                        text(f"CREATE TABLE website.{tmp_table} (LIKE website.{table_name});")
                    )
                if_exists_mode = "append"
            else:
                if_exists_mode = "replace"

            # Use native PostgreSQL COPY protocol for standard tabular models,
            # and SQLAlchemy multi-row insert when JSONB/ARRAY type mapping is required.
            if dtype_mapping:
                df.to_sql(
                    name=tmp_table,
                    con=engine,
                    schema="website",
                    if_exists=if_exists_mode,
                    index=False,
                    chunksize=2000,
                    method="multi",
                    dtype=dtype_mapping,
                )
            else:
                df.to_sql(
                    name=tmp_table,
                    con=engine,
                    schema="website",
                    if_exists=if_exists_mode,
                    index=False,
                    method=psql_insert_copy,
                )

            # 4. Atomic transaction (Zero Downtime): either swap table or delete+insert delta
            inferred_idx = infer_indexes(df.columns)
            quoted_cols = ", ".join(f'"{c}"' for c in df.columns)

            with engine.begin() as conn:
                if strategy == "full_replace":
                    conn.execute(text(f"DROP TABLE IF EXISTS website.{table_name} CASCADE;"))
                    conn.execute(text(f"ALTER TABLE website.{tmp_table} RENAME TO {table_name};"))
                elif strategy == "incremental":
                    conn.execute(
                        text(
                            f"""
                            DELETE FROM website.{table_name}
                            WHERE year IN (SELECT DISTINCT year FROM website.{tmp_table});
                            """
                        )
                    )
                    conn.execute(
                        text(
                            f"""
                            INSERT INTO website.{table_name} ({quoted_cols})
                            SELECT {quoted_cols} FROM website.{tmp_table};
                            """
                        )
                    )
                    conn.execute(text(f"DROP TABLE website.{tmp_table};"))

                for idx_cols in inferred_idx:
                    clean_cols = idx_cols.strip("()").replace(", ", "_").replace(" ", "_")
                    idx_name = f"idx_{table_name[:12]}_{clean_cols[:18]}"
                    conn.execute(
                        text(
                            f"CREATE INDEX IF NOT EXISTS {idx_name} "
                            f"ON website.{table_name} {idx_cols};"
                        )
                    )

            table_elapsed = (datetime.now() - table_start).total_seconds()
            logger.info(
                f"Table website.{table_name} synchronized ({strategy}: {rows_count} rows, "
                f"{len(inferred_idx)} indexes) in {table_elapsed:.2f}s."
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
    parser = argparse.ArgumentParser(description="Synchronize BigQuery website marts to Supabase PostgreSQL")
    parser.add_argument(
        "--full-refresh",
        action="store_true",
        help="Force full table replacement for all models (ignores incremental watermarks)",
    )
    parser.add_argument(
        "--select",
        nargs="+",
        default=None,
        help="Optional list of specific table names to synchronize",
    )
    args = parser.parse_args()
    sync_serving_layer(full_refresh=args.full_refresh, selected_tables=args.select)
