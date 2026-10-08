"""Import real, externally obtained PM2.5 CSV measurements, never sample values."""
import argparse
import csv
import json
import math
from pathlib import Path
from urllib.parse import urlsplit
from .model import parse_time

def normalize_observations(text, start, end):
    import io
    reader=csv.DictReader(io.StringIO(text))
    fields={'station','latitude','longitude','time','pm25','unit','source_url'}
    if not fields.issubset(reader.fieldnames or []):
        raise ValueError('CSV must include: '+', '.join(sorted(fields)))
    results=[]
    seen=set()
    for row in reader:
        if not row['station'].strip():
            raise ValueError('Every measurement requires a station name')
        if not row['time'].endswith('Z') and not ('+' in row['time'][10:] or '-' in row['time'][10:]):
            raise ValueError('Measurement time must include UTC offset or Z')
        time=parse_time(row['time'])
        lat,lon,value=float(row['latitude']),float(row['longitude']),float(row['pm25'])
        if not all(math.isfinite(x) for x in (lat,lon,value)) or not (-90<=lat<=90 and -180<=lon<=180 and value>=0):
            raise ValueError('Invalid measurement coordinates/value')
        if row['unit'] not in ('ug/m3','µg/m³','μg/m³'):
            raise ValueError('Only PM2.5 mass concentration in ug/m3 is supported')
        url=urlsplit(row['source_url'])
        if url.scheme!='https' or not url.netloc:
            raise ValueError('Every observation needs an HTTPS provenance URL')
        if not parse_time(start)<=time<=parse_time(end):
            continue
        key=(row['station'],lat,lon,time)
        if key in seen:
            raise ValueError('Duplicate station measurement timestamp')
        seen.add(key)
        results.append({'station':row['station'],'lat':lat,'lon':lon,'time':time.isoformat(),'value':value,'unit':'µg/m³','sourceUrl':row['source_url']})
    if not results:
        raise ValueError('No measurements overlap the captured run')
    return results

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv',type=Path)
    parser.add_argument('--dataset',type=Path,default=Path('public/data/latest.json'))
    args=parser.parse_args()
    data=json.loads(args.dataset.read_text(encoding='utf-8'))
    values=normalize_observations(args.csv.read_text(encoding='utf-8-sig'),data['frames'][0]['time'],data['frames'][-1]['time'])
    data['observations']=values
    data['observationStatus']='Imported ground measurements; review original provider quality flags'
    data['provenance']['observations']={'name':'Imported PM2.5 station measurements','url':values[0]['sourceUrl']}
    serialized=json.dumps(data,separators=(',',':'),allow_nan=False)
    # Update matching latest and event copies so replay and forecast remain consistent.
    for name in {args.dataset.name,data['id']+'.json','latest.json'}:
        path=args.dataset.parent/name
        if path.exists() and json.loads(path.read_text(encoding='utf-8'))['id']==data['id']:
            path.write_text(serialized,encoding='utf-8')
    print(f'Imported {len(values)} measurements. Provenance is preserved per station; scientific validation remains your responsibility.')

if __name__=='__main__':
    main()
