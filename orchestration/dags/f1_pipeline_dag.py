import os
import logging
from datetime import datetime, timedelta
from airflow.sdk import dag, task
from airflow.exceptions import AirflowSkipException
from airflow.providers.docker.operators.docker import DockerOperator
from docker.types import Mount

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("f1_pipeline")

@dag(
    dag_id="f1_pipeline_dag",
    start_date=datetime(2026, 1, 1),
    schedule="0 * * * 4,5,6,0", 
    catchup=False,
    tags=["ingestion", "f1", "dbt", "gcp"],
)
def f1_pipeline_dag():

    @task
    def get_missing_gps(logical_date=None):
        from google.cloud import bigquery

        # Reading SQL file
        query_path = os.path.join(os.path.dirname(__file__), "queries", "get_missing_gps.sql")
        try:
            with open(query_path, "r", encoding="utf-8") as f:
                sql_query = f.read()
        except Exception as e:
            logger.error(f"Error reading SQL file: {e}")
            raise e

        try:
            project_id = os.getenv("GCP_PROJECT_ID", "f1-analytics-platform")
            creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            candidates = [
                creds_path,
                "/opt/airflow/config/gcp-credentials.json",
                "/opt/airflow/gcp-credentials.json",
                "/app/gcp-credentials.json",
            ]
            valid_creds = next(
                (c for c in candidates if c and os.path.exists(c) and os.path.getsize(c) > 0),
                None,
            )
            if valid_creds:
                client = bigquery.Client.from_service_account_json(valid_creds, project=project_id)
            else:
                client = bigquery.Client(project=project_id)

            query_job = client.query(sql_query)
            records = query_job.result()
            missing_gps = [[row["year"], row["gp"], row["session"]] for row in records]
            if not missing_gps:
                logger.info("No pending sessions for ingestion. Terminating execution early.")
                raise AirflowSkipException("No missing sessions found to ingest.")

            return [
                {"year": year, "gp": gp, "session": session}
                for year, gp, session in missing_gps
            ]
        except AirflowSkipException:
            raise
        except Exception as e:
            logger.error(f"Error querying BigQuery: {e}")
            raise e

    # Cache volume mapping
    fastf1_cache_mount = Mount(
        source="f1-pipeline_fastf1_cache", target="/app/cache", type="volume"
    )

    # Read environment variables
    env_vars = {
        "BUCKET_NAME": os.getenv("BUCKET_NAME", "f1-lake-storage"),
        "GCP_PROJECT_ID": os.getenv("GCP_PROJECT_ID", "f1-analytics-platform"),
        "GOOGLE_APPLICATION_CREDENTIALS": "/app/gcp-credentials.json",
        "POSTGRES_CONNECTION_URL": os.getenv("POSTGRES_CONNECTION_URL"),
        "F1_USERNAME": os.getenv("F1_USERNAME", ""),
        "F1_PASSWORD": os.getenv("F1_PASSWORD", ""),
        "TZ": os.getenv("TZ", "America/Sao_Paulo"),
    }

    gps_to_ingest = get_missing_gps()

    # Mounting the command for each GP
    commands = gps_to_ingest.map(
        lambda x: f"python ingestion/orchestration.py --year {x['year']} --gp {x['gp']} --session {x['session']}"
    )

    # Running the ingestion for each GP
    ingestion = DockerOperator.partial(
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

    # Running the dbt transformations
    dbt_build = DockerOperator(
        task_id="f1_dbt",
        image="f1-pipeline-dbt:latest",
        command="build --project-dir /usr/app/dbt/f1_dbt",
        auto_remove="success",
        docker_url="unix://var/run/docker.sock",
        mount_tmp_dir=False,
        network_mode="f1-pipeline_default",
        retries=3,
        retry_delay=timedelta(minutes=5),
    )

    # Synchronizing Serving Layer (Website) to Supabase (PostgreSQL)
    sync_serving = DockerOperator(
        task_id="f1_sync_serving",
        image="f1-pipeline-ingestion:latest",
        command="python ingestion/sync_serving_layer.py",
        auto_remove="success",
        docker_url="unix://var/run/docker.sock",
        mount_tmp_dir=False,
        network_mode="f1-pipeline_default",
        environment=env_vars,
        retries=3,
        retry_delay=timedelta(minutes=2),
    )

    gps_to_ingest >> ingestion >> dbt_build >> sync_serving

f1_pipeline_dag()
