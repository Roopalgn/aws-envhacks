import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from backend.ingest import capture
from backend.aws_handlers import api_handler, ingest_handler

class StorageError(Exception):
    def __init__(self,code):
        self.response={'Error':{'Code':code}}

class FakeS3:
    class exceptions:
        ClientError=StorageError
    def __init__(self):
        self.files={}
        self.uploads=[]
    def download_file(self,bucket,key,path):
        if key not in self.files:raise StorageError('404')
        Path(path).write_bytes(self.files[key])
    def upload_file(self,path,bucket,key,**kwargs):
        self.files[key]=Path(path).read_bytes()
        self.uploads.append(key)
    def get_object(self,Bucket,Key):
        if Key not in self.files:raise StorageError('NoSuchKey')
        return {'Body':io.BytesIO(self.files[Key])}

class PipelineTests(unittest.TestCase):
    def test_upstream_failure_preserves_existing_capture(self):
        with tempfile.TemporaryDirectory() as directory:
            output=Path(directory)/'processed'
            output.mkdir()
            previous=output/'latest.json'
            previous.write_text('{"previous":true}')
            with patch('backend.ingest.fetch',side_effect=OSError('provider unavailable')):
                with self.assertRaises(OSError):capture(output,Path(directory)/'raw')
            self.assertEqual(json.loads(previous.read_text()),{'previous':True})

    def test_invalid_feed_cannot_publish(self):
        with tempfile.TemporaryDirectory() as directory,patch('backend.ingest.fetch',return_value=b'<html>Error</html>'):
            with self.assertRaises(ValueError):capture(Path(directory)/'out',Path(directory)/'raw')
            self.assertFalse((Path(directory)/'out/latest.json').exists())

    def test_api_serves_capture_and_subset(self):
        s3=FakeS3()
        s3.files['processed/latest.json']=json.dumps({'sources':[{'id':'test-only'}]}).encode()
        with patch('backend.aws_handlers.storage',return_value=(s3,'test-bucket')):
            self.assertEqual(json.loads(api_handler({'rawPath':'/sources'},None)['body']),[{'id':'test-only'}])
            self.assertEqual(api_handler({'rawPath':'/events'},None)['statusCode'],503)
            self.assertEqual(api_handler({'rawPath':'/replay/../../private'},None)['statusCode'],404)
            self.assertEqual(json.loads(api_handler({'rawPath':'/health'},None)['body'])['backend'],'aws')

    def test_lambda_publishes_event_before_latest(self):
        s3=FakeS3()
        def local_capture(output,raw):
            raw.mkdir()
            (raw/'input.csv').write_text('test-only')
            dataset={'id':'capture-20261008T0900','sources':[]}
            for name in ('capture-20261008T0900.json','latest.json','events.json'):
                (output/name).write_text(json.dumps(dataset))
            return dataset
        with patch('backend.aws_handlers.storage',return_value=(s3,'test-bucket')),patch('backend.aws_handlers.capture',side_effect=local_capture):
            result=ingest_handler({},None)
        self.assertEqual(result['status'],'published')
        self.assertLess(s3.uploads.index('processed/capture-20261008T0900.json'),s3.uploads.index('processed/latest.json'))

    def test_lambda_capture_failure_does_not_publish(self):
        s3=FakeS3()
        with patch('backend.aws_handlers.storage',return_value=(s3,'test-bucket')),patch('backend.aws_handlers.capture',side_effect=ValueError('incomplete weather')):
            with self.assertRaises(ValueError):ingest_handler({},None)
        self.assertEqual(s3.uploads,[])
