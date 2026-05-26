# %%
import fastf1
import pandas as pd
import logging
from datetime import datetime

pd.set_option('display.max_columns', None)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("f1_pipeline.ingestion")

class FastF1Extractor:

    def __init__(self):
        self.current_session = None
        logger.info("FastF1Extractor initialized!")

    def get_schedule(self, year: int) -> pd.DataFrame:
        logger.info("Loading schedule for year {year}")
        try:    
            schedule = fastf1.get_event_schedule(year)
            logger.info("Schedule loaded successfully!")
            return schedule
        except Exception as e:
            logger.error(f"Error loading schedule for year {year}: {e}")
            return None

    def load_session(self, year: int, event: int, session: str):
        logger.info(f"Loading session: {year} - GP {event} - {session}")
        try:
            session = fastf1.get_session(year, event, session)
            session.load()
            self.current_session = session
            logger.info("Session loaded successfully!")
            return self
        except Exception as e:
            logger.error(f"Error loading session: {e}")
            return None

    def extract_results(self) -> pd.DataFrame:
        logger.info("Extracting results...")
        try:
            results = pd.DataFrame(self.current_session.results)
            logger.info(f"Extracted {len(results)} results.")

            if results.empty:
                logger.warning("No results found.")
                return None

            return results
        except Exception as e:
            if not self.current_session:
                logger.error("No session loaded. Use load_session() first.")
            else:
                logger.error(f"Error extracting results: {e}")
                return None

    def extract_laps(self) -> pd.DataFrame:
        logger.info("Extracting laps...")
        try:
            laps = pd.DataFrame(self.current_session.laps)
            logger.info(f"Extracted {len(laps)} laps.")

            return laps
        except Exception as e:
            if not self.current_session:
                logger.error("No session loaded. Use load_session() first.")
            else:
                logger.error(f"Error extracting laps: {e}")
                return None

f1_extractor = FastF1Extractor()
# %%

schedule = f1_extractor.get_schedule(2026)
schedule

# %%

schedule = f1_extractor.get_schedule(2026)
qtd_gps = (schedule[
    (schedule['RoundNumber'] > 0) &
    (schedule['EventDate'] < datetime.now())]
    ['RoundNumber'].values
)

#%%

for gp in qtd_gps:
    for session in ['SQ', 'S', 'Q', 'R']:
        session = f1_extractor.load_session(2026, gp, session)
        if session is not None:
            results = f1_extractor.extract_results()
            laps = f1_extractor.extract_laps()

