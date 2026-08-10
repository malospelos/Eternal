export type Formation='PHALANX'|'WEDGE'|'LINE';
export type Terrain='PLAINS'|'FOREST'|'HILLS';
export interface CombatReport{winner:'ELYNDOR'|'ENEMY';rounds:number;morale:number;losses:number;wounded:number;reward:number;formation:Formation;terrain:Terrain;}
const FORMATION_BONUS:Record<Formation,number>={PHALANX:1.08,WEDGE:1.14,LINE:1.02};
const TERRAIN_BONUS:Record<Terrain,number>={PLAINS:1,FOREST:.93,HILLS:1.07};
export class DeepCombat {
 private formation:Formation='LINE';private terrain:Terrain='PLAINS';private morale=82;private reports:CombatReport[]=[];
 setFormation(v:Formation){this.formation=v} setTerrain(v:Terrain){this.terrain=v}
 fight(power:number,enemy:number):CombatReport{const effective=power*FORMATION_BONUS[this.formation]*TERRAIN_BONUS[this.terrain]*(this.morale/100);const ratio=effective/enemy;const winner=ratio>=1?'ELYNDOR':'ENEMY';const losses=Math.max(12,Math.round((winner==='ELYNDOR'?.16:.34)*1000/Math.max(.65,ratio)));const wounded=Math.round(losses*.42);this.morale=Math.max(30,Math.min(100,this.morale+(winner==='ELYNDOR'?6:-12)));const report={winner,rounds:Math.max(3,Math.min(9,Math.round(8/Math.max(.7,ratio)))),morale:this.morale,losses,wounded,reward:winner==='ELYNDOR'?1200:0,formation:this.formation,terrain:this.terrain};this.reports.push(report);return report}
 history(){return [...this.reports]} completed(){return this.reports.filter(r=>r.winner==='ELYNDOR').length>=3&&new Set(this.reports.map(r=>r.formation)).size>=3}
}