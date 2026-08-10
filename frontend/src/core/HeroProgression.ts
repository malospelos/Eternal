export type HeroStat='attack'|'defense'|'leadership';
export interface HeroState { level:number; xp:number; skillPoints:number; attack:number; defense:number; leadership:number; skills:string[] }
export class HeroProgression {
 private s:HeroState={level:12,xp:760,skillPoints:3,attack:42,defense:35,leadership:38,skills:[]};
 snapshot(){return {...this.s,skills:[...this.s.skills]}}
 xpForNext(){return this.s.level*100}
 gainXp(amount:number){if(amount<=0)return;this.s.xp+=amount;while(this.s.xp>=this.xpForNext()){this.s.xp-=this.xpForNext();this.s.level++;this.s.skillPoints+=2;this.s.attack+=2;this.s.defense+=2;this.s.leadership+=2}}
 train(stat:HeroStat){if(this.s.skillPoints<1)throw new Error('No hay puntos de héroe disponibles');this.s[stat]+=3;this.s.skillPoints--}
 unlock(skill:string,cost=1){if(this.s.skills.includes(skill))return;if(this.s.skillPoints<cost)throw new Error('Puntos insuficientes');this.s.skillPoints-=cost;this.s.skills.push(skill)}
 power(){return this.s.attack*22+this.s.defense*18+this.s.leadership*25+this.s.level*120}
}