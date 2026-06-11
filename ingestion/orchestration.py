import argparse
import os
import io
from dotenv import load_dotenv
from datetime import datetime

from extractor import FastF1Extractor
from storage import S3Uploader
from database import PostgresLoader

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
    args = parser.parse_args()

    # Extracting F1 schedule
    schedule_key = f"schedule/{args.year}.parquet"
    if not s3_uploader.file_exists(schedule_key):
        schedule = f1_extractor.get_schedule(args.year)
        schedule_buffer = io.BytesIO()
        upload_obj(s3_uploader, schedule, schedule_buffer, schedule_key)
        postgres.load_data(schedule, 'schedule', 'bronze')

    # Defining S3 keys for results and laps
    results_key = f"results/{args.year}/{args.gp}/{args.session}.parquet"
    laps_key = f"laps/{args.year}/{args.gp}/{args.session}.parquet"

    # Checking if files exists in S3
    results_exists = s3_uploader.file_exists(results_key)
    laps_exists = s3_uploader.file_exists(laps_key)

    # Load session if either file does not exist in S3
    if not results_exists or not laps_exists:
        loaded_session = f1_extractor.load_session(args.year, args.gp, args.session)
        
        if not results_exists:
            results = f1_extractor.extract_results()
            results['session'] = args.session
            results_buffer = io.BytesIO()
            upload_obj(s3_uploader, results, results_buffer, results_key)
            postgres.load_data(results, 'results', 'bronze')
            
        if not laps_exists:
            laps = f1_extractor.extract_laps()
            laps['session'] = args.session
            laps_buffer = io.BytesIO()
            upload_obj(s3_uploader, laps, laps_buffer, laps_key)
            postgres.load_data(laps, 'laps', 'bronze')

if __name__ == "__main__":
    main()
    

