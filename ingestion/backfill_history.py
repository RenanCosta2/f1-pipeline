import argparse
import time
from orchestration import ingest_session
from orchestration_schedule import ingest_schedule
from extractor import FastF1Extractor

def backfill_history(start_year: int, end_year:int):

    f1_extractor = FastF1Extractor()

    for year in range(start_year, end_year + 1):
        ingest_schedule(year)
        schedule = f1_extractor.get_schedule(year)
        total_gps = schedule["RoundNumber"].max()

        for gp in range(1, total_gps + 1):
            if year < 2003:
                sessions = ('R',)
            elif 2003 <= year < 2018:
                sessions = ('Q', 'R')
            else:
                sessions = ('FP1', 'FP2', 'FP3', 'SQ', 'S', 'Q', 'R')
            for session in sessions:
                ingest_session(year, gp, session)
                time.sleep(3)

if __name__ == "__main__":

    # Defining parsing arguments
    parser = argparse.ArgumentParser(description='F1 Ingestion Pipeline')
    parser.add_argument('--start_year', type=int)
    parser.add_argument('--end_year', type=int)
    args = parser.parse_args()

    backfill_history(args.start_year, args.end_year)