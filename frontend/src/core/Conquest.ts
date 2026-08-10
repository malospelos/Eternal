export type ProvinceKind='CAPITAL'|'RESOURCE'|'RUINS'|'ENEMY'|'FORTRESS';
export type ProvinceStatus='OWNED'|'SCOUTED'|'HIDDEN'|'HOSTILE';
export interface Province {id:string;name:string;x:number;y:number;kind:ProvinceKind;status:ProvinceStatus;power:number;reward:string;}
export interface Expedition {id:number;provinceId:string;type:'SCOUT'|'ATTACK';eta:number;status:'MARCHING'|'VICTORY'|'SCOUTED';}
const INITIAL:Province[]=[
{id:'capital',name:'Elyndor',x:18,y:55,kind:'CAPITAL',status:'OWNED',power:0,reward:'Capital del reino'},
{id:'forest',name:'Bosque de Aelwyn',x:35,y:35,kind:'RESOURCE',status:'HIDDEN',power:8500,reward:'+12% madera'},
{id:'ruins',name:'Ruinas de Vaelor',x:52,y:68,kind:'RUINS',status:'HIDDEN',power:13200,reward:'Reliquia ancestral'},
{id:'watch',name:'Torre del Cuervo',x:64,y:27,kind:'ENEMY',status:'HIDDEN',power:19400,reward:'+8% visión'},
{id:'mine',name:'Minas de Khar',x:74,y:62,kind:'RESOURCE',status:'HIDDEN',power:24100,reward:'+15% piedra'},
{id:'fortress',name:'Fortaleza de Draven',x:88,y:40,kind:'FORTRESS',status:'HIDDEN',power:35800,reward:'Provincia oriental'}];
export class Conquest {
 private provinces:Province[]=INITIAL.map(p=>({...p}));private expeditions:Expedition[]=[];private seq=1;private explored=1;private conquered=1;
 list(){return this.provinces.map(p=>({...p}));} active(){return this.expeditions.map(e=>({...e}));}
 province(id:string){const p=this.provinces.find(x=>x.id===id);if(!p)throw new Error('Provincia inexistente');return p;}
 scout(id:string){const p=this.province(id);if(p.status==='OWNED'||p.status==='SCOUTED')return;this.expeditions.push({id:this.seq++,provinceId:id,type:'SCOUT',eta:Date.now()+1000,status:'MARCHING'});}
 attack(id:string,armyPower:number){const p=this.province(id);if(p.status==='HIDDEN')throw new Error('Debes explorar la provincia antes de atacar.');if(p.status==='OWNED')throw new Error('La provincia ya pertenece a Elyndor.');if(armyPower<p.power)throw new Error('Poder militar insuficiente.');this.expeditions.push({id:this.seq++,provinceId:id,type:'ATTACK',eta:Date.now()+1500,status:'MARCHING'});}
 resolve(){for(const e of this.expeditions.filter(x=>x.status==='MARCHING')){const p=this.province(e.provinceId);if(e.type==='SCOUT'){p.status='SCOUTED';e.status='SCOUTED';this.explored++;}else{p.status='OWNED';e.status='VICTORY';this.conquered++;}}}
 fog(){return this.provinces.filter(p=>p.status==='HIDDEN').length;} stats(){return{explored:this.explored,conquered:this.conquered,total:this.provinces.length,fog:this.fog()};}
 completed(){return this.province('forest').status==='OWNED'&&this.province('ruins').status==='OWNED'&&this.province('watch').status==='OWNED';}
}