export type UnitCode='SWORDSMAN'|'ARCHER'|'KNIGHT'|'MAGE';
export interface UnitDefinition{code:UnitCode;name:string;attack:number;defense:number;health:number;speed:number;carry:number;trainingSeconds:number;cost:{WOOD:number;FOOD:number;STONE:number;GOLD:number};}
export const UNITS:Record<UnitCode,UnitDefinition>={
SWORDSMAN:{code:'SWORDSMAN',name:'Espadachín',attack:32,defense:42,health:100,speed:8,carry:30,trainingSeconds:45,cost:{WOOD:90,FOOD:120,STONE:40,GOLD:10}},
ARCHER:{code:'ARCHER',name:'Arquero',attack:48,defense:25,health:75,speed:9,carry:25,trainingSeconds:55,cost:{WOOD:120,FOOD:90,STONE:30,GOLD:15}},
KNIGHT:{code:'KNIGHT',name:'Caballero',attack:92,defense:72,health:180,speed:16,carry:55,trainingSeconds:140,cost:{WOOD:180,FOOD:240,STONE:110,GOLD:45}},
MAGE:{code:'MAGE',name:'Mago de batalla',attack:120,defense:38,health:85,speed:10,carry:20,trainingSeconds:220,cost:{WOOD:80,FOOD:160,STONE:220,GOLD:75}}
};
export class ArmyRoster{
 private units=new Map<UnitCode,number>();
 count(code:UnitCode){return this.units.get(code)??0;}
 add(code:UnitCode,amount:number){if(!Number.isInteger(amount)||amount<0)throw new Error('Cantidad inválida');this.units.set(code,this.count(code)+amount);}
 remove(code:UnitCode,amount:number){if(amount<0||this.count(code)<amount)return false;this.units.set(code,this.count(code)-amount);return true;}
 total(){let n=0;for(const v of this.units.values())n+=v;return n;}
 power(){let p=0;for(const [code,count] of this.units)p+=(UNITS[code].attack+UNITS[code].defense)*count;return p;}
 snapshot(){return Object.fromEntries([...this.units.entries()]) as Partial<Record<UnitCode,number>>;}
}