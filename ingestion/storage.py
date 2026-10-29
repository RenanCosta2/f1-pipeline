import io
import os
import logging
import pandas as pd
from google.cloud import storage

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("f1_pipeline.ingestion.storage")


class GCSUploader:
    """
    Storage class for uploading and downloading files to/from Google Cloud Storage.

    Attributes:
        client (storage.Client): The GCS client.
        bucket (storage.Bucket): The target GCS bucket.
        bucket_name (str): The name of the GCS bucket.
    """

    def __init__(
        self,
        bucket_name: str,
        credentials_path: str | None = None,
        project_id: str | None = None,
    ):
        self.bucket_name = bucket_name
        try:
            # Defensive credential path resolution across multiple environments
            candidate_paths = [
                credentials_path,
                os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
                "/app/gcp-credentials.json",
                "/opt/airflow/config/gcp-credentials.json",
                os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "gcp-credentials.json")),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "gcp-credentials.json")),
            ]
            resolved_creds = None
            for candidate in candidate_paths:
                if candidate and os.path.exists(candidate):
                    resolved_creds = candidate
                    break

            if resolved_creds:
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = resolved_creds
                self.client = storage.Client.from_service_account_json(
                    resolved_creds, project=project_id
                )
            else:
                self.client = storage.Client(project=project_id)

            self.bucket = self.client.bucket(bucket_name)
            logger.info(f"Connected to GCS bucket: {bucket_name}")
        except Exception as e:
            logger.error(f"Failed to initialize GCS client for bucket '{bucket_name}': {e}")
            raise e

    def upload_file(self, file_path: str, key: str) -> bool:
        """
        Uploads a file to GCS.

        Args:
            file_path (str): The path to the file to upload.
            key (str): The key (name) of the file in GCS.

        Returns:
            bool: True if the file was uploaded successfully, False otherwise.
        """
        logger.info(f"Uploading file {file_path} to gs://{self.bucket_name}/{key}")
        try:
            blob = self.bucket.blob(key)
            blob.upload_from_filename(file_path)
            logger.info("File uploaded successfully!")
            return True
        except Exception as e:
            logger.error(f"Error uploading file {file_path}: {e}")
            return False

    def upload_fileobj(self, file_obj, key: str) -> bool:
        """
        Uploads an in-memory object to GCS.

        Args:
            file_obj: The in-memory file object (e.g. io.BytesIO) to upload.
            key (str): The key (name) of the file in GCS.

        Returns:
            bool: True if the file was uploaded successfully, False otherwise.
        """
        logger.info(f"Uploading in-memory object to gs://{self.bucket_name}/{key}")
        try:
            blob = self.bucket.blob(key)
            blob.upload_from_file(file_obj)
            logger.info("Object uploaded successfully!")
            return True
        except Exception as e:
            logger.error(f"Error uploading object to {key}: {e}")
            return False

    def file_exists(self, key: str) -> bool:
        """
        Checks if a file exists in GCS.

        Args:
            key (str): The key (name) of the file in GCS.

        Returns:
            bool: True if the file exists, False otherwise.
        """
        logger.info(f"Checking if file gs://{self.bucket_name}/{key} exists in GCS")
        try:
            blob = self.bucket.blob(key)
            exists = blob.exists()
            if exists:
                logger.info("File exists!")
            else:
                logger.warning(f"File {key} does not exist.")
            return exists
        except Exception as e:
            logger.error(f"Error checking file {key} in GCS: {e}")
            return False

    def download_parquet(self, key: str) -> pd.DataFrame | None:
        """
        Downloads a parquet file from GCS and returns it as a pandas DataFrame.

        Args:
            key (str): The key (name) of the file in GCS.

        Returns:
            pd.DataFrame | None: The loaded DataFrame, or None if download fails.
        """
        logger.info(f"Downloading parquet from GCS: gs://{self.bucket_name}/{key}")
        try:
            blob = self.bucket.blob(key)
            buffer = io.BytesIO()
            blob.download_to_file(buffer)
            buffer.seek(0)
            df = pd.read_parquet(buffer)
            logger.info(f"Parquet {key} downloaded successfully ({len(df)} rows)!")
            return df
        except Exception as e:
            logger.error(f"Error downloading parquet {key} from GCS: {e}")
            return None