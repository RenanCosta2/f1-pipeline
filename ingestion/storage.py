import boto3
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("f1_pipeline.ingestion.storage")


class S3Uploader:
    """
    Storage class for uploading files to S3.

    Attributes:
        s3 (boto3.client): The S3 client.
        bucket_name (str): The name of the S3 bucket.
    """

    def __init__(
        self,
        bucket_name: str,
        AWS_REGION: str,
        S3_ENDPOINT_URL: str,
        AWS_ACCESS_KEY_ID: str,
        AWS_SECRET_ACCESS_KEY: str,
    ):
        # Initialize the S3 client
        self.s3 = boto3.client(
            "s3",
            region_name=AWS_REGION,
            endpoint_url=S3_ENDPOINT_URL,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        self.bucket_name = bucket_name

    def upload_file(self, file_path: str, key: str) -> bool:
        """
        Uploads a file to S3.

        Args:
            file_path (str): The path to the file to upload.
            key (str): The key (name) of the file in S3.

        Returns:
            bool: True if the file was uploaded successfully, False otherwise.
        """
        logger.info(f"Uploading file {file_path} to {key}")
        try:
            self.s3.upload_file(file_path, self.bucket_name, key)
            logger.info("File uploaded successfully!")
            return True
        except Exception as e:
            logger.error(f"Error uploading file {file_path}: {e}")
            return False

    def file_exists(self, key: str) -> bool:
        """
        Checks if a file exists in S3.

        Args:
            key (str): The key (name) of the file in S3.

        Returns:
            bool: True if the file exists, False otherwise.
        """
        logger.info(f"Checking if file {key} exists in S3")
        try:
            self.s3.head_object(Bucket=self.bucket_name, Key=key)
            logger.info("File exists!")
            return True
        except Exception as e:
            if e.response['Error']['Code'] == '404':
                logger.warning(f"File {key} does not exist.")
                return False
            logger.error(f"Error checking file {key}: {e}")
            return False