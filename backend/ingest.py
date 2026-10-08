"""Capture public source data, preserve raw responses, and produce replay JSON."""
import argparse
import csv
import hashlib
import io
import json
import math
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from .model import LOCATIONS, parse_time, simulate, wind_uv

FIRE_URL = 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/viirs/csv/SUOMI_VIIRS_C2_South_Asia_24h.csv'
ROOT = Path(__file__).resolve().parents[1]

def fetch(url):
    with urlopen(Request(url, headers={'User-Agent':'BreatheAhead/0.1 environmental-hackathon'}), timeout=55) as response:
        return response.read()

def normalize_fires(raw):
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    required = {'latitude','longitude','acq_date','acq_time','confidence','frp'}
    if not required.issubset(reader.fieldnames or []):
        raise ValueError('FIRMS response is missing required columns')
    sources, seen = [], set()
    for row in reader:
        lat, lon = float(row['latitude']), float(row['longitude'])
        if not (28 <= lat <= 32.5 and 73.5 <= lon <= 78):
            continue
        clock = row['acq_time'].zfill(4)
        detected = f"{row['acq_date']}T{clock[:2]}:{clock[2:]}:00+00:00"
        parse_time(detected)
        key = f"{lat},{lon},{detected}"
        if key in seen:
            continue
        seen.add(key)
        sources.append({'id':hashlib.sha256(key.encode()).hexdigest()[:12], 'lat':lat, 'lon':lon,
                        'detectedAt':detected, 'confidence':row['confidence'], 'frp':float(row['frp']), 'satellite':row.get('satellite','')})
    return sorted(sources, key=lambda s:(s['detectedAt'],s['lat'],s['lon']))

def capture(output=None, raw_dir=None):
    output = Path(output or ROOT/'public/data')
    raw_dir = Path(raw_dir or ROOT/'data/raw')
    output.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc)
    fire_raw = fetch(FIRE_URL)
    sources = normalize_fires(fire_raw)
    if not sources:
        raise ValueError('No fire detections in the region; the previous snapshot has been preserved')
    latest = max(parse_time(s['detectedAt']) for s in sources)
    start = latest.replace(minute=0,second=0,microsecond=0)+timedelta(hours=1)
    # Limit display/compute size with evenly spaced deterministic selection.
    count = len(sources)
    if count > 240:
        sources = [sources[math.floor(i*count/240)] for i in range(240)]
    coords = [(lat,lon) for lat in (26,29.5,33) for lon in (72,76,80)]
    query = {'latitude':','.join(str(p[0]) for p in coords),'longitude':','.join(str(p[1]) for p in coords),
             'hourly':'wind_speed_10m,wind_direction_10m','wind_speed_unit':'ms','timezone':'UTC',
             'start_date':start.date().isoformat(),'end_date':(start+timedelta(hours=24)).date().isoformat()}
    base = 'https://api.open-meteo.com/v1/forecast'
    if (now-start).days > 5:
        base = 'https://historical-forecast-api.open-meteo.com/v1/forecast'
    weather_url = base+'?'+urlencode(query)
    wind_raw = fetch(weather_url)
    payload = json.loads(wind_raw)
    if not isinstance(payload,list) or len(payload)!=len(coords):
        raise ValueError('Unexpected weather grid response')
    grid = []
    for coords_requested, record in zip(coords,payload):
        hourly = record['hourly']
        times = {parse_time(t):i for i,t in enumerate(hourly['time'])}
        values = []
        for h in range(25):
            idx = times.get(start+timedelta(hours=h))
            if idx is None:
                raise ValueError('Weather response does not cover simulation')
            speed, direction = hourly['wind_speed_10m'][idx], hourly['wind_direction_10m'][idx]
            if speed is None or direction is None or not math.isfinite(speed) or not math.isfinite(direction) or speed < 0 or not 0 <= direction <= 360:
                raise ValueError('Missing or invalid wind values; refusing to fabricate weather')
            u,v = wind_uv(speed,direction)
            values.append({'u':round(u,4),'v':round(v,4)})
        grid.append({'lat':coords_requested[0],'lon':coords_requested[1], 'modelLat':record['latitude'], 'modelLon':record['longitude'], 'hours':values})
    event_id = 'capture-'+start.strftime('%Y%m%dT%H%M')
    frames = simulate(sources,grid,start.isoformat())
    dataset = {'schemaVersion':1,'id':event_id,'title':'Northern India · captured transport run',
               'capturedAt':now.isoformat(),'startTime':start.isoformat(),'kind':'captured', 'totalDetections':count,
               'sources':sources,'wind':grid,'frames':frames,'locations':LOCATIONS,'observations':[],
               'observationStatus':'No verified ground observations connected',
               'provenance':{'fires':{'name':'NASA FIRMS · Suomi NPP VIIRS C2','url':FIRE_URL,'sha256':hashlib.sha256(fire_raw).hexdigest()},
                             'wind':{'name':'Open-Meteo · 10 m forecast wind','url':weather_url,'sha256':hashlib.sha256(wind_raw).hexdigest()},
                             'observations':None},
               'model':{'name':'Seeded surface-wind advection','version':'0.1.0','seed':42,'stepMinutes':15,'particlesPerSource':8,'diffusionM2S':350,'decayHours':12,'influenceRadiusKm':25,
                        'release':'All selected detections release an equal-weight pulse at the start time. Detection does not establish fuel type or continued burning.',
                        'limitations':'10 m winds, coarse grid, no plume rise or chemistry. Relative particle influence is not PM2.5, AQI, exposure dose or source attribution.'}}
    # Write only after both external sources and simulation succeed.
    (raw_dir/f'{event_id}-fires.csv').write_bytes(fire_raw)
    (raw_dir/f'{event_id}-wind.json').write_bytes(wind_raw)
    serialized = json.dumps(dataset,separators=(',',':'),allow_nan=False)
    (output/f'{event_id}.json').write_text(serialized,encoding='utf-8')
    temp = output/'latest.tmp'
    temp.write_text(serialized,encoding='utf-8')
    temp.replace(output/'latest.json')
    events_path = output/'events.json'
    events = json.loads(events_path.read_text(encoding='utf-8')) if events_path.exists() else []
    event = {k:dataset[k] for k in ('id','title','startTime','capturedAt')}
    events = [event]+[e for e in events if e['id']!=event_id]
    events_path.write_text(json.dumps(events[:30],indent=2),encoding='utf-8')
    print(f'Captured {len(sources)} of {count} detections; {len(grid)} wind cells; {len(frames)} frames; {event_id}')
    return dataset

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output')
    parser.add_argument('--raw-dir')
    args = parser.parse_args()
    capture(args.output,args.raw_dir)
