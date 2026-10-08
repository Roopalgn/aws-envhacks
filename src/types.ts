export type Source = {id:string;lat:number;lon:number;detectedAt:string;confidence:string;frp:number;satellite:string};
export type City = {id:string;name:string;lat:number;lon:number};
export type Wind = {lat:number;lon:number;hours:{u:number;v:number}[]};
export type Frame = {hour:number;time:string;particles:number[][];influence:Record<string,{particles:number;weight:number}>};
export type Observation = {station:string;lat:number;lon:number;time:string;value:number;unit:string;sourceUrl:string};
export type Dataset = {schemaVersion:number;id:string;title:string;capturedAt:string;startTime:string;kind:string;totalDetections:number;sources:Source[];wind:Wind[];frames:Frame[];locations:City[];observations:Observation[];observationStatus:string;provenance:{fires:{name:string;url:string};wind:{name:string;url:string};observations:{name:string;url:string}|null};model:{name:string;version:string;release:string;limitations:string;influenceRadiusKm:number}};
export type Event = {id:string;title:string;startTime:string;capturedAt:string};
