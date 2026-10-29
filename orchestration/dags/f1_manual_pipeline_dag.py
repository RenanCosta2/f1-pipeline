import os
from datetime import datetime, timedelta
from airflow.sdk import dag, task, Param
from airflow.providers.docker.operators.docker import DockerOperator
from docker.types import Mount

@dag(
    dag_id='f1_manual_pipeline_dag',
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=['ingestion', 'f1', 'manual', 'dbt', 'gcp'],
    params={
        'year': Param(2026, type='integer', minimum=1950, maximum=2100, description='Season year'),
        'gp_start': Param(1, type='integer', minimum=1, maximum=24, description='GP start number'),
        'gp_end': Param(1, type='integer', minimum=1, maximum=24, description='GP end number'),
        'sessions': Param(
            ['FP1', 'FP2', 'FP3', 'SQ', 'S', 'Q', 'R'], 
            type='array', 
            uniqueItems=True,
            items={
                'type': 'string',
                'enum': ['FP1', 'FP2', 'FP3', 'SQ', 'S', 'Q', 'R']
            },
            description='GP sessions (FP1, FP2, FP3, SQ, S, Q, R)'
            ),
        'force': Param(True, type='boolean', description='Force re-ingestion and overwrite existing GCS files and BQ rows'),
    }
)

def manual_ingestion():

    @task
    def build_command(params=None):
        # Build the command with parameters
        year = params['year']
        gp_start = params['gp_start']
        gp_end = params['gp_end']
        sessions = params['sessions']
        force = params['force']
        
        commands = []
        for gp in range(gp_start, gp_end + 1):
            for session in sessions:
                cmd = f"python ingestion/orchestration.py --year {year} --gp {gp} --session {session}"
                if force:
                    cmd += " --force"
                commands.append(cmd)
        
        return commands

    # Cache volume mapping
    fastf1_cache_mount = Mount(
        source="f1-pipeline_fastf1_cache", target="/app/cache", type="volume"
    )

    # Read environment variables
    env_vars = {
        "GCP_PROJECT_ID": os.getenv("GCP_PROJECT_ID", "f1-analytics-platform"),
        "BUCKET_NAME": os.getenv("BUCKET_NAME", "f1-lake-storage"),
        "GOOGLE_APPLICATION_CREDENTIALS": "/app/gcp-credentials.json",
        "POSTGRES_CONNECTION_URL": os.getenv("POSTGRES_CONNECTION_URL"),
        "TZ": os.getenv("TZ", "America/Sao_Paulo"),
    }

    commands_to_run = build_command()

    # Ingesting the season schedule ONCE before parallel session tasks
    ingest_schedule = DockerOperator(
        task_id="f1_ingest_schedule",
        image="f1-pipeline-ingestion:latest",
        command="python ingestion/orchestration_schedule.py --year {{ params.year }}",
        auto_remove="success",
        mount_tmp_dir=False,
        docker_url="unix://var/run/docker.sock",
        network_mode="f1-pipeline_default",
        mounts=[fastf1_cache_mount],
        environment=env_vars,
        retries=3,
        retry_delay=timedelta(minutes=2),
        execution_timeout=timedelta(minutes=5)
    )

    ingestion = DockerOperator.partial(
        task_id='f1_manual_ingestion',
        map_index_template="f1_manual_ingestion_{{ task.command.split('python ingestion/orchestration.py ')[1].replace(' ', '_').replace('--', '') }}",
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
    ).expand(command=commands_to_run)

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

    ingest_schedule >> commands_to_run >> ingestion >> dbt_build >> sync_serving

manual_ingestion()
