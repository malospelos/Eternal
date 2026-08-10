export type ResourceCode='WOOD'|'FOOD'|'STONE'|'GOLD'|'GEMS';
export type ResourceBag=Record<ResourceCode,number>;
export type ProductionRates=Partial<Record<ResourceCode,number>>;

const CODES:ResourceCode[]=['WOOD','FOOD','STONE','GOLD','GEMS'];

export class Economy {
  private readonly values:ResourceBag;
  constructor(initial:Partial<ResourceBag>={}){this.values={WOOD:0,FOOD:0,STONE:0,GOLD:0,GEMS:0,...initial};this.validate(this.values);}
  amount(code:ResourceCode){return this.values[code];}
  canAfford(cost:Partial<ResourceBag>){return CODES.every(c=>(cost[c]??0)<=this.values[c]);}
  spend(cost:Partial<ResourceBag>){if(!this.canAfford(cost))return false;for(const c of CODES)this.values[c]-=cost[c]??0;return true;}
  grant(reward:Partial<ResourceBag>){for(const c of CODES)this.values[c]+=reward[c]??0;this.validate(this.values);}
  produce(ratesPerHour:ProductionRates,elapsedMs:number,capacity?:Partial<ResourceBag>){if(elapsedMs<=0)return;const hours=elapsedMs/3600000;for(const c of CODES){const produced=(ratesPerHour[c]??0)*hours;this.values[c]=Math.min(this.values[c]+produced,capacity?.[c]??Number.MAX_SAFE_INTEGER);}}
  snapshot():ResourceBag{return {...this.values};}
  private validate(values:ResourceBag){for(const c of CODES)if(!Number.isFinite(values[c])||values[c]<0)throw new Error(`Cantidad inválida para ${c}`);}
}