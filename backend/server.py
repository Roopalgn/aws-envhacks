"""Local, read-only API mirroring the deployed Lambda endpoints."""
import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

DATA = Path(__file__).resolve().parents[1]/'public/data'

def dataset_path(route):
    if route in ('/forecast','/sources','/wind','/locations','/observations'):
        return 'latest.json'
    if route == '/events':
        return 'events.json'
    # Keep pre-existing IDs readable while accepting unique capture suffixes.
    match = re.fullmatch(r'/replay/(capture-\d{8}T\d{4}(?:-[a-f0-9]{32})?)', route)
    if match:
        return match[1]+'.json'
    return None

def select_payload(route, dataset):
    part = route.strip('/')
    return dataset[part] if part in ('sources','wind','locations','observations') else dataset

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        route = urlsplit(self.path).path.removeprefix('/api')
        if route == '/health':
            self.respond(200, {'backend':'local','status':'ok'})
            return
        name = dataset_path(route)
        if not name:
            self.respond(404,{'error':'Unknown endpoint'})
            return
        path = DATA/name
        if not path.exists():
            self.respond(503,{'error':'Dataset unavailable; run ingestion first'})
            return
        self.respond(200,select_payload(route,json.loads(path.read_text(encoding='utf-8'))))

    def respond(self,status,payload):
        data=json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json')
        self.send_header('Content-Length',str(len(data)))
        self.send_header('Cache-Control','no-cache')
        self.end_headers()
        self.wfile.write(data)

if __name__ == '__main__':
    print('BreatheAhead API: http://127.0.0.1:8000/api/forecast',flush=True)
    ThreadingHTTPServer(('127.0.0.1',8000),Handler).serve_forever()
