import os
from datetime import datetime, timedelta
from airflow.sdk import dag, Param
from airflow.providers.docker.operators.docker import DockerOperator

@dag(
    dag_id="f1_schedule_dag",
    start_date=datetime(2026, 1, 1),
    schedule="@monthly",
    catchup=False,
    tags=["ingestion", "f1", "schedule"],
    params={
        "year": Param(datetime.now().year, type="integer", minimum=1950, maximum=2100, description="Season year")
    }
)
def f1_schedule_dag():

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

    # Ingesting the season schedule ONCE before parallel session tasks
    # This prevents race conditions where multiple parallel tasks would
    # simultaneously detect the schedule as missing and insert it N times.
    ingest_schedule = DockerOperator(
        task_id="f1_ingest_schedule",
        image="f1-pipeline-ingestion:latest",
        command="python ingestion/orchestration_schedule.py --year {{ params.year }}",
        auto_remove="success",
        mount_tmp_dir=False,
        docker_url="unix://var/run/docker.sock",
        network_mode="f1-pipeline_default",
        environment=env_vars,
        retries=3,
        retry_delay=timedelta(minutes=2),
        execution_timeout=timedelta(minutes=5)
    )

    ingest_schedule

f1_schedule_dag()