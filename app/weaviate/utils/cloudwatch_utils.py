import boto3
import watchtower
import logging
from config.env_loader import get_env_variable

def get_logger():
    session = boto3.Session(
        aws_access_key_id=get_env_variable("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=get_env_variable("AWS_SECRET_ACCESS_KEY"),
        region_name=get_env_variable("AWS_REGION")
    )

    handler = watchtower.CloudWatchLogHandler(
        log_group=get_env_variable("WEAVIATE_LOG_GROUP"),
        stream_name=get_env_variable("WEAVIATE_LOG_STREAM"),
        boto3_session=session
    )

    logger = logging.getLogger("promptwire")
    logger.setLevel(logging.INFO)

    # Prevent duplicate handler during reloads
    if not any(isinstance(h, watchtower.CloudWatchLogHandler) for h in logger.handlers):
        logger.addHandler(handler)

    return logger


def publish_metric(metric_name, value, unit="Count"):
    cloudwatch = boto3.client(
        'cloudwatch',
        aws_access_key_id=get_env_variable("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=get_env_variable("AWS_SECRET_ACCESS_KEY"),
        region_name=get_env_variable("AWS_REGION")
    )

    cloudwatch.put_metric_data(
        Namespace="PromptWire",
        MetricData=[{
            'MetricName': metric_name,
            'Value': value,
            'Unit': unit
        }]
    )