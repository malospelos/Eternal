export type CampaignStatus='LOCKED'|'AVAILABLE'|'COMPLETED';
export interface CampaignNode {id:string;title:string;kind:'SCOUT'|'BATTLE'|'BUILD'|'RESEARCH';description:string;reward:string;requires?:string;}
export interface CampaignNodeState extends CampaignNode {status:CampaignStatus;}
const NODES:CampaignNode[]=[
{id:'scout',title:'Ojos en la frontera',kind:'SCOUT',description:'Explora la Fortaleza Sombría.',reward:'300 madera'},
{id:'army',title:'Preparativos de guerra',kind:'BUILD',description:'Entrena nuevas tropas para la campaña.',reward:'500 comida',requires:'scout'},
{id:'shadow',title:'La Fortaleza Sombría',kind:'BATTLE',description:'Lanza un ataque contra la fortaleza.',reward:'25 gemas',requires:'army'},
{id:'wisdom',title:'Después de la batalla',kind:'RESEARCH',description:'Avanza la investigación militar.',reward:'750 oro',requires:'shadow'}];
export class Campaign {
 private done=new Set<string>();
 nodes():CampaignNodeState[]{return NODES.map(n=>({...n,status:this.done.has(n.id)?'COMPLETED':!n.requires||this.done.has(n.requires)?'AVAILABLE':'LOCKED'}));}
 complete(id:string){const node=this.nodes().find(n=>n.id===id);if(!node||node.status!=='AVAILABLE')return false;this.done.add(id);return true;}
 isComplete(){return this.done.size===NODES.length;}
 progress(){return Math.round(this.done.size/NODES.length*100);}
 export(){return [...this.done];}
 import(data:unknown){if(Array.isArray(data))for(const id of data)if(typeof id==='string'&&NODES.some(n=>n.id===id))this.done.add(id);}
}