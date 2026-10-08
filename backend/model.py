"""Seeded Lagrangian surface-wind transport. Output is NOT PM2.5 or AQI."""
import math
import random
from datetime import datetime, timedelta, timezone

LOCATIONS = [
    {"id": "delhi", "name": "Delhi NCR", "lat": 28.6139, "lon": 77.209},
    {"id": "ludhiana", "name": "Ludhiana", "lat": 30.901, "lon": 75.8573},
    {"id": "chandigarh", "name": "Chandigarh", "lat": 30.7333, "lon": 76.7794},
    {"id": "patiala", "name": "Patiala", "lat": 30.3398, "lon": 76.3869},
    {"id": "hisar", "name": "Hisar", "lat": 29.1492, "lon": 75.7217},
    {"id": "karnal", "name": "Karnal", "lat": 29.6857, "lon": 76.9905},
    {"id": "jaipur", "name": "Jaipur", "lat": 26.9124, "lon": 75.7873},
]

def parse_time(value):
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)

def wind_uv(speed, direction):
    """Meteorological degrees FROM north -> eastward/northward m/s."""
    radians = math.radians(direction)
    return -speed * math.sin(radians), -speed * math.cos(radians)

def distance_km(lat1, lon1, lat2, lon2):
    a, b = math.radians(lat1), math.radians(lat2)
    h = math.sin((b-a)/2)**2 + math.cos(a)*math.cos(b)*math.sin(math.radians(lon2-lon1)/2)**2
    return 6371 * 2 * math.asin(min(1, math.sqrt(h)))

def interpolate_wind(grid, lat, lon, hour):
    # Interpolate vector components rather than circular direction angles.
    total = u = v = 0.0
    for point in grid:
        series = point['hours']
        i = min(int(hour), len(series)-1)
        j = min(i+1, len(series)-1)
        f = min(hour-i, 1)
        a, b = series[i], series[j]
        weight = 1 / max(distance_km(lat, lon, point['lat'], point['lon']), 1)**2
        u += (a['u']*(1-f) + b['u']*f)*weight
        v += (a['v']*(1-f) + b['v']*f)*weight
        total += weight
    if not total:
        raise ValueError('Cannot simulate without wind data')
    return u/total, v/total

def simulate(sources, grid, start, hours=24, seed=42, particles_per_source=8, diffusion=350):
    """One equal-weight pulse per detection, dt=15 min, K=350 m²/s.

    Normalized particle weights decay with a 12h e-folding time. No emission
    inventory, chemistry, deposition physics, injection height or calibration.
    Particles leave the wind grid rather than extrapolating indefinitely.
    """
    if not sources or not grid:
        raise ValueError('Source and wind data are required')
    if any(len(p['hours']) < hours+1 for p in grid):
        raise ValueError('Wind coverage must span the entire simulation')
    rng = random.Random(seed)
    particles = [[s['lat'], s['lon'], n, 1.0] for n, s in enumerate(sources) for _ in range(particles_per_source)]
    frames = []
    dt = 900
    jitter = math.sqrt(2*diffusion*dt)
    bounds = (min(p['lat'] for p in grid), max(p['lat'] for p in grid), min(p['lon'] for p in grid), max(p['lon'] for p in grid))
    for step in range(hours*4+1):
        hour = step/4
        if step % 4 == 0:
            influence = {}
            for city in LOCATIONS:
                near = [p for p in particles if p[3] > 0 and distance_km(p[0], p[1], city['lat'], city['lon']) <= 25]
                influence[city['id']] = {"particles": len(near), "weight": round(sum(p[3] for p in near), 3)}
            frames.append({"hour": int(hour), "time": (parse_time(start)+timedelta(hours=hour)).isoformat(),
                           "particles": [[round(p[0],5),round(p[1],5),p[2],round(p[3],3)] for p in particles if p[3]>0], "influence": influence})
        if step == hours*4:
            break
        for p in particles:
            if p[3] == 0:
                continue
            u, v = interpolate_wind(grid, p[0], p[1], hour)
            p[0] += (v*dt + rng.gauss(0,jitter))/111320
            p[1] += (u*dt + rng.gauss(0,jitter))/(111320*math.cos(math.radians(p[0])))
            p[3] = math.exp(-(hour+.25)/12)
            if not (bounds[0] <= p[0] <= bounds[1] and bounds[2] <= p[1] <= bounds[3]):
                p[3] = 0
    return frames
