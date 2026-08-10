import { BattleSimulator } from './BattleSimulator';
import { ConstructionQueue, type ConstructionOrder } from './ConstructionQueue';
import { Economy, type ProductionRates, type ResourceBag } from './Economy';
import { WorldMap } from './WorldMap';

export interface SimulationConfig { width:number; height:number; resources?:Partial<ResourceBag>; production?:ProductionRates; capacity?:Partial<ResourceBag>; }

export class EternalSimulation {
  readonly map:WorldMap;
  readonly economy:Economy;
  readonly construction=new ConstructionQueue();
  readonly battles=new BattleSimulator();
  private lastTick:number;

  constructor(private readonly config:SimulationConfig,now=Date.now()){
    this.map=new WorldMap(config.width,config.height);this.economy=new Economy(config.resources);this.lastTick=now;
  }

  tick(now=Date.now()){
    const elapsed=Math.max(0,now-this.lastTick);this.economy.produce(this.config.production??{},elapsed,this.config.capacity);const completed=this.construction.tick(now);this.lastTick=now;return {elapsed,completed};
  }

  startConstruction(order:ConstructionOrder){if(!this.economy.spend(order.cost))throw new Error('Recursos insuficientes');try{this.construction.start(order);}catch(e){this.economy.grant(order.cost);throw e;}}

  snapshot(){return {now:this.lastTick,resources:this.economy.snapshot(),construction:this.construction.current(),map:{width:this.map.width,height:this.map.height}};}
}