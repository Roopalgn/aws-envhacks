import type { City, Dataset, Source, Wind } from './types';

/** Same great-circle distance and inverse-square weighting as the Python model. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const h = Math.sin((lat2 - lat1) * rad / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lon2 - lon1) * rad / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function windAt(grid: Wind[], lat: number, lon: number, hour: number) {
  let u = 0, v = 0, total = 0;
  for (const point of grid) {
    const wind = point.hours[hour];
    if (!wind) continue;
    const weight = 1 / Math.max(distanceKm(lat, lon, point.lat, point.lon), 1) ** 2;
    u += wind.u * weight; v += wind.v * weight; total += weight;
  }
  return total ? { u: u / total, v: v / total } : { u: 0, v: 0 };
}

export function sourcePath(data: Dataset, source: Source) {
  const index = data.sources.findIndex(s => s.id === source.id);
  if (index < 0) return [];
  return data.frames.flatMap(frame => {
    const particles = frame.particles.filter(p => p[2] === index && p[3] > 0);
    if (!particles.length) return [];
    return [{ hour: frame.hour, lat: particles.reduce((sum, p) => sum + p[0], 0) / particles.length,
      lon: particles.reduce((sum, p) => sum + p[1], 0) / particles.length, count: particles.length }];
  });
}

export function citySummaries(data: Dataset) {
  return data.locations.map(city => {
    const counts = data.frames.map(f => f.influence[city.id]?.particles ?? 0);
    const peak = Math.max(...counts);
    return { city, counts, peak, peakHour: counts.indexOf(peak), firstHour: counts.findIndex(n => n > 0), gain: peak - counts[0] };
  }).sort((a, b) => b.peak - a.peak || a.city.name.localeCompare(b.city.name));
}

/** Model source groups contributing particles inside the stated study radius. */
export function sourceContributions(data: Dataset, city: City, hour: number) {
  const groups = new Map<number, number>();
  for (const p of data.frames[hour]?.particles ?? []) {
    if (p[3] > 0 && distanceKm(p[0], p[1], city.lat, city.lon) <= data.model.influenceRadiusKm) {
      groups.set(p[2], (groups.get(p[2]) ?? 0) + 1);
    }
  }
  return [...groups].flatMap(([index, count]) => data.sources[index] ? [{ source: data.sources[index], count }] : [])
    .sort((a, b) => b.count - a.count || a.source.id.localeCompare(b.source.id));
}
