import { useEffect, useState } from 'react';
import { Wind, ArrowUpRight, ArrowRight, Play, Pause, ChevronLeft, ChevronRight, Layers, Crosshair, Plus, Minus, Info, X, Radio, Flame, Clock3, ExternalLink, RefreshCw } from 'lucide-react';
import { TransportMap } from './map';
import type { Dataset, City, Source, Event } from './types';
import 'leaflet/dist/leaflet.css';
import './style.css';

const API = (import.meta as ImportMeta & {env:Record<string,string>}).env.VITE_API_URL?.replace(/\/$/,'') || '';
const date = (value:string) => new Date(value).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Kolkata'})+' IST';
async function read<T,>(url:string):Promise<T> { const response = await fetch(url); if(!response.ok) throw new Error(`Data request failed (${response.status})`); return response.json(); }
export default function App(){
 const [data,setData]=useState<Dataset|null>(null), [events,setEvents]=useState<Event[]>([]), [error,setError]=useState('');
 const [mode,setMode]=useState('FORECAST'), [hour,setHour]=useState(6), [playing,setPlaying]=useState(false), [selected,setSelected]=useState<City|Source|null>(null);
 const [layers,setLayers]=useState({sources:true,wind:true,plume:true,observations:false}), [method,setMethod]=useState(false), [loading,setLoading]=useState(false);
 const [aws,setAws]=useState(false), [mapAction,setMapAction]=useState({type:'reset',nonce:0});
 const load = async (eventId?:string) => {
  setLoading(true);setError('');setPlaying(false);
  try {
   const path=eventId?`/data/${encodeURIComponent(eventId)}.json`:'/data/latest.json';
   const url=API?`${API}/${eventId?`replay/${encodeURIComponent(eventId)}`:'forecast'}`:path;
   const result=await read<Dataset>(url);
   if(result.schemaVersion!==1 || !result.frames?.length || !result.sources?.length) throw new Error('This dataset is incomplete. Capture a new run.');
   setData(result);setSelected(result.locations[0]);setHour(eventId?0:6);
   if(API){try{ const health=await read<{backend:string}>(`${API}/health`);setAws(health.backend==='aws'); }catch{setAws(false);}}
  }catch(e){setError(e instanceof Error?e.message:'Unable to load data');}finally{setLoading(false);}
 };
 useEffect(()=>{void load();read<Event[]>(API?`${API}/events`:'/data/events.json').then(setEvents).catch(()=>setEvents([]));},[]);
 useEffect(()=>{if(!playing)return; const t=window.setInterval(()=>setHour(h=>{if(h>=24){setPlaying(false);return 24;}return h+1;}),650);return()=>clearInterval(t);},[playing]);
 useEffect(()=>{
  if(!method)return;
  const handle=(event:KeyboardEvent)=>{
   if(event.key==='Escape')setMethod(false);
   if(event.key==='Tab'){
    const items=document.querySelectorAll<HTMLElement>('.modal button, .modal a[href], .modal input, .modal select');
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
   }
  };
  document.addEventListener('keydown',handle);
  return()=>{document.removeEventListener('keydown',handle);document.querySelector<HTMLButtonElement>('.method-button')?.focus();};
 },[method]);
 const city=selected && 'name' in selected?selected:null;
 const source=selected && 'detectedAt' in selected?selected:null;
 const frame=data?.frames[hour];
 const hits=city && data?data.frames.filter(f=>f.influence[city.id]?.particles>0):[];
 const near=city?frame?.influence[city.id]?.particles||0:0;
 const changeMode=(next:string)=>{setMode(next);setPlaying(false);setHour(next==='LIVE'?0:next==='REPLAY'?0:6);};
 const action=(type:string)=>setMapAction(a=>({type,nonce:a.nonce+1}));
 const toggle=(key:keyof typeof layers)=>setLayers(v=>({...v,[key]:!v[key]}));
 const utcHour=data?new Date(data.startTime).getUTCHours():0;
 return <div className="app">
  <header className="topbar"><a className="brand" href="/" aria-label="BreatheAhead home"><span className="brand-icon"><Wind size={25}/></span><span>BreatheAhead<small>SOURCE <b>→</b> TRANSPORT <b>→</b> EXPOSURE</small></span></a>
   <nav aria-label="Map mode">{['LIVE','FORECAST','REPLAY'].map(m=><button key={m} className={mode===m?'active':''} onClick={()=>changeMode(m)}>{m==='LIVE'&&<span className="nav-dot"/>}{m}</button>)}</nav>
   <div className="status"><span><i className="dot"/> {API?(data?'CAPTURED DATA · API':'CONNECTING'):'CAPTURED DATA'}</span><small>{aws?'AWS backend verified':'LOCAL REPLAY · AWS NOT DEPLOYED'}</small></div>
  </header>
  <main>
   <section className="intro"><div><div className="eyebrow"><span className="line"/> NORTHERN INDIA / AIR INTELLIGENCE</div><h1>See pollution <em>move.</em></h1><p>Follow the sources. Read the wind. Explore what could be downwind.</p></div><button className="method-button" onClick={()=>setMethod(true)}><Info size={16}/> How the model works <ArrowUpRight size={15}/></button></section>
   <section className="workspace">
    <div className="map-column"><div className="map-heading"><div><span className="indicator"/> {mode==='REPLAY'?'EVENT RECONSTRUCTION':mode==='LIVE'?'LATEST SOURCE CAPTURE':'TRANSPORT EXPLORER'} <span className="divider">/</span><span className="muted"> Punjab · Haryana · NCR</span></div><span className="mono">{frame?date(frame.time):'LOADING DATA'}</span></div>
     <div className="map-wrap">
      {data&&frame&&<TransportMap data={data} hour={hour} layers={layers} selected={selected} onSelect={setSelected} action={mapAction}/>}
      <div className="map-badge"><span className="dot orange"/>{mode==='LIVE'?'CAPTURED DETECTIONS · NOT LIVE':mode==='REPLAY'?'CAPTURED EVENT REPLAY':'SIMULATED SMOKE INFLUENCE'}<small>{mode==='LIVE'?'Connect a fresh ingestion run for current conditions':'Relative particles · not a PM2.5 forecast'}</small></div>
      <div className="map-controls"><button aria-label="Zoom in" onClick={()=>action('in')}><Plus size={18}/></button><button aria-label="Zoom out" onClick={()=>action('out')}><Minus size={18}/></button><button aria-label="Reset map view" onClick={()=>action('reset')}><Crosshair size={18}/></button></div>
      <div className="region-note"><span>INDIA</span><small>28°–33° N / 73°–80° E</small></div>
      <div className="map-legend"><span><i className="legend-source"/> Fire detection</span><span><i className="legend-wind"/> Wind transport</span><span><i className="legend-plume"/> Simulated plume</span></div>
      {loading&&<div className="loading">Loading captured environmental data…</div>}
      {error&&<div className="error" role="alert"><strong>Data unavailable</strong><p>{error}</p><button onClick={()=>void load()}>Try again</button></div>}
     </div>
     <div className="timeline"><div className="timeline-top"><span className="eyebrow"><Clock3 size={13}/>{mode==='REPLAY'?'REPLAY TIMELINE':'FORECAST HORIZON'}</span><strong>{hour===0?'START':`+${hour} HOURS`} <span>/ 24H</span></strong></div><div className="timeline-track"><button className="play" disabled={!data||mode==='LIVE'} onClick={()=>{if(hour===24)setHour(0);setPlaying(!playing);}} aria-label={playing?'Pause animation':'Play animation'}>{playing?<Pause size={17}/>:<Play size={17}/>}</button><div className="slider"><input aria-label="Forecast hour" type="range" min="0" max="24" value={hour} disabled={mode==='LIVE'||!data} onChange={e=>{setHour(Number(e.target.value));setPlaying(false);}}/><div className="ticks">{[0,3,6,9,12,18,24].map(h=><button key={h} style={{left:`${h/24*100}%`}} disabled={mode==='LIVE'} className={h===hour?'current':''} onClick={()=>{setHour(h);setPlaying(false);}}>{h===0?'START':`+${h}H`}</button>)}</div></div><button className="step" aria-label="Previous hour" disabled={hour===0||mode==='LIVE'} onClick={()=>{setPlaying(false);setHour(Math.max(0,hour-1));}}><ChevronLeft size={17}/></button><button className="step" aria-label="Next hour" disabled={hour===24||mode==='LIVE'} onClick={()=>{setPlaying(false);setHour(Math.min(24,hour+1));}}><ChevronRight size={17}/></button></div><p>Run starts {data?date(data.startTime):'—'} · equal-weight source pulse · 10 m winds</p></div>
    </div>
    <aside>
     <div className="panel panel-event"><div className="eyebrow"><Radio size={14}/> ACTIVE STUDY AREA <span className="tag">01</span></div><h2>Northern India</h2><p>Including neighboring upwind areas.</p><div className="source-total"><strong>{data?.sources.length??'—'}</strong><span>satellite fire<br/>detections</span><Flame className="fire-icon" size={30}/></div><div className="event-details"><span>Detection source</span><b>VIIRS / Suomi NPP</b><span>Simulation horizon</span><b>24 hours</b><span>Captured</span><b>{data?date(data.capturedAt):'—'}</b></div>{data&&data.totalDetections>data.sources.length&&<p>{data.sources.length} sampled from {data.totalDetections} detections.</p>}</div>
     <div className="panel inspector"><div className="eyebrow">{source?'SOURCE INSPECTOR':'LOCATION INSPECTOR'}<span className={`tag ${source?"observed":"modeled"}`}>{source?"DETECTED":"MODELED"}</span></div><h2>{source?'Fire detection':city?.name||'Select a location'}<ArrowUpRight size={20}/></h2>{source?<><div className="coordinates">{source.lat.toFixed(4)}° N, {source.lon.toFixed(4)}° E</div><dl><dt>Detected</dt><dd>{date(source.detectedAt)}</dd><dt>Satellite confidence</dt><dd>{source.confidence}</dd><dt>Fire radiative power</dt><dd>{source.frp.toFixed(2)} MW</dd></dl><p className="inspector-note">Thermal anomaly detection does not establish agricultural burning or emissions.</p></>:<><div className="coordinates">{city?.lat.toFixed(4)}° N, {city?.lon.toFixed(4)}° E</div><div className="influence-status"><i className={`dot ${near?'orange':''}`}/>{near?'Particles within study radius':'No particles within study radius'}</div><dl><dt>First modeled proximity</dt><dd>{hits.length?(hits[0].hour===0?'Present at start':`+${hits[0].hour}h`):'Not in this run'}</dd><dt>At selected time</dt><dd>{near} particles / 25 km</dd></dl><div className="spark" aria-label="Relative particle count by forecast hour">{data?.frames.map(f=><button key={f.hour} title={`+${f.hour}h: ${city?f.influence[city.id].particles:0} particles`} aria-label={`Select hour ${f.hour}`} disabled={mode==='LIVE'} onClick={()=>setHour(f.hour)} className={f.hour===hour?'selected':''} style={{height:`${Math.max(5,city?((f.influence[city.id].particles/(Math.max(...data.frames.map(x=>x.influence[city.id].particles),1)))*36):5)}px`}}/>)}</div><div className="spark-label"><span>START</span><span>+24H</span></div><div className="observed-row"><span><i className="dot blue"/> OBSERVED PM2.5</span><strong>{city&&data?.observations.filter(o=>Math.abs(o.lat-city.lat)<.2&&Math.abs(o.lon-city.lon)<.2&&Math.abs(new Date(o.time).getTime()-new Date(frame!.time).getTime())<=1800000).length?'View station on map':'Not available'}</strong></div><p className="inspector-note">Particle proximity indicates modeled transport, not measured exposure or an arrival guarantee.</p></>}</div>
     <div className="panel layer-panel"><div className="eyebrow"><Layers size={14}/> MAP LAYERS</div>{(['sources','wind','plume','observations'] as const).map((key,i)=><button key={key} className="layer-toggle" aria-pressed={layers[key]} onClick={()=>toggle(key)}><span><i className={`layer-symbol s${i}`}/>{['Fire detections','Wind field','Smoke simulation','Ground observations'][i]}</span><span className={`switch ${layers[key]?'on':''}`}/></button>)}{layers.observations&&!data?.observations.length&&<p className="empty-note">No verified station measurements in this capture. No observations are plotted.</p>}</div>
    </aside>
   </section>
   <section className="bottom-row"><div className="run-note"><span className="number">01—03</span><div><strong>{mode==='REPLAY'?'Revisit a captured event':mode==='LIVE'?'A transparent view of the latest capture':'From a detection to a possible pathway'}</strong><p>{mode==='LIVE'?'This dataset is a saved capture. Its timestamp is shown; it is not a real-time feed.':'Orange is modeled transport. Blue is meteorology and verified observations, when available.'}</p></div></div><div className="replay-controls">{mode==='REPLAY'?<label>CAPTURED EVENT<select aria-label="Replay event" value={data?.id||''} onChange={e=>void load(e.target.value)}>{events.map(e=><option value={e.id} key={e.id}>{date(e.startTime)}</option>)}</select></label>:<button onClick={()=>changeMode('REPLAY')}>Explore captured replay <ArrowRight size={16}/></button>}<button className="refresh" title="Reload latest captured data" aria-label="Reload latest captured data" disabled={loading} onClick={()=>void load()}><RefreshCw size={16}/></button></div></section>
   <footer><span>BREATHEAHEAD <i>/</i> ENVIRONMENTAL HACKS 2026</span><div><a href={data?.provenance.fires.url||'https://firms.modaps.eosdis.nasa.gov/active_fire/'} target="_blank" rel="noreferrer">NASA FIRMS <ExternalLink size={10}/></a><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo <ExternalLink size={10}/></a><button onClick={()=>setMethod(true)}>Methodology & limitations</button></div></footer>
  </main>
  {method&&<div className="modal-backdrop" onClick={()=>setMethod(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="method-title" onClick={e=>e.stopPropagation()}><button autoFocus className="close" aria-label="Close methodology" onClick={()=>setMethod(false)}><X size={20}/></button><div className="eyebrow">UNDER THE SURFACE</div><h2 id="method-title">A pathway, with perspective.</h2><p>BreatheAhead uses detected thermal anomalies and meteorological wind fields to estimate potential smoke transport. This is a simplified transport model, not a full atmospheric chemistry forecast.</p><div className="method-flow"><span>Detected source</span><ArrowRight size={15}/><span>Wind + dispersion</span><ArrowRight size={15}/><span>Potential influence</span></div><h3>What is calculated</h3><p>Eight equal-weight particles per detection move through a nine-point wind grid in 15-minute steps. Wind vectors are interpolated in space and time. Seeded random dispersion uses K = 350 m²/s; weights decay with a 12-hour e-folding time. Particles leaving the grid stop contributing. City proximity uses a 25 km radius.</p><h3>What this does not establish</h3><p>Surface winds do not describe elevated smoke transport. The run assumes a simultaneous pulse at {utcHour}:00 UTC from all selected detections. No plume rise, terrain flow, emissions inventory, chemistry, or calibrated removal is modeled. Thermal anomalies do not identify fuel type. Particle count is not PM2.5, AQI, health risk, or proof of causation.</p><h3>Data & validation</h3><p>Fire points: NASA FIRMS. Winds: Open-Meteo numerical weather model, not ground observations. Captured data stays labeled as captured. {data?.observations.length?'Imported station values retain their measurement timestamps and source URLs.':'Ground observations are not connected; historical accuracy has not been evaluated.'} Replay reproduces a captured model run, not a validated pollution event.</p><p className="method-meta">Model v{data?.model.version||'0.1.0'} · fixed random seed 42 · Natural Earth public-domain outlines. Boundaries are approximate and for orientation.</p></section></div>}
 </div>;
}

