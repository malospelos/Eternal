export interface Quest { id:string; title:string; description:string; target:number; reward:string; }
export interface QuestProgress extends Quest { value:number; claimed:boolean; }

const QUESTS:Quest[]=[
 {id:'train',title:'Forja un ejército',description:'Entrena 10 nuevas unidades.',target:10,reward:'1.000 comida'},
 {id:'castle',title:'Fortalece Elyndor',description:'Mejora el castillo una vez.',target:1,reward:'500 piedra'},
 {id:'battle',title:'Golpea a la oscuridad',description:'Ataca la Fortaleza Sombría.',target:1,reward:'25 gemas'},
 {id:'research',title:'Sabiduría del reino',description:'Avanza 24% en investigación.',target:24,reward:'750 oro'}
];

export class Progression {
 private values=new Map<string,number>(); private claimed=new Set<string>();
 add(id:string,amount=1){this.values.set(id,Math.max(0,(this.values.get(id)??0)+amount));}
 claim(id:string){const q=QUESTS.find(x=>x.id===id);if(!q||this.claimed.has(id)||(this.values.get(id)??0)<q.target)return false;this.claimed.add(id);return true;}
 quests():QuestProgress[]{return QUESTS.map(q=>({...q,value:Math.min(q.target,this.values.get(q.id)??0),claimed:this.claimed.has(q.id)}));}
 export(){return {values:Object.fromEntries(this.values),claimed:[...this.claimed]};}
 import(data:any){if(!data)return;for(const [k,v] of Object.entries(data.values??{}))if(typeof v==='number')this.values.set(k,v);for(const id of data.claimed??[])if(typeof id==='string')this.claimed.add(id);}
}