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
logger = logging.getLogger("f1_pipeline.ingestion.orchestration")

def upload_obj(gcs_uploader, df, buffer, key):
    df.to_parquet(buffer, index=False)
    buffer.seek(0)
    gcs_uploader.upload_fileobj(buffer, key)


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
    parser = argparse.ArgumentParser(description='F1 Ingestion Pipeline')
    parser.add_argument('--year', type=int, default=datetime.now().year)
    parser.add_argument('--gp', type=int, default=1)
    parser.add_argument('--session', type=str, default='R')
    parser.add_argument('--force', action='store_true', help='Force re-ingestion, overwriting existing files in GCS')
    args = parser.parse_args()

    # Defining GCS keys for results and laps
    results_key = f"results/{args.year}/{args.gp}/{args.session}.parquet"
    laps_key = f"laps/{args.year}/{args.gp}/{args.session}.parquet"

    # Checking if files exist in GCS (bypass if force is True)
    results_in_gcs = gcs_uploader.file_exists(results_key) if not args.force else False
    laps_in_gcs = gcs_uploader.file_exists(laps_key) if not args.force else False

    # Check if file exists in GCS
    if results_in_gcs:
        logger.info(f"Results for {args.year} GP {args.gp} {args.session} already exist in GCS")

    if laps_in_gcs:
        logger.info(f"Laps for {args.year} GP {args.gp} {args.session} already exist in GCS")

    # If both results and laps are already in GCS, session is fully synced
    session_is_synced = (
        (results_in_gcs and laps_in_gcs)
        if args.year >= 2018 else
        (results_in_gcs)
    )
    if session_is_synced:
        logger.info("Session already fully present... Skipping.")
        return

    needs_results = not results_in_gcs
    needs_laps = not laps_in_gcs and args.year >= 2018

    if needs_results or needs_laps:
        try:
            loaded_session = f1_extractor.load_session(args.year, args.gp, args.session)
        except ValueError as e:
            if "does not exist for this event" in str(e):
                logger.info(
                    f"Session '{args.session}' does not exist for {args.year} GP {args.gp}. Skipping gracefully."
                )
                return
            raise e
        
        if needs_results:
            results = f1_extractor.extract_results()

            if results is not None and not results.empty:
                results['year'] = args.year
                results['gp'] = args.gp
                results['session'] = args.session
                    
                results_buffer = io.BytesIO()
                upload_obj(gcs_uploader, results, results_buffer, results_key)
            
        if needs_laps:
            laps = f1_extractor.extract_laps()

            if laps is not None and not laps.empty:
                laps['year'] = args.year
                laps['gp'] = args.gp
                laps['session'] = args.session
                    
                laps_buffer = io.BytesIO()
                upload_obj(gcs_uploader, laps, laps_buffer, laps_key)

if __name__ == "__main__":
    main()
