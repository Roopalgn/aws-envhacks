import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { sourcePath, windAt } from './analysis';
import type { City, Dataset, Source } from './types';

type Props = { data: Dataset; hour: number; playing: boolean; layers: { sources: boolean; wind: boolean; plume: boolean; observations: boolean; origins: boolean }; selected: City | Source | null; onSelect: (value: City | Source) => void; action: { type: string; nonce: number } };
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function TransportMap(props: Props) {
  const element = useRef<HTMLDivElement>(null), map = useRef<L.Map | null>(null);
  const path = useMemo(() => props.selected && 'detectedAt' in props.selected ? sourcePath(props.data, props.selected) : [], [props.data, props.selected]);
  const latest = useRef({ ...props, path });
  latest.current = { ...props, path };

  useEffect(() => {
    if (!element.current) return;
    const m = L.map(element.current, { zoomControl: false, attributionControl: true, minZoom: 5, maxZoom: 10 }).setView([29.9, 76.05], 6.8);
    m.attributionControl.setPrefix(false);
    m.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a> · approximate boundaries');
    map.current = m;
    let disposed = false;
    fetch('/data/geography.json').then(r => r.json()).then(geo => { if (!disposed) L.geoJSON(geo, { style: { color: '#354952', weight: 1, fillColor: '#142027', fillOpacity: 1 }, interactive: false }).addTo(m).bringToBack(); }).catch(() => {});
    for (let lat = 24; lat <= 36; lat++) L.polyline([[lat, 69], [lat, 84]], { color: '#6a8998', opacity: .13, weight: 1, interactive: false }).addTo(m);
    for (let lon = 69; lon <= 84; lon++) L.polyline([[24, lon], [36, lon]], { color: '#6a8998', opacity: .13, weight: 1, interactive: false }).addTo(m);
    [['P U N J A B', 31.25, 75.3], ['H A R Y A N A', 29.7, 76.1], ['R A J A S T H A N', 27.55, 74.9], ['UTTAR PRADESH', 28.55, 78.7], ['HIMACHAL PRADESH', 31.8, 77.6]].forEach(([text, lat, lon]) => L.marker([Number(lat), Number(lon)], { interactive: false, keyboard: false, icon: L.divIcon({ className: 'region-label', html: String(text), iconSize: [150, 20] }) }).addTo(m));
    const canvas = document.createElement('canvas'); canvas.className = 'transport-canvas'; canvas.setAttribute('aria-hidden', 'true'); element.current.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;
    let animation = 0, cachedHour = -1, cachedData: Dataset | null = null, changedAt = 0;
    let oldFrame: Dataset['frames'][number] | null = null;
    let windNodes: { lat: number; lon: number; u: number; v: number }[] = [];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function draw(t: number) {
      if (disposed) return;
      const { data, hour, layers, selected, playing, path: trace } = latest.current;
      if (data !== cachedData || hour !== cachedHour) {
        oldFrame = playing && data === cachedData && hour === cachedHour + 1 ? data.frames[cachedHour] : null;
        changedAt = t; cachedData = data; cachedHour = hour;
        windNodes = [];
        for (let lat = 26.5; lat <= 32.5; lat += .3) for (let lon = 73; lon <= 79.5; lon += .36) windNodes.push({ lat, lon, ...windAt(data.wind, lat, lon, hour) });
      }
      const size = m.getSize(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== size.x * dpr || canvas.height !== size.y * dpr) { canvas.width = size.x * dpr; canvas.height = size.y * dpr; canvas.style.width = size.x + 'px'; canvas.style.height = size.y + 'px'; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size.x, size.y);
      const project = (lat: number, lon: number) => m.latLngToContainerPoint([lat, lon]);
      const selectedIndex = selected && 'detectedAt' in selected ? data.sources.findIndex(s => s.id === selected.id) : -1;
      if (layers.origins) {
        ctx.strokeStyle = '#aec0c66e'; ctx.lineWidth = 1;
        for (const source of data.sources) { const xy = project(source.lat, source.lon); ctx.beginPath(); ctx.arc(xy.x, xy.y, 4, 0, Math.PI * 2); ctx.stroke(); }
      }
      if (layers.plume) {
        ctx.globalCompositeOperation = 'screen';
        const blend = oldFrame && playing && !reduced ? Math.min(1, (t - changedAt) / 450) : 1;
        function particles(frame: Dataset['frames'][number], alpha: number) {
          for (const p of frame.particles) {
            const xy = project(p[0], p[1]); if (xy.x < -40 || xy.y < -40 || xy.x > size.x + 40 || xy.y > size.y + 40) continue;
            const active = p[2] === selectedIndex;
            const strength = alpha * p[3] * (selectedIndex < 0 ? 1 : active ? 2.3 : .22);
            const radius = Math.max(6, Math.min(25, m.getZoom() * 1.6 + hour * .18));
            const gradient = ctx.createRadialGradient(xy.x, xy.y, 0, xy.x, xy.y, radius);
            gradient.addColorStop(0, `rgba(${active ? '211,235,151' : '243,117,54'},${.14 * strength})`);
            gradient.addColorStop(.45, `rgba(${active ? '157,193,101' : '193,102,55'},${.06 * strength})`);
            gradient.addColorStop(1, 'rgba(193,102,55,0)');
            ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(xy.x, xy.y, radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(${active ? '225,249,178' : '255,177,113'},${Math.min(1, .4 * strength)})`; ctx.fillRect(xy.x, xy.y, active ? 2 : 1.3, active ? 2 : 1.3);
          }
        }
        if (oldFrame && blend < 1) particles(oldFrame, 1 - blend);
        particles(data.frames[hour], blend);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (layers.wind) {
        for (const { lat, lon, u, v } of windNodes) {
          if (Math.hypot(u, v) < .1) continue;
          const phase = reduced ? .5 : ((t / 4200 + (lat + lon) * .91) % 1);
          const origin = project(lat, lon), end = project(lat + v * .023, lon + u * .023 / Math.cos(lat * Math.PI / 180));
          const dx = end.x - origin.x, dy = end.y - origin.y, x = origin.x + dx * phase, y = origin.y + dy * phase;
          ctx.strokeStyle = `rgba(131,185,204,${.12 + Math.sin(phase * Math.PI) * .28})`; ctx.lineWidth = .9;
          ctx.beginPath(); ctx.moveTo(x - dx * .28, y - dy * .28); ctx.lineTo(x, y); ctx.stroke();
          const angle = Math.atan2(dy, dx); ctx.beginPath(); ctx.moveTo(x - 3 * Math.cos(angle - .5), y - 3 * Math.sin(angle - .5)); ctx.lineTo(x, y); ctx.lineTo(x - 3 * Math.cos(angle + .5), y - 3 * Math.sin(angle + .5)); ctx.stroke();
        }
      }
      if (layers.plume && trace.length) {
        const points = trace.map(p => ({ ...p, xy: project(p.lat, p.lon) }));
        const line = (items: typeof points, color: string, width: number, dash: number[]) => {
          ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath();
          items.forEach((p, i) => i ? ctx.lineTo(p.xy.x, p.xy.y) : ctx.moveTo(p.xy.x, p.xy.y)); ctx.stroke(); ctx.setLineDash([]);
        };
        line(points, '#d5e7a14d', 1.5, [4, 5]); line(points.filter(p => p.hour <= hour), '#d5e7a1', 2, []);
        for (const p of points.filter(p => p.hour % 6 === 0 && p.hour <= hour)) {
          ctx.fillStyle = '#d5e7a1'; ctx.beginPath(); ctx.arc(p.xy.x, p.xy.y, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.font = '10px monospace'; ctx.fillStyle = '#0b151bea'; ctx.fillRect(p.xy.x + 6, p.xy.y - 16, 36, 16); ctx.fillStyle = '#d5e7a1'; ctx.fillText(`+${p.hour}h`, p.xy.x + 10, p.xy.y - 4);
        }
        const current = points.find(p => p.hour === hour);
        if (current) { ctx.strokeStyle = '#d5e7a1'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(current.xy.x, current.xy.y, 7, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#e4f5bb'; ctx.beginPath(); ctx.arc(current.xy.x, current.xy.y, 3, 0, Math.PI * 2); ctx.fill(); }
      }
      animation = requestAnimationFrame(draw);
    }
    animation = requestAnimationFrame(draw);
    const resize = new ResizeObserver(() => m.invalidateSize()); resize.observe(element.current);
    return () => { disposed = true; cancelAnimationFrame(animation); resize.disconnect(); canvas.remove(); m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current; if (!m) return;
    const group = L.layerGroup().addTo(m);
    if (props.layers.sources) props.data.sources.forEach((source, i) => {
      const marker = L.marker([source.lat, source.lon], { keyboard: false, title: `Fire detection ${i + 1}`, icon: L.divIcon({ className: `source-marker ${props.selected?.id === source.id ? 'active' : ''}`, html: `<button type="button" aria-label="Fire detection ${i + 1}"><span></span></button>`, iconSize: [20, 20], iconAnchor: [10, 10] }) })
        .on('click', () => latest.current.onSelect(source)).bindTooltip(`VIIRS detection · ${escape(source.confidence)} confidence`).addTo(group);
      marker.getElement()?.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); latest.current.onSelect(source); }
      });
    });
    return () => { group.remove(); };
  }, [props.data, props.layers.sources, props.selected]);
  useEffect(() => {
    const m = map.current; if (!m) return;
    const group = L.layerGroup().addTo(m);
    props.data.locations.forEach(city => {
      const active = props.selected?.id === city.id, near = props.layers.plume && props.data.frames[props.hour].influence[city.id]?.particles > 0;
      if (active) L.circle([city.lat, city.lon], { radius: props.data.model.influenceRadiusKm * 1000, color: near ? '#e99866' : '#849eae', weight: 1, dashArray: '4 5', fillColor: near ? '#c88656' : '#8bbdd1', fillOpacity: .04, interactive: false }).addTo(group);
      const marker = L.marker([city.lat, city.lon], { keyboard: false, title: city.name, icon: L.divIcon({ className: `city-marker ${active ? 'active' : ''} ${near ? 'influenced' : ''}`, html: `<button type="button" aria-label="${escape(city.name)}"><span class="city-dot"></span><span>${escape(city.name)}</span></button>`, iconSize: [120, 25], iconAnchor: [5, 5] }) }).on('click', () => latest.current.onSelect(city)).addTo(group);
      marker.getElement()?.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); latest.current.onSelect(city); }
      });
    });
    if (props.layers.observations) props.data.observations.filter(o => Math.abs(new Date(o.time).getTime() - new Date(props.data.frames[props.hour].time).getTime()) <= 1800000).forEach(o => L.circleMarker([o.lat, o.lon], { color: '#98d3ef', radius: 6, fillOpacity: .8 }).bindTooltip(`${escape(o.station)}: ${o.value} ${escape(o.unit)} · ${escape(o.time)}`).addTo(group));
    return () => { group.remove(); };
  }, [props.data, props.hour, props.layers.plume, props.layers.observations, props.selected]);
  useEffect(() => {
    const m = map.current; if (!m) return;
    if (props.action.type === 'in') m.zoomIn();
    else if (props.action.type === 'out') m.zoomOut();
    else if (props.action.type === 'trace' && path.length) m.fitBounds(L.latLngBounds(path.map(p => [p.lat, p.lon] as L.LatLngTuple)), { padding: [70, 70], maxZoom: 8 });
    else {
      const positions: L.LatLngTuple[] = [...props.data.sources, ...props.data.locations].map(p => [p.lat, p.lon]);
      m.fitBounds(L.latLngBounds(positions), { padding: [55, 60], maxZoom: 7 });
    }
  }, [props.action, props.data]);
  return <div ref={element} className="map" role="region" aria-label="Interactive northern India smoke transport map" />;
}
