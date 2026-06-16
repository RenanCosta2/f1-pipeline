import os
import logging
from datetime import datetime, timedelta
from airflow.sdk import dag, task
from airflow.providers.docker.operators.docker import DockerOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from docker.types import Mount

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("f1_pipeline.ingestion")

@dag(
    dag_id="f1_ingestion_dag",
    start_date=datetime(2026, 1, 1),
    schedule="@daily",
    catchup=False,
    tags=["ingestion", "f1"],
)
def pipeline_ingestion():

    @task
    def get_missing_gps(logical_date=None):
        year = logical_date.year

        pg_hook = PostgresHook(postgres_conn_id="supabase_postgres")

        # Reading SQL file
        query_path = os.path.join(os.path.dirname(__file__), "queries", "get_missing_gps.sql")
        try:
            with open(query_path, "r", encoding="utf-8") as f:
                sql_template = f.read()
            sql_query = sql_template.format(year=year)
        except Exception as e:
            logger.error(f"Error reading SQL file: {e}")
            sql_query = ""

        try:
            # Retrieving missing GPs in the database
            records = pg_hook.get_records(sql_query)
            missing_gps = [[row[0], row[1]] for row in records]
            return [
                {"year": year, "gp": gp, "session": session}
                for gp, session in missing_gps
            ]
        except Exception as e:
            logger.error(f"Error querying database, falling back to GP 1: {e}")
            return [{"year": year, "gp": 1, "session": "R"}]

    # Cache volume mapping
    fastf1_cache_mount = Mount(
        source="f1-pipeline_fastf1_cache", target="/app/cache", type="volume"
    )

    # Read environment variables
    env_vars = {
        "BUCKET_NAME": os.getenv("BUCKET_NAME"),
        "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID"),
        "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY"),
        "AWS_REGION": os.getenv("AWS_REGION"),
        "S3_ENDPOINT_URL": os.getenv("S3_ENDPOINT_URL"),
        "POSTGRES_CONNECTION_URL": os.getenv("POSTGRES_CONNECTION_URL"),
        "TZ": os.getenv("TZ", "America/Sao_Paulo"),
    }

    gps_to_ingest = get_missing_gps()

    # Mounting the command for each GP
    commands = gps_to_ingest.map(
        lambda x: f"python ingestion/orchestration.py --year {x['year']} --gp {x['gp']} --session {x['session']}"
    )

    # Running the pipeline for each GP
    DockerOperator.partial(
        task_id="f1_ingestion",
        map_index_template="f1_ingestion_{{ task.command.split('python ingestion/orchestration.py ')[1].replace(' ', '_').replace('--', '') }}",
        image="f1-pipeline-ingestion:latest",
        auto_remove="success",
        mount_tmp_dir=False,
        docker_url="unix://var/run/docker.sock",
        network_mode="f1-pipeline_default",
        mounts=[fastf1_cache_mount],
        environment=env_vars,
        retries=3,
        retry_delay=timedelta(minutes=5),
        execution_timeout=timedelta(minutes=15)
    ).expand(command=commands)


pipeline_ingestion()