import type{TileRef}from'./WorldMap';import{Pathfinder}from'./Pathfinder';import type{UnitCode}from'./Army';
export type MarchMission='ATTACK'|'REINFORCE'|'SCOUT'|'GATHER';
export interface March{id:string;mission:MarchMission;from:TileRef;to:TileRef;path:TileRef[];units:Partial<Record<UnitCode,number>>;startedAt:number;arrivesAt:number;}
export class MarchManager{
 private marches=new Map<string,March>();
 constructor(private paths:Pathfinder){}
 dispatch(mission:MarchMission,from:TileRef,to:TileRef,units:Partial<Record<UnitCode,number>>,speedTilesPerHour:number,now=Date.now()){const path=this.paths.find(from,to);if(!path)throw new Error('No existe ruta al destino');const id=crypto.randomUUID(),travelMs=(path.cost/Math.max(.1,speedTilesPerHour))*3600000;const march={id,mission,from,to,path:path.tiles,units:{...units},startedAt:now,arrivesAt:now+travelMs};this.marches.set(id,march);return march;}
 arrivals(now=Date.now()){const done:March[]=[];for(const [id,m]of this.marches)if(m.arrivesAt<=now){done.push(m);this.marches.delete(id);}return done;}
 active(){return[...this.marches.values()].map(m=>({...m,path:[...m.path],units:{...m.units}}));}
}