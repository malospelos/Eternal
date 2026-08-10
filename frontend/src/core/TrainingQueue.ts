import { Economy } from './Economy';
import { ArmyRoster,UNITS,type UnitCode } from './Army';
export interface TrainingOrder{id:string;unit:UnitCode;amount:number;startedAt:number;finishAt:number;}
export class TrainingQueue{
 private active:TrainingOrder|null=null;
 constructor(private economy:Economy,private army:ArmyRoster){}
 start(unit:UnitCode,amount:number,now=Date.now()){if(this.active)throw new Error('El cuartel está ocupado');if(!Number.isInteger(amount)||amount<=0)throw new Error('Cantidad inválida');const def=UNITS[unit],cost={WOOD:def.cost.WOOD*amount,FOOD:def.cost.FOOD*amount,STONE:def.cost.STONE*amount,GOLD:def.cost.GOLD*amount};if(!this.economy.spend(cost))throw new Error('Recursos insuficientes');this.active={id:crypto.randomUUID(),unit,amount,startedAt:now,finishAt:now+def.trainingSeconds*amount*1000};return {...this.active};}
 tick(now=Date.now()){if(!this.active||now<this.active.finishAt)return null;const done=this.active;this.army.add(done.unit,done.amount);this.active=null;return done;}
 current(){return this.active?{...this.active}:null;}
}