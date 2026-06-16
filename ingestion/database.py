import os
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ArgumentError, NoSuchModuleError
import logging

logger = logging.getLogger("f1_pipeline.ingestion.database")

class PostgresLoader:
    """Loader class for writing pandas DataFrames to a PostgreSQL database.

    This class handles database engine creation and provides utility methods
    to upload structured data directly into designated target schemas and tables.

    Attributes:
        engine (sqlalchemy.engine.Engine): The database engine used for connections.
    """

    def __init__(self, connection_url: str):
        """Initializes the database connection engine.

        Args:
            connection_url (str): The PostgreSQL connection URL.

        Raises:
            ValueError: If the connection string is empty or None.
            sqlalchemy.exc.ArgumentError: If the connection URL format is invalid.
        """
        if not connection_url:
            raise ValueError("Connection string is missing.")

        try:
            self.engine = create_engine(connection_url)
            logger.info("PostgresLoader initialized successfully!")
        except (ArgumentError, NoSuchModuleError) as e:
            logger.error(f"Engine configuration initialization failed: {e}")
            raise

    def delete_session(self, table_name: str, schema_name: str, year: int, gp: int, session: str):
        """Deletes existing records for a specific year, GP, and session to prevent duplicates.

        Args:
            table_name (str): The target table name.
            schema_name (str): The target schema name (e.g., 'bronze').
            year (int): The season year.
            gp (int): The round number of the GP.
            session (str): The session identifier (e.g., 'R').
        """
        logger.info(f"Deleting existing records in {schema_name}.{table_name} for Year: {year}, GP: {gp}, Session: {session}")
        
        query = text(f"""
            DELETE FROM {schema_name}.{table_name}
            WHERE "year" = :year AND "gp" = :gp AND "session" = :session;
        """)
        
        try:
            with self.engine.begin() as conn:
                conn.execute(query, {"year": year, "gp": gp, "session": session})
            logger.info("Existing records deleted successfully.")
        except Exception as e:
            logger.warning(f"Could not delete existing records (table may not exist yet): {e}")

    def load_data(self, df: pd.DataFrame, table_name: str, schema_name: str):
        """Loads a pandas DataFrame into a specified PostgreSQL schema and table.

        This method dynamically creates the target schema if it does not exist
        before initiating the write operation.

        Args:
            df (pd.DataFrame): The DataFrame to load.
            table_name (str): The destination table name.
            schema_name (str): The destination schema name (e.g., 'bronze').

        Raises:
            Exception: If schema creation or table loading fails.
        """
        logger.info(f"Uploading the data into the table: {schema_name}.{table_name}")

        try:
            with self.engine.begin() as conn:
                conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name};"))

            df.to_sql(
                name=table_name,
                con=self.engine,
                schema=schema_name,
                if_exists='append',
                index=False
            )

            logger.info(f"Upload completed successfully for {schema_name}.{table_name}")
        except Exception as e:
            logger.error(f"Error uploading the data into the table: {schema_name}.{table_name}: {e}")
            raise