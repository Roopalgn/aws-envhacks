import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { citySummaries, distanceKm, sourceContributions, sourcePath, windAt } from '../src/analysis.ts';

const capture = JSON.parse(readFileSync(new URL('../public/data/latest.json', import.meta.url), 'utf8'));

test('source groups reconcile with every saved city particle count', () => {
  for (const frame of capture.frames) for (const city of capture.locations) {
    const groups = sourceContributions(capture, city, frame.hour);
    assert.equal(groups.reduce((sum, g) => sum + g.count, 0), frame.influence[city.id].particles,
      `${city.id} at hour ${frame.hour}`);
    assert.ok(groups.every(g => capture.sources.some(s => s.id === g.source.id)));
  }
});

test('tracing preserves source identity when particles leave and arrays compact', () => {
  const data = { ...capture, sources: [{ id: 'gone' }, { id: 'remaining' }], frames: [
    { hour: 0, particles: [[30, 76, 0, 1], [31, 77, 1, 1], [31.2, 77.2, 1, 1]] },
    { hour: 1, particles: [[31.5, 77.5, 1, .9]] },
    { hour: 2, particles: [] },
  ] };
  const path = sourcePath(data, data.sources[1]);
  assert.equal(path.length, 2);
  assert.equal(path[0].count, 2);
  assert.ok(Math.abs(path[0].lat - 31.1) < 1e-10);
  assert.equal(path[1].lat, 31.5);
  assert.equal(sourcePath(data, { id: 'missing' }).length, 0);
});

test('location summaries retain true first proximity and earliest peak', () => {
  const data = { ...capture, locations: [{ id: 'none', name: 'None' }, { id: 'later', name: 'Later' }], frames:
    [0, 4, 4].map((n, hour) => ({ hour, influence: { none: { particles: 0 }, later: { particles: n } } })) };
  const [later, none] = citySummaries(data);
  assert.equal(later.firstHour, 1);
  assert.equal(later.peakHour, 1);
  assert.equal(later.gain, 4);
  assert.equal(none.firstHour, -1);
});

test('wind arrows use kilometer distances and vector components', () => {
  const grid = [
    { lat: 30, lon: 76, hours: [{ u: 10, v: -2 }] },
    { lat: 31, lon: 77, hours: [{ u: -10, v: 2 }] },
  ];
  const a = 1 / distanceKm(30.2, 76.1, 30, 76) ** 2;
  const b = 1 / distanceKm(30.2, 76.1, 31, 77) ** 2;
  const wind = windAt(grid, 30.2, 76.1, 0);
  assert.ok(Math.abs(wind.u - (10 * a - 10 * b) / (a + b)) < 1e-10);
  assert.ok(Math.abs(wind.v - (-2 * a + 2 * b) / (a + b)) < 1e-10);
  assert.ok(Math.abs(distanceKm(0, 0, 0, 1) - 111.195) < .001);
});
