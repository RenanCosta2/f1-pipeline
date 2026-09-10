import argparse
import os
import io
from dotenv import load_dotenv
from datetime import datetime

from extractor import FastF1Extractor
from storage import S3Uploader
from database import PostgresLoader

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("f1_pipeline.ingestion.orchestration_schedule")


def main():
    load_dotenv()

    # Read environment variables
    bucket_name = os.getenv("BUCKET_NAME")

    # Initializing S3 instance
    s3_uploader = S3Uploader(
        bucket_name=bucket_name,
        AWS_REGION=os.getenv("AWS_REGION"),
        S3_ENDPOINT_URL=os.getenv("S3_ENDPOINT_URL"),
        AWS_ACCESS_KEY_ID=os.getenv("AWS_ACCESS_KEY_ID"),
        AWS_SECRET_ACCESS_KEY=os.getenv("AWS_SECRET_ACCESS_KEY")
    )

    # Initializing extractor instance
    f1_extractor = FastF1Extractor()
    # Initializing Postgres uploader instance
    postgres = PostgresLoader(connection_url=os.getenv("POSTGRES_CONNECTION_URL"))

    # Defining parsing arguments
    parser = argparse.ArgumentParser(description='F1 Schedule Ingestion')
    parser.add_argument('--year', type=int, default=datetime.now().year)
    args = parser.parse_args()

    # Extracting F1 schedule — runs only once per year
    schedule_key = f"schedule/{args.year}.parquet"
    if s3_uploader.file_exists(schedule_key):
        logger.info(f"Schedule for {args.year} already exists in S3. Skipping ingestion.")
        return

    logger.info(f"Schedule for {args.year} not found in S3. Starting ingestion...")
    schedule = f1_extractor.get_schedule(args.year)
    schedule['year'] = args.year

    schedule_buffer = io.BytesIO()
    schedule.to_parquet(schedule_buffer, index=False)
    schedule_buffer.seek(0)
    s3_uploader.upload_fileobj(schedule_buffer, schedule_key)

    postgres.load_data(schedule, 'schedule', 'bronze')
    logger.info(f"Schedule for {args.year} ingested successfully.")


if __name__ == "__main__":
    main()
