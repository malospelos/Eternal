export interface ResearchNode { id:string; name:string; branch:'WAR'|'ECONOMY'|'ARCANE'; cost:number; requires?:string; bonus:string }
const NODES:ResearchNode[]=[
{id:'steel',name:'Acero templado',branch:'WAR',cost:120,bonus:'+8% ataque'},
{id:'formation',name:'Formaciones reales',branch:'WAR',cost:180,requires:'steel',bonus:'+10% defensa'},
{id:'logistics',name:'Logística imperial',branch:'ECONOMY',cost:110,bonus:'+12% producción'},
{id:'guilds',name:'Gremios de Elyndor',branch:'ECONOMY',cost:170,requires:'logistics',bonus:'+15% almacén'},
{id:'runes',name:'Runas antiguas',branch:'ARCANE',cost:140,bonus:'+8% poder mágico'},
{id:'crown',name:'Sabiduría de la Corona',branch:'ARCANE',cost:220,requires:'runes',bonus:'+1 punto héroe'}];
export class ResearchTree { private points=420;private done=new Set<string>();list(){return NODES.map(n=>({...n,unlocked:this.done.has(n.id),available:!n.requires||this.done.has(n.requires)}))}availablePoints(){return this.points}research(id:string){const n=NODES.find(x=>x.id===id);if(!n)throw new Error('Investigación desconocida');if(this.done.has(id))return;if(n.requires&&!this.done.has(n.requires))throw new Error('Falta investigación previa');if(this.points<n.cost)throw new Error('Conocimiento insuficiente');this.points-=n.cost;this.done.add(id)}completed(){return this.done.size}isComplete(){return this.done.size===NODES.length}}
