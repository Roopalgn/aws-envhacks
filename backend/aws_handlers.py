"""AWS runtime: EventBridge -> Lambda -> S3; HTTP API -> Lambda -> S3."""
import json
import os
import tempfile
from pathlib import Path
from .ingest import capture
from .server import dataset_path, select_payload

def storage():
    import boto3
    return boto3.client('s3'), os.environ['DATA_BUCKET']

def is_missing_s3_object(exc):
    """Recognize only an explicit S3 missing-key response; rethrow everything else."""
    response = getattr(exc, 'response', {})
    error = response.get('Error', {})
    metadata = response.get('ResponseMetadata', {})
    return error.get('Code') in ('404', 'NoSuchKey', 'NotFound') or metadata.get('HTTPStatusCode') == 404

def ingest_handler(event,context):
    s3,bucket=storage()
    with tempfile.TemporaryDirectory() as directory:
        root=Path(directory)
        output, raw = root/'processed', root/'raw'
        output.mkdir()
        try:
            s3.download_file(bucket,'processed/events.json',str(output/'events.json'))
        except Exception as exc:
            if not is_missing_s3_object(exc):
                raise
        result=capture(output,raw)
        # Publish the immutable capture before the latest pointer and event index.
        for path in raw.iterdir():
            s3.upload_file(str(path),bucket,'raw/'+path.name)
        for name in (result['id']+'.json','latest.json','events.json'):
            s3.upload_file(str(output/name),bucket,'processed/'+name,ExtraArgs={'ContentType':'application/json'})
        return {'id':result['id'],'detections':len(result['sources']),'status':'published'}

def api_handler(event,context):
    route=event.get('rawPath','/')
    headers={'Content-Type':'application/json','Cache-Control':'public, max-age=60'}
    def response(status,data):
        return {'statusCode':status,'headers':headers,'body':json.dumps(data)}
    if route=='/health':
        return response(200,{'backend':'aws','status':'ok','storage':'s3'})
    name=dataset_path(route)
    if not name:
        return response(404,{'error':'Unknown endpoint'})
    s3,bucket=storage()
    try:
        item=s3.get_object(Bucket=bucket,Key='processed/'+name)
        data=json.loads(item['Body'].read())
        return response(200,select_payload(route,data))
    except Exception as exc:
        if is_missing_s3_object(exc):
            return response(503,{'error':'No captured dataset available yet'})
        raise
