import { Economy, type ResourceBag } from './Economy';
export type BuildingCode='CASTLE'|'FARM'|'LUMBER'|'QUARRY'|'WAREHOUSE'|'HOUSE'|'BARRACKS'|'ACADEMY';
export interface BuildingDef{code:BuildingCode;name:string;baseCost:Partial<ResourceBag>;baseSeconds:number;population:number;}
export const BUILDINGS:Record<BuildingCode,BuildingDef>={CASTLE:{code:'CASTLE',name:'Castillo',baseCost:{WOOD:1800,STONE:1600,GOLD:300},baseSeconds:240,population:20},FARM:{code:'FARM',name:'Granja',baseCost:{WOOD:350,STONE:120},baseSeconds:45,population:5},LUMBER:{code:'LUMBER',name:'Aserradero',baseCost:{WOOD:180,STONE:260},baseSeconds:50,population:5},QUARRY:{code:'QUARRY',name:'Cantera',baseCost:{WOOD:260,FOOD:180},baseSeconds:55,population:5},WAREHOUSE:{code:'WAREHOUSE',name:'Almacén',baseCost:{WOOD:600,STONE:650},baseSeconds:90,population:3},HOUSE:{code:'HOUSE',name:'Viviendas',baseCost:{WOOD:420,STONE:220,FOOD:180},baseSeconds:60,population:0},BARRACKS:{code:'BARRACKS',name:'Cuartel',baseCost:{WOOD:800,STONE:500,FOOD:400},baseSeconds:110,population:12},ACADEMY:{code:'ACADEMY',name:'Academia',baseCost:{WOOD:700,STONE:900,GOLD:250},baseSeconds:150,population:8}};
export interface BuildOrder{code:BuildingCode;toLevel:number;finishAt:number;}
export class Kingdom{
 private levels:Record<BuildingCode,number>={CASTLE:12,FARM:8,LUMBER:7,QUARRY:6,WAREHOUSE:5,HOUSE:7,BARRACKS:9,ACADEMY:6};
 private queue:BuildOrder[]=[];
 constructor(private economy:Economy){}
 level(c:BuildingCode){return this.levels[c];}
 cost(c:BuildingCode){const mult=Math.pow(1.38,this.level(c)-1),out:Partial<ResourceBag>={};for(const [k,v] of Object.entries(BUILDINGS[c].baseCost))out[k as keyof ResourceBag]=Math.ceil((v??0)*mult);return out;}
 production(){return {FOOD:520+this.level('FARM')*95,WOOD:410+this.level('LUMBER')*82,STONE:300+this.level('QUARRY')*70,GOLD:160+this.level('CASTLE')*22} as Partial<ResourceBag>;}
 capacity(){const cap=18000+this.level('WAREHOUSE')*5500;return {WOOD:cap,FOOD:cap,STONE:cap,GOLD:Math.floor(cap*.5),GEMS:9999};}
 population(){const cap=80+this.level('HOUSE')*45+this.level('CASTLE')*12;const used=(Object.keys(this.levels) as BuildingCode[]).reduce((n,c)=>n+BUILDINGS[c].population*this.level(c),0);return {used,cap,free:Math.max(0,cap-used)};}
 upgrade(c:BuildingCode,now=Date.now()){if(this.queue.length>=2)throw new Error('Las dos colas de construcción están ocupadas.');const cost=this.cost(c);if(!this.economy.spend(cost))throw new Error('Recursos insuficientes.');const toLevel=this.level(c)+1;const finishAt=now+BUILDINGS[c].baseSeconds*toLevel*1000;this.queue.push({code:c,toLevel,finishAt});return this.queue[this.queue.length-1];}
 tick(now=Date.now()){const done=this.queue.filter(q=>q.finishAt<=now);this.queue=this.queue.filter(q=>q.finishAt>now);for(const q of done)this.levels[q.code]=Math.max(this.levels[q.code],q.toLevel);return done;}
 rushAll(){return this.tick(Number.MAX_SAFE_INTEGER);}
 active(){return this.queue.map(q=>({...q}));}
 snapshot(){return {levels:{...this.levels},queue:this.active(),population:this.population(),production:this.production(),capacity:this.capacity()};}
}