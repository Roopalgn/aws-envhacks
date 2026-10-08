import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { City, Dataset, Source } from './types';

type Props={data:Dataset;hour:number;layers:{sources:boolean;wind:boolean;plume:boolean;observations:boolean};selected:City|Source|null;onSelect:(value:City|Source)=>void;action:{type:string;nonce:number}};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function TransportMap(props:Props){
 const element=useRef<HTMLDivElement>(null), map=useRef<L.Map|null>(null), latest=useRef(props);
 latest.current=props;
 useEffect(()=>{
  if(!element.current)return;
  const m=L.map(element.current,{zoomControl:false,attributionControl:true,minZoom:5,maxZoom:10}).setView([29.9,76.05],6.8);
  m.attributionControl.setPrefix(false);m.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a> · approximate boundaries');map.current=m;
  let disposed=false;
  fetch('/data/geography.json').then(r=>r.json()).then(geo=>{if(!disposed)L.geoJSON(geo,{style:{color:'#344048',weight:1,fillColor:'#151e23',fillOpacity:1},interactive:false}).addTo(m).bringToBack();}).catch(()=>{});
  for(let lat=24;lat<=36;lat++)L.polyline([[lat,69],[lat,84]],{color:'#52616a',opacity:.12,weight:1,interactive:false}).addTo(m);
  for(let lon=69;lon<=84;lon++)L.polyline([[24,lon],[36,lon]],{color:'#52616a',opacity:.12,weight:1,interactive:false}).addTo(m);
  [['P U N J A B',31.25,75.3],['H A R Y A N A',29.7,76.1],['R A J A S T H A N',27.55,74.9],['UTTAR PRADESH',28.55,78.7],['HIMACHAL PRADESH',31.8,77.6]].forEach(([text,lat,lon])=>L.marker([Number(lat),Number(lon)],{interactive:false,icon:L.divIcon({className:'region-label',html:String(text),iconSize:[150,20]})}).addTo(m));
  const canvas=document.createElement('canvas');canvas.className='transport-canvas';element.current.appendChild(canvas);
  const ctx=canvas.getContext('2d')!;let animation=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw(t:number){
   if(disposed)return;
   const {data,hour,layers}=latest.current, size=m.getSize(), dpr=Math.min(window.devicePixelRatio||1,2);
   if(canvas.width!==size.x*dpr||canvas.height!==size.y*dpr){canvas.width=size.x*dpr;canvas.height=size.y*dpr;canvas.style.width=size.x+'px';canvas.style.height=size.y+'px';}
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size.x,size.y);
   const project=(lat:number,lon:number)=>m.latLngToContainerPoint([lat,lon]);
   const frame=data.frames[hour];
   if(layers.plume&&frame){
    ctx.globalCompositeOperation='screen';
    for(const p of frame.particles){
     const xy=project(p[0],p[1]);if(xy.x< -40||xy.y< -40||xy.x>size.x+40||xy.y>size.y+40)continue;
     const radius=Math.max(6,Math.min(25,m.getZoom()*1.6+hour*.18));
     const gradient=ctx.createRadialGradient(xy.x,xy.y,0,xy.x,xy.y,radius);
     gradient.addColorStop(0,`rgba(243,117,54,${.11*p[3]})`);gradient.addColorStop(.4,`rgba(193,102,55,${.045*p[3]})`);gradient.addColorStop(1,'rgba(193,102,55,0)');
     ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(xy.x,xy.y,radius,0,Math.PI*2);ctx.fill();
     ctx.fillStyle=`rgba(255,167,103,${.25*p[3]})`;ctx.fillRect(xy.x,xy.y,1.3,1.3);
    }
    ctx.globalCompositeOperation='source-over';
   }
   if(layers.wind){
    for(let lat=26.5;lat<=32.5;lat+=.3)for(let lon=73;lon<=79.5;lon+=.36){
     let u=0,v=0,total=0;for(const g of data.wind){const w=1/Math.max(.015,(lat-g.lat)**2+(lon-g.lon)**2);u+=g.hours[hour].u*w;v+=g.hours[hour].v*w;total+=w;}u/=total;v/=total;
     const speed=Math.hypot(u,v);if(speed<.1)continue;
     const phase=reduced?.5:((t/4200+(lat+lon)*.91)%1);
     const origin=project(lat,lon), end=project(lat+v*.023,lon+u*.023/Math.cos(lat*Math.PI/180));
     const dx=end.x-origin.x,dy=end.y-origin.y,x=origin.x+dx*phase,y=origin.y+dy*phase;
     ctx.strokeStyle=`rgba(131,185,204,${.12+Math.sin(phase*Math.PI)*.28})`;ctx.lineWidth=.9;
     ctx.beginPath();ctx.moveTo(x-dx*.28,y-dy*.28);ctx.lineTo(x,y);ctx.stroke();
     const angle=Math.atan2(dy,dx);ctx.beginPath();ctx.moveTo(x-3*Math.cos(angle-.5),y-3*Math.sin(angle-.5));ctx.lineTo(x,y);ctx.lineTo(x-3*Math.cos(angle+.5),y-3*Math.sin(angle+.5));ctx.stroke();
    }
   }
   animation=requestAnimationFrame(draw);
  }
  animation=requestAnimationFrame(draw);
  const resize=new ResizeObserver(()=>m.invalidateSize());resize.observe(element.current);
  return()=>{disposed=true;cancelAnimationFrame(animation);resize.disconnect();canvas.remove();m.remove();map.current=null;};
 },[]);
 useEffect(()=>{
  const m=map.current;if(!m)return;const group=L.layerGroup().addTo(m);
  if(props.layers.sources)props.data.sources.forEach(source=>{
   L.circleMarker([source.lat,source.lon],{radius:3,weight:1,color:'#ffc28b',fillColor:'#f48043',fillOpacity:.85}).on('click',()=>props.onSelect(source)).bindTooltip(`VIIRS detection · ${source.confidence} confidence`).addTo(group);
  });
  props.data.locations.forEach(city=>{
   const active=props.selected?.id===city.id,near=props.layers.plume&&props.data.frames[props.hour].influence[city.id]?.particles>0;
   if(active)L.circle([city.lat,city.lon],{radius:25000,color:near?'#e99866':'#849eae',weight:1,dashArray:'4 5',fillColor:near?'#c88656':'#8bbdd1',fillOpacity:.04,interactive:false}).addTo(group);
   L.marker([city.lat,city.lon],{keyboard:true,title:city.name,icon:L.divIcon({className:`city-marker ${active?'active':''}`,html:`<span class="city-dot"></span><span>${escape(city.name)}</span>`,iconSize:[120,25],iconAnchor:[5,5]})}).on('click',()=>props.onSelect(city)).addTo(group);
  });
  if(props.layers.observations)props.data.observations.filter(o=>Math.abs(new Date(o.time).getTime()-new Date(props.data.frames[props.hour].time).getTime())<=1800000).forEach(o=>L.circleMarker([o.lat,o.lon],{color:'#98d3ef',radius:6,fillOpacity:.8}).bindTooltip(`${escape(o.station)}: ${o.value} ${escape(o.unit)} · ${escape(o.time)}`).addTo(group));
  return()=>{group.remove();};
 },[props.data,props.hour,props.layers.sources,props.layers.plume,props.layers.observations,props.selected]);
 useEffect(()=>{const m=map.current;if(!m)return;if(props.action.type==='in')m.zoomIn();else if(props.action.type==='out')m.zoomOut();else m.fitBounds([[27.5,73.6],[32.3,79]],{padding:[25,25]});},[props.action]);
 return <div ref={element} className="map" role="region" aria-label="Interactive northern India smoke transport map"/>;
}
