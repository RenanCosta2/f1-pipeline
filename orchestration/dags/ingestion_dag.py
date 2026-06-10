import os
from datetime import datetime
from airflow.sdk import dag
from airflow.providers.docker.operators.docker import DockerOperator
from docker.types import Mount

@dag(
    dag_id='f1_ingestion_dag',
    start_date=datetime(2026, 1, 1),
    schedule='@weekly',
    catchup=False,
    tags=['ingestion', 'f1']
)

def pipeline_ingestion():

    # Cache volume mapping
    fastf1_cache_mount = Mount(
        source='f1-pipeline_fastf1_cache',
        target='/app/cache',
        type='volume'
    )

    # Read environment variables
    env_vars = {
        'BUCKET_NAME': os.getenv('BUCKET_NAME'),
        'AWS_ACCESS_KEY_ID': os.getenv('AWS_ACCESS_KEY_ID'),
        'AWS_SECRET_ACCESS_KEY': os.getenv('AWS_SECRET_ACCESS_KEY'),
        'AWS_REGION': os.getenv('AWS_REGION'),
        'S3_ENDPOINT_URL': os.getenv('S3_ENDPOINT_URL')
    }

    # Running the pipeline
    DockerOperator(
        task_id='ingest',
        image='f1-pipeline-ingestion:latest',
        command=f'python ingestion/orchestration.py --year {{{{ logical_date.year }}}} --gp 1 --session R',
        auto_remove='success',
        mount_tmp_dir=False,
        docker_url='unix://var/run/docker.sock',
        network_mode='f1-pipeline_default',
        mounts=[fastf1_cache_mount],
        environment=env_vars
    )

pipeline_ingestion()