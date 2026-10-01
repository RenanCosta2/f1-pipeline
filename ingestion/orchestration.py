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
logger = logging.getLogger("f1_pipeline.ingestion.orchestration")

def upload_obj(s3_uploader, df, buffer, key):

    df.to_parquet(buffer, index=False)
    buffer.seek(0)
    s3_uploader.upload_fileobj(buffer, key)


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
    parser = argparse.ArgumentParser(description='F1 Ingestion Pipeline')
    parser.add_argument('--year', type=int, default=datetime.now().year)
    parser.add_argument('--gp', type=int, default=1)
    parser.add_argument('--session', type=str, default='R')
    parser.add_argument('--force', action='store_true', help='Force re-ingestion, overwriting existing files and database rows')
    args = parser.parse_args()

    # Defining S3 keys for results and laps
    results_key = f"results/{args.year}/{args.gp}/{args.session}.parquet"
    laps_key = f"laps/{args.year}/{args.gp}/{args.session}.parquet"

    # Checking if files exist in S3 (bypass if force is True)
    results_in_s3 = s3_uploader.file_exists(results_key) if not args.force else False
    laps_in_s3 = s3_uploader.file_exists(laps_key) if not args.force else False

    # Checking if records exist in Postgres database
    results_in_db = postgres.session_exists('results', 'bronze', args.year, args.gp, args.session) if not args.force else False
    laps_in_db = postgres.session_exists('laps', 'bronze', args.year, args.gp, args.session) if not args.force else False

    # Fast recovery: If file exists in S3 but is missing in Postgres, recover from S3 without calling FastF1
    if results_in_s3 and not results_in_db:
        logger.info(f"Results for {args.year} GP {args.gp} {args.session} exist in S3 but missing in Postgres. Recovering from S3...")
        results_df = s3_uploader.download_parquet(results_key)
        if results_df is not None and not results_df.empty:
            postgres.load_data(results_df, 'results', 'bronze')
            results_in_db = True

    if laps_in_s3 and not laps_in_db:
        logger.info(f"Laps for {args.year} GP {args.gp} {args.session} exist in S3 but missing in Postgres. Recovering from S3...")
        laps_df = s3_uploader.download_parquet(laps_key)
        if laps_df is not None and not laps_df.empty:
            postgres.load_data(laps_df, 'laps', 'bronze')
            laps_in_db = True

    # If both results and laps are already in S3 and in Postgres, session is fully synced
    if results_in_s3 and results_in_db and laps_in_s3 and laps_in_db:
        logger.info(f"Session {args.year} GP {args.gp} {args.session} already fully present in both S3 and Postgres. Skipping.")
        return

    # If anything is still missing, trigger FastF1 extraction
    needs_results = not results_in_s3 or not results_in_db
    needs_laps = not laps_in_s3 or not laps_in_db

    if needs_results or needs_laps:
        loaded_session = f1_extractor.load_session(args.year, args.gp, args.session)
        
        if needs_results:
            results = f1_extractor.extract_results()

            if results is not None and not results.empty:
                results['year'] = args.year
                results['gp'] = args.gp
                results['session'] = args.session
                
                if args.force:
                    postgres.delete_session('results', 'bronze', args.year, args.gp, args.session)
                    
                results_buffer = io.BytesIO()
                upload_obj(s3_uploader, results, results_buffer, results_key)
                postgres.load_data(results, 'results', 'bronze')
            
        if needs_laps:
            laps = f1_extractor.extract_laps()

            if laps is not None and not laps.empty:
                laps['year'] = args.year
                laps['gp'] = args.gp
                laps['session'] = args.session
                
                if args.force:
                    postgres.delete_session('laps', 'bronze', args.year, args.gp, args.session)
                    
                laps_buffer = io.BytesIO()
                upload_obj(s3_uploader, laps, laps_buffer, laps_key)
                postgres.load_data(laps, 'laps', 'bronze')

if __name__ == "__main__":
    main()
    

