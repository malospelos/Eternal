import type { ResourceBag } from './Economy';

export interface ConstructionOrder { id:string; buildingCode:string; fromLevel:number; toLevel:number; startedAt:number; finishAt:number; cost:Partial<ResourceBag>; }

export class ConstructionQueue {
  private active:ConstructionOrder|null=null;
  private completed:ConstructionOrder[]=[];
  current(){return this.active?{...this.active}:null;}
  isBusy(){return this.active!==null;}
  start(order:ConstructionOrder){if(this.active)throw new Error('El constructor ya está ocupado');if(order.toLevel!==order.fromLevel+1)throw new Error('Salto de nivel inválido');if(order.finishAt<=order.startedAt)throw new Error('Tiempo de construcción inválido');this.active={...order,cost:{...order.cost}};}
  tick(now:number):ConstructionOrder|null{if(!this.active||now<this.active.finishAt)return null;const done=this.active;this.completed.push(done);this.active=null;return {...done};}
  remainingMs(now:number){return this.active?Math.max(0,this.active.finishAt-now):0;}
  history(){return this.completed.map(x=>({...x,cost:{...x.cost}}));}
}