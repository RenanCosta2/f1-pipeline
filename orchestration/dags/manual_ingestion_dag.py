import os
import logging
from datetime import datetime
from airflow.sdk import dag, task, Param
from airflow.providers.docker.operators.docker import DockerOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from docker.types import Mount

@dag(
    dag_id='f1_manual_ingestion_dag',
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=['ingestion', 'f1', 'manual'],
    params={
        'year': Param(2026, type='integer', description='Season year'),
        'gp': Param(1, type='integer', description='GP number'),
        'session': Param('R', type='string', description='GP session (FP1, FP2, FP3, SQ, S, Q, R)'),
        'force': Param(True, type='boolean', description='Force re-ingestion and overwrite existing S3 files and DB rows'),
    }
)

def manual_ingestion():

    @task
    def build_command(params=None):
        # Build the command with parameters
        year = params['year']
        gp = params['gp']
        session = params['session']
        force = params['force']
        
        command = f'python ingestion/orchestration.py --year {year} --gp {gp} --session {session}'
        if force:
            command += ' --force'
        return command

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

    command_to_run = build_command()

    DockerOperator(
        task_id='f1_manual_ingestion',
        map_index_template="f1_manual_ingestion_{{ task.command.split('python ingestion/orchestration.py ')[1].replace(' ', '_').replace('--', '') }}",
        image="f1-pipeline-ingestion:latest",
        command=command_to_run,
        auto_remove="success",
        mount_tmp_dir=False,
        docker_url="unix://var/run/docker.sock",
        network_mode="f1-pipeline_default",
        mounts=[fastf1_cache_mount],
        environment=env_vars,
    )

manual_ingestion()