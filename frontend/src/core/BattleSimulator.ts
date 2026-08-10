import { PseudoRandom } from './PseudoRandom';

export interface ArmyStack { unit:string; count:number; attack:number; defense:number; health:number; }
export interface BattleArmy { id:string; stacks:ArmyStack[]; heroAttackBonus?:number; heroDefenseBonus?:number; }
export interface BattleRound { round:number; attackerPower:number; defenderPower:number; attackerLosses:number; defenderLosses:number; }
export interface BattleResult { seed:string; winner:'ATTACKER'|'DEFENDER'|'DRAW'; rounds:BattleRound[]; attackerRemaining:number; defenderRemaining:number; }

export class BattleSimulator {
  simulate(attacker:BattleArmy,defender:BattleArmy,seed:string,maxRounds=12):BattleResult {
    const rng=new PseudoRandom(seed); let a=this.totalUnits(attacker),d=this.totalUnits(defender); const rounds:BattleRound[]=[];
    for(let round=1;round<=maxRounds&&a>0&&d>0;round++){
      const ap=this.power(attacker,a,true)*(0.9+rng.next()*0.2); const dp=this.power(defender,d,false)*(0.9+rng.next()*0.2);
      const dLoss=Math.min(d,Math.max(1,Math.floor(ap/Math.max(1,this.avgHealth(defender))*0.08)));
      const aLoss=Math.min(a,Math.max(1,Math.floor(dp/Math.max(1,this.avgHealth(attacker))*0.07)));
      a-=aLoss;d-=dLoss;rounds.push({round,attackerPower:Math.round(ap),defenderPower:Math.round(dp),attackerLosses:aLoss,defenderLosses:dLoss});
    }
    const winner=a===d?'DRAW':a>d?'ATTACKER':'DEFENDER'; return {seed,winner,rounds,attackerRemaining:a,defenderRemaining:d};
  }
  private totalUnits(a:BattleArmy){return a.stacks.reduce((n,s)=>n+s.count,0);}
  private avgHealth(a:BattleArmy){const n=this.totalUnits(a);return n?a.stacks.reduce((v,s)=>v+s.health*s.count,0)/n:1;}
  private power(a:BattleArmy,remaining:number,attacking:boolean){const total=this.totalUnits(a);if(!total)return 0;const ratio=remaining/total;const stat=a.stacks.reduce((v,s)=>v+(attacking?s.attack:s.defense)*s.count,0)*ratio;const bonus=attacking?(a.heroAttackBonus??0):(a.heroDefenseBonus??0);return stat*(1+bonus);}
}