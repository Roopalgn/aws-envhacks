import { useEffect, useMemo, useRef, useState } from 'react';
import { Wind, ArrowUpRight, ArrowRight, Play, Pause, ChevronLeft, ChevronRight, Layers, Crosshair, Plus, Minus, Info, X, Radio, Flame, Clock3, ExternalLink, RefreshCw, Route, ScanLine, Fingerprint, Maximize2 } from 'lucide-react';
import { TransportMap } from './map';
import { citySummaries, distanceKm, sourceContributions, sourcePath, windAt } from './analysis';
import { EvidenceDialog } from './EvidenceDialog';
import type { Dataset, City, Source, Event } from './types';
import 'leaflet/dist/leaflet.css';
import './style.css';

const API = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL?.replace(/\/$/, '') || '';
const formatDate = (value: string) => new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST';
const HOURS = [0, 3, 6, 9, 12, 18, 24];
const CHAPTERS = ['The sources', 'Follow one pathway', 'Compare locations', 'Open the evidence'];
type Mode = 'SOURCES' | 'FORECAST' | 'REPLAY';
async function read<T,>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Data request failed (${response.status})`);
  return response.json();
}

export default function App() {
  const [data, setData] = useState<Dataset | null>(null), [events, setEvents] = useState<Event[]>([]), [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('FORECAST'), [hour, setHour] = useState(6), [playing, setPlaying] = useState(false), [selected, setSelected] = useState<City | Source | null>(null);
  const [layers, setLayers] = useState({ sources: true, wind: true, plume: true, observations: false, origins: false });
  const [dialog, setDialog] = useState<'method' | 'evidence' | null>(null), [loading, setLoading] = useState(false);
  const [backend, setBackend] = useState<'checking' | 'aws' | 'local' | 'unverified'>(API ? 'checking' : 'local');
  const [mapAction, setMapAction] = useState({ type: 'reset', nonce: 0 });
  const [tour, setTour] = useState<number | null>(null), [focus, setFocus] = useState(false);
  const request = useRef(0), dialogOpener = useRef<HTMLElement | null>(null);

  const load = async (eventId?: string) => {
    const id = ++request.current;
    setLoading(true); setError(''); setPlaying(false); setTour(null);
    try {
      const result = await read<Dataset>(API ? `${API}/${eventId ? `replay/${encodeURIComponent(eventId)}` : 'forecast'}` : eventId ? `/data/${encodeURIComponent(eventId)}.json` : '/data/latest.json');
      if (id !== request.current) return;
      if (result.schemaVersion !== 1 || result.frames?.length !== 25 || !result.sources?.length || !result.locations?.length || !result.wind?.length) throw new Error('This dataset is incomplete. Capture a new run.');
      setData(result); setSelected(result.locations[0]); setHour(eventId || mode !== 'FORECAST' ? 0 : 6);
      const [index, health] = await Promise.allSettled([
        read<Event[]>(API ? `${API}/events` : '/data/events.json'),
        API ? read<{ backend: string }>(`${API}/health`) : Promise.resolve({ backend: 'local' }),
      ]);
      if (id !== request.current) return;
      setEvents(index.status === 'fulfilled' ? index.value : [{ id: result.id, title: result.title, startTime: result.startTime, capturedAt: result.capturedAt }]);
      setBackend(health.status === 'fulfilled' ? health.value.backend === 'aws' ? 'aws' : 'local' : 'unverified');
    } catch (e) {
      if (id === request.current) { setError(e instanceof Error ? e.message : 'Unable to load data'); if (API) setBackend('unverified'); }
    } finally { if (id === request.current) setLoading(false); }
  };
  useEffect(() => { void load(); return () => { request.current++; }; }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setHour(h => { if (h >= 23) setPlaying(false); return Math.min(24, h + 1); }), 1200);
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (dialog) setDialog(null);
        else { setTour(null); setFocus(false); setPlaying(false); }
      }
      if (dialog && event.key === 'Tab') {
        const items = document.querySelectorAll<HTMLElement>('.modal button, .modal a[href]');
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [dialog]);
  useEffect(() => { if (!dialog) dialogOpener.current?.focus(); }, [dialog]);
  useEffect(() => {
    if (!dialog) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prior; };
  }, [dialog]);
  useEffect(() => { if (tour !== null) window.scrollTo({ top: 0, behavior: 'auto' }); }, [tour]);
  const openDialog = (kind: 'method' | 'evidence') => { dialogOpener.current = document.activeElement as HTMLElement; setPlaying(false); setDialog(kind); };

  const summaries = useMemo(() => data ? citySummaries(data) : [], [data]);
  const city = selected && 'name' in selected ? selected : null;
  const source = selected && 'detectedAt' in selected ? selected : null;
  const frame = data?.frames[hour];
  const summary = summaries.find(s => s.city.id === city?.id);
  const near = city ? frame?.influence[city.id]?.particles || 0 : 0;
  const radius = data?.model.influenceRadiusKm ?? 25;
  const contributions = useMemo(() => city && data ? sourceContributions(data, city, hour) : [], [city, data, hour]);
  const path = useMemo(() => source && data ? sourcePath(data, source) : [], [source, data]);
  const sourceIndex = data?.sources.findIndex(s => s.id === source?.id) ?? -1;
  const sourceParticles = frame?.particles.filter(p => p[2] === sourceIndex).length ?? 0;
  const point = path.find(p => p.hour === hour);
  const displacement = source && point ? distanceKm(source.lat, source.lon, point.lat, point.lon) : null;
  const localWind = selected && data ? windAt(data.wind, selected.lat, selected.lon, hour) : null;
  const windSpeed = localWind ? Math.hypot(localWind.u, localWind.v) : 0;
  const windBearing = localWind ? (Math.atan2(localWind.u, localWind.v) * 180 / Math.PI + 360) % 360 : 0;
  const effectiveLayers = { ...layers, plume: mode !== 'SOURCES' && layers.plume, origins: mode !== 'SOURCES' && layers.origins };
  const selectHour = (h: number) => { setHour(h); setPlaying(false); };
  const changeMode = (next: Mode) => { setMode(next); setPlaying(false); setHour(next === 'FORECAST' ? 6 : 0); setTour(null); };
  const action = (type: string) => setMapAction(a => ({ type, nonce: a.nonce + 1 }));
  const toggle = (key: keyof typeof layers) => setLayers(v => ({ ...v, [key]: !v[key] }));
  const traceSource = (s: Source) => { setSelected(s); setMode('FORECAST'); setLayers(v => ({ ...v, sources: true, plume: true })); action('trace'); };

  const showChapter = (chapter: number) => {
    if (!data) return;
    setTour(chapter); setFocus(true); setPlaying(false); setDialog(null);
    setLayers({ sources: true, wind: chapter !== 0, plume: chapter !== 0, observations: false, origins: chapter === 1 });
    action('reset');
    if (chapter === 0) { setMode('SOURCES'); setHour(0); setSelected(data.sources[0]); }
    if (chapter === 1) {
      const candidates = data.sources.map(s => { const points = sourcePath(data, s); const end = points[points.length - 1]; return { source: s, distance: end ? distanceKm(s.lat, s.lon, end.lat, end.lon) : 0 }; });
      candidates.sort((a, b) => b.distance - a.distance);
      setSelected(candidates[0].source); setMode('FORECAST'); setHour(0); setPlaying(true);
      action('trace');
    }
    if (chapter === 2) {
      const later = summaries.filter(s => s.firstHour > 0);
      const target = [...(later.length ? later : summaries)].sort((a, b) => b.gain - a.gain || b.peak - a.peak)[0];
      setSelected(target.city); setMode('FORECAST'); setHour(target.peakHour);
    }
    if (chapter === 3) { setMode('REPLAY'); setHour(6); }
  };

  return <div className={`app ${focus ? 'presentation' : ''}`}>
    <header className="topbar">
      <a className="brand" href="/" aria-label="BreatheAhead home"><span className="brand-icon"><Wind size={25} /></span><span>BreatheAhead<small>SOURCE <b>→</b> TRANSPORT <b>→</b> INFLUENCE</small></span></a>
      <nav aria-label="Map mode">{(['SOURCES', 'FORECAST', 'REPLAY'] as const).map(m => <button key={m} aria-pressed={mode === m} className={mode === m ? 'active' : ''} onClick={() => changeMode(m)}>{m}</button>)}</nav>
      <div className="status"><span><i className="dot" />{API ? data ? 'CAPTURED DATA · API' : 'CONNECTING' : 'CAPTURED DATA · LOCAL'}</span><small>{backend === 'aws' ? 'AWS backend verified' : backend === 'checking' ? 'Checking API connection' : backend === 'unverified' ? 'API health unverified' : 'Local captured replay'}</small>{data && <span className="capture-stamp">Captured {formatDate(data.capturedAt)}</span>}</div>
    </header>
    <main>
      <section className="intro"><div><div className="eyebrow"><span className="line" /> NORTHERN INDIA / AIR INTELLIGENCE</div><h1>See pollution <em>move.</em></h1><p>Follow the sources. Read the wind. Explore what could be downwind.</p></div>
        <div className="intro-actions"><button className="tour-start" disabled={!data || loading} onClick={() => showChapter(0)}><Play size={14} /> Guided tour <ArrowUpRight size={15} /></button><button className="method-button" onClick={() => openDialog('method')}><Info size={16} /> How the model works</button></div>
      </section>
      {tour !== null && <section className="tour-bar" aria-label="Guided tour"><div className="tour-title"><span className="chapter-number">0{tour + 1}<small>/ 04</small></span><div><span className="eyebrow">SOURCE → TRANSPORT → POTENTIAL INFLUENCE</span><strong>{CHAPTERS[tour]}</strong></div></div><div className="tour-nav">{CHAPTERS.map((label, i) => <button key={label} aria-label={`Tour chapter ${i + 1}: ${label}`} aria-current={tour === i ? 'step' : undefined} onClick={() => showChapter(i)} className={tour === i ? 'active' : ''}>{i + 1}</button>)}</div><div className="tour-actions"><button aria-label="Previous tour chapter" disabled={tour === 0} onClick={() => showChapter(tour - 1)}><ChevronLeft size={17} /></button><button onClick={() => tour === 3 ? (setTour(null), setFocus(false), setPlaying(false)) : showChapter(tour + 1)}>{tour === 3 ? 'Finish tour' : 'Next chapter'}<ArrowRight size={15} /></button><button aria-label="Exit guided tour" onClick={() => { setTour(null); setFocus(false); setPlaying(false); }}><X size={17} /></button></div></section>}
      <section className="workspace">
        <div className="map-column">
          <div className="map-heading"><div><span className="indicator" />{mode === 'REPLAY' ? 'CAPTURED RUN REPLAY' : mode === 'SOURCES' ? 'SATELLITE SOURCE CAPTURE' : 'TRANSPORT EXPLORER'}<span className="divider">/</span><span className="muted">Punjab · Haryana · NCR</span></div><div className="map-heading-actions"><span className="mono">{frame ? formatDate(frame.time) : 'LOADING DATA'}</span><button aria-label={focus ? 'Exit presentation view' : 'Enter presentation view'} aria-pressed={focus} onClick={() => setFocus(!focus)}><Maximize2 size={13} /></button></div></div>
          <div className="map-wrap">
            {data && frame && <TransportMap data={data} hour={hour} layers={effectiveLayers} selected={selected} onSelect={setSelected} action={mapAction} playing={playing} />}
            <div className="map-badge"><span className="dot orange" />{mode === 'SOURCES' ? 'SATELLITE DETECTIONS' : source ? 'SELECTED SOURCE · MODELED PATH' : mode === 'REPLAY' ? 'CAPTURED MODEL RUN' : 'POTENTIAL SMOKE INFLUENCE'}<small>{mode === 'SOURCES' ? 'Saved capture · acquisition time per detection' : source ? 'Mean position of this source’s surviving particles' : 'Relative particles · 10 m wind approximation'}</small></div>
            <div className="map-controls"><button aria-label="Zoom in" onClick={() => action('in')}><Plus size={18} /></button><button aria-label="Zoom out" onClick={() => action('out')}><Minus size={18} /></button><button aria-label="Reset map view" onClick={() => action('reset')}><Crosshair size={18} /></button></div>
            <div className="region-note"><span>INDIA</span><small>28°–33° N / 73°–80° E</small></div>
            {tour !== null && <div className="story-card"><span className="eyebrow">CHAPTER 0{tour + 1}</span><h3>{['Real detections. A visible starting point.', 'One source. A changing pathway.', 'Same winds. Different local patterns.', 'Every run has a paper trail.'][tour]}</h3><p>{tour === 0 ? `${data?.sources.length} captured thermal anomalies. Select a fire point to inspect its acquisition time and confidence.` : tour === 1 ? 'The highlighted line follows the mean position of particles released from one detection. The faint rings mark starting positions.' : tour === 2 ? `At +${hour}h, ${near} modeled particles are within ${radius} km of ${city?.name}. Compare the full timeline below the map.` : 'Inspect the source URLs, capture timestamps, hashes, model assumptions, and the delivery pipeline.'}</p>{tour === 3 && <button onClick={() => openDialog('evidence')}>Inspect this capture<ArrowUpRight size={15} /></button>}</div>}
            <div className="map-legend"><span><i className="legend-source" />Fire detection</span><span><i className="legend-wind" />Wind direction</span><span><i className="legend-plume" />Modeled particles</span>{source && <span><i className="legend-trace" />Selected source path</span>}{effectiveLayers.origins && <span><i className="legend-origin" />Starting positions</span>}</div>
            {loading && <div className="loading">Loading captured environmental data…</div>}
            {error && <div className="error" role="alert"><strong>Data unavailable</strong><p>{error}</p><button onClick={() => void load()}>Try again</button></div>}
          </div>
          <div className="timeline"><div className="timeline-top"><span className="eyebrow"><Clock3 size={13} />{mode === 'REPLAY' ? 'REPLAY TIMELINE' : mode === 'SOURCES' ? 'MODEL START' : 'MODEL HORIZON'}</span><strong>{hour === 0 ? 'START' : `+${hour} HOURS`}<span>/ 24H</span></strong></div><div className="timeline-track"><button className="play" disabled={!data || loading || mode === 'SOURCES'} onClick={() => { if (hour === 24) setHour(0); setPlaying(!playing); }} aria-label={playing ? 'Pause animation' : 'Play animation'}>{playing ? <Pause size={17} /> : <Play size={17} />}</button><div className="slider"><input aria-label="Forecast hour" type="range" min="0" max="24" value={hour} disabled={mode === 'SOURCES' || !data || loading} onChange={e => selectHour(Number(e.target.value))} /><div className="ticks">{HOURS.map(h => <button key={h} style={{ left: `${h / 24 * 100}%` }} disabled={mode === 'SOURCES' || !data || loading} className={h === hour ? 'current' : ''} onClick={() => selectHour(h)}>{h === 0 ? 'START' : `+${h}H`}</button>)}</div></div><button className="step" aria-label="Previous hour" disabled={!data || hour === 0 || mode === 'SOURCES'} onClick={() => selectHour(Math.max(0, hour - 1))}><ChevronLeft size={17} /></button><button className="step" aria-label="Next hour" disabled={!data || hour === 24 || mode === 'SOURCES'} onClick={() => selectHour(Math.min(24, hour + 1))}><ChevronRight size={17} /></button></div><p>Run starts {data ? formatDate(data.startTime) : '—'} · equal-weight source pulse · hourly snapshots</p></div>
        </div>
        <aside>
          <div className="panel panel-event"><div className="eyebrow"><Radio size={14} />ACTIVE STUDY AREA<span className="tag">01</span></div><h2>Northern India</h2><p>Including neighboring upwind areas.</p><div className="source-total"><strong>{data?.sources.length ?? '—'}</strong><span>satellite fire<br />detections</span><Flame className="fire-icon" size={30} /></div><div className="event-details"><span>Detection source</span><b>VIIRS / Suomi NPP</b><span>Simulation horizon</span><b>24 hours</b><span>Captured</span><b>{data ? formatDate(data.capturedAt) : '—'}</b></div>{data && data.totalDetections > data.sources.length && <p>{data.sources.length} sampled from {data.totalDetections} detections.</p>}<button className="evidence-link" disabled={!data} onClick={() => openDialog('evidence')}><Fingerprint size={13} />Capture & provenance<ArrowUpRight size={13} /></button></div>
          <div className="panel inspector"><div className="eyebrow">{source ? 'SOURCE INSPECTOR' : 'LOCATION INSPECTOR'}<span className={`tag ${source ? 'observed' : 'modeled'}`}>{source ? 'DETECTED' : 'MODELED'}</span></div><h2>{source ? 'Fire detection' : city?.name || 'Select a location'}<ArrowUpRight size={20} /></h2><div className="coordinates">{selected ? `${selected.lat.toFixed(4)}° N, ${selected.lon.toFixed(4)}° E` : 'Select a point on the map'}</div>
            {source ? <><dl><dt>Acquisition time</dt><dd>{formatDate(source.detectedAt)}</dd><dt>Satellite confidence</dt><dd>{source.confidence}</dd><dt>Radiative power</dt><dd>{source.frp.toFixed(2)} MW</dd></dl>{mode !== 'SOURCES' && <div className="source-journey"><span className="eyebrow"><Route size={12} />MODELED SOURCE PATH</span><strong>{displacement === null ? 'Outside grid' : `${displacement.toFixed(0)} km`}<small>{displacement === null ? 'No surviving particles at this hour' : 'Mean displacement from starting point'}</small></strong><span>{sourceParticles} surviving particles at +{hour}h</span></div>}{mode === 'SOURCES' && <button className="trace-button" onClick={() => traceSource(source)}>Follow this source<Route size={15} /></button>}<p className="inspector-note">Thermal anomalies do not establish fuel type or emissions. Paths show a mean particle position, not an observed smoke track.</p></> : <><div className="influence-status"><i className={`dot ${near ? 'orange' : ''}`} />{near ? 'Particles within study radius' : 'No particles within study radius'}</div><dl><dt>First modeled proximity</dt><dd>{summary && summary.firstHour >= 0 ? summary.firstHour === 0 ? 'Present at start' : `+${summary.firstHour}h` : 'Not in this run'}</dd><dt>At selected time</dt><dd>{near} particles / {radius} km</dd><dt>Peak in this run</dt><dd>{summary?.peak ? `${summary.peak} at +${summary.peakHour}h` : 'No proximity'}</dd></dl><div className="spark" aria-label="Relative particle count by forecast hour">{summary?.counts.map((n, h) => <button key={h} title={`+${h}h: ${n} particles`} aria-label={`Select hour ${h}`} disabled={mode === 'SOURCES'} onClick={() => selectHour(h)} className={h === hour ? 'selected' : ''} style={{ height: `${Math.max(4, n / Math.max(summary.peak, 1) * 36)}px` }} />)}</div><div className="spark-label"><span>START</span><span>+24H</span></div>{mode !== 'SOURCES' && contributions.length > 0 && <div className="contributions"><span className="eyebrow">MODEL SOURCE GROUPS · +{hour}H</span>{contributions.slice(0, 2).map(c => <button key={c.source.id} onClick={() => traceSource(c.source)}><span>{c.source.lat.toFixed(2)}° N · {c.source.lon.toFixed(2)}° E</span><strong>{c.count}</strong><ArrowUpRight size={12} /></button>)}<small>Showing {Math.min(2, contributions.length)} of {contributions.length} groups · model association</small></div>}<div className="observed-row"><span><i className="dot blue" />OBSERVED PM2.5</span><strong>{city && data?.observations.some(o => distanceKm(o.lat, o.lon, city.lat, city.lon) <= radius && Math.abs(new Date(o.time).getTime() - new Date(frame!.time).getTime()) <= 1800000) ? 'View station on map' : 'Not available'}</strong></div><p className="inspector-note">Particle proximity describes potential influence. It does not measure exposure or guarantee an arrival.</p></>}
            {selected && <div className="wind-readout"><Wind size={15} /><div><strong>{windSpeed.toFixed(1)} m/s</strong><span>10 m model wind · {windSpeed < .1 ? 'calm' : `toward ${Math.round(windBearing)}°`}</span></div></div>}
          </div>
          <div className="panel layer-panel"><div className="eyebrow"><Layers size={14} />MAP LAYERS</div>{(['sources', 'wind', 'plume', 'origins', 'observations'] as const).map((key, i) => <button key={key} className="layer-toggle" aria-pressed={effectiveLayers[key]} disabled={mode === 'SOURCES' && (key === 'plume' || key === 'origins')} onClick={() => toggle(key)}><span><i className={`layer-symbol s${i}`} />{['Fire detections', 'Wind field', 'Smoke simulation', 'Starting positions', 'Ground observations'][i]}</span><span className={`switch ${effectiveLayers[key] ? 'on' : ''}`} /></button>)}{layers.observations && !data?.observations.length && <p className="empty-note">No verified station measurements in this capture.</p>}</div>
        </aside>
      </section>
      {data && <section className="city-comparison" aria-label="Compare modeled influence across locations"><div className="comparison-heading"><div><span className="eyebrow"><ScanLine size={13} />LOCATION COMPARISON</span><h2>One wind field. Different pathways.</h2></div><p>Particles within {radius} km · common scale across locations<br /><span>Each row covers the full 24-hour model run.</span></p></div><div className="city-grid">{summaries.map(s => <button className={`city-card ${city?.id === s.city.id ? 'selected' : ''}`} key={s.city.id} aria-label={`Inspect ${s.city.name} at peak hour ${s.peakHour}`} onClick={() => { setSelected(s.city); setMode('FORECAST'); selectHour(s.peakHour); }}><div className="city-card-heading"><strong>{s.city.name}</strong><ArrowUpRight size={14} /></div><div className="mini-chart" aria-hidden="true">{s.counts.map((n, h) => <i key={h} className={h === hour ? 'current' : ''} style={{ height: `${Math.max(2, n / Math.max(...summaries.map(x => x.peak), 1) * 38)}px` }} />)}</div><div className="city-card-stat"><span><b>{s.peak}</b> peak particles</span><span>{s.peak ? `+${s.peakHour}h` : '—'}</span></div><small>{s.firstHour === 0 ? 'Already nearby at start' : s.firstHour < 0 ? 'No proximity in this run' : `First modeled proximity +${s.firstHour}h`}</small></button>)}</div></section>}
      <section className="bottom-row"><div className="run-note"><span className="number">01—03</span><div><strong>{mode === 'REPLAY' ? 'Revisit a captured model run' : mode === 'SOURCES' ? 'A timestamped starting point' : 'From a detection to a possible pathway'}</strong><p>{mode === 'SOURCES' ? 'Acquisition times belong to individual detections. This capture is not a real-time feed.' : 'Source → transport → potential influence. Inspect the evidence behind every run.'}</p></div></div><div className="replay-controls">{mode === 'REPLAY' ? <label>CAPTURED RUN<select aria-label="Replay event" value={data?.id || ''} disabled={loading} onChange={e => void load(e.target.value)}>{events.map(e => <option value={e.id} key={e.id}>{formatDate(e.startTime)} · captured {formatDate(e.capturedAt)}</option>)}</select></label> : <button onClick={() => changeMode('REPLAY')}>Explore captured replay<ArrowRight size={16} /></button>}<button className="refresh" aria-label="Reload latest captured data" disabled={loading} onClick={() => void load()}><RefreshCw size={16} /></button></div></section>
      <footer><span>BREATHEAHEAD<i>/</i>ENVIRONMENTAL HACKS 2026</span><div><a href={data?.provenance.fires.url || 'https://firms.modaps.eosdis.nasa.gov/active_fire/'} target="_blank" rel="noreferrer">NASA FIRMS<ExternalLink size={10} /></a><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo<ExternalLink size={10} /></a><button onClick={() => openDialog('method')}>Methodology & limitations</button></div></footer>
    </main>
    {dialog && <EvidenceDialog kind={dialog} data={data} aws={backend === 'aws'} onClose={() => setDialog(null)} />}
  </div>;
}
