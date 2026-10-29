import argparse
import os
import io
from dotenv import load_dotenv
from datetime import datetime

from extractor import FastF1Extractor
from storage import GCSUploader

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("f1_pipeline.ingestion.orchestration_schedule")


def main():
    load_dotenv()

    # Initializing GCS instance
    gcs_uploader = GCSUploader(
        bucket_name=os.getenv("BUCKET_NAME"),
        credentials_path=os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
        project_id=os.getenv("GCP_PROJECT_ID")
    )

    # Initializing extractor instance
    f1_extractor = FastF1Extractor()

    # Defining parsing arguments
    parser = argparse.ArgumentParser(description='F1 Schedule Ingestion')
    parser.add_argument('--year', type=int, default=datetime.now().year)
    args = parser.parse_args()

    # Extracting F1 schedule — runs only once per year
    schedule_key = f"schedule/{args.year}.parquet"
    if gcs_uploader.file_exists(schedule_key):
        logger.info(f"Schedule for {args.year} already exists in GCS. Skipping ingestion.")
        return

    logger.info(f"Schedule for {args.year} not found in GCS. Starting ingestion...")
    schedule = f1_extractor.get_schedule(args.year)
    schedule['year'] = args.year

    schedule_buffer = io.BytesIO()
    schedule.to_parquet(schedule_buffer, index=False)
    schedule_buffer.seek(0)
    gcs_uploader.upload_fileobj(schedule_buffer, schedule_key)

    logger.info(f"Schedule for {args.year} ingested successfully.")


if __name__ == "__main__":
    main()
