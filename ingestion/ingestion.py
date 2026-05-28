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
    """
    Extractor class for retrieving and parsing Formula 1 data using the FastF1 API.

    This class handles caching active sessions in memory and converting high-level
    FastF1 data structures into standard pandas DataFrames for downstream consumption.

    Attributes:
        current_session (fastf1.core.Session | None): The currently loaded F1 session
            object. Initialized to None.
    """

    def __init__(self):
        """
        Initializes the FastF1Extractor with an empty active session.
        """
        self.current_session = None
        logger.info("FastF1Extractor initialized!")

    def get_schedule(self, year: int) -> pd.DataFrame:
        """
        Loads the event schedule for a specific Formula 1 season.

        Args:
            year (int): The season year (e.g., 2026).

        Returns:
            pd.DataFrame: A DataFrame containing the events and metadata for the
                specified season, or None if the loading fails.
        """
        logger.info(f"Loading schedule for year {year}")
        try:    
            schedule = fastf1.get_event_schedule(year)
            logger.info("Schedule loaded successfully!")
            return schedule
        except Exception as e:
            logger.error(f"Error loading schedule for year {year}: {e}")
            return None

    def load_session(self, year: int, event: int, session: str):
        """
        Fetches and loads a specific Formula 1 session into memory.

        This method triggers the heavy network download and parsing of all session-related
        data (such as laps, telemetry, and results) and caches it in `self.current_session`.

        Args:
            year (int): The season year (e.g., 2026).
            event (int): The round number of the grand prix (e.g., 1).
            session (str): The session identifier (e.g., 'FP1', 'Q', 'R', 'SQ', 'S').

        Returns:
            FastF1Extractor | None: The extractor instance itself to support method
                chaining if loaded successfully, or None if the load fails.
        """
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
        """
        Extracts the session results from the currently loaded session.

        Returns:
            pd.DataFrame: A DataFrame with the final positions, drivers, teams,
                and points. Returns None if no session is loaded, if the results
                are empty, or if extraction fails.
        """
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
        """
        Extracts all lap times and lap metadata from the currently loaded session.

        Returns:
            pd.DataFrame: A DataFrame containing lap-by-lap timing and metadata.
                Returns None if no session is loaded or if extraction fails.
        """
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

