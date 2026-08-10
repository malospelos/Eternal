import './progression-overlay.css';
import { Progression } from './core';

const STORAGE_KEY='eternal.progression.v03';
const progression=new Progression();
try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)progression.import(JSON.parse(raw));}catch{}

function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(progression.export()));}
function completed(){return progression.quests().filter(q=>q.value>=q.target).length;}
function render(){
  document.querySelector('#progression-panel')?.remove();
  const wrap=document.createElement('section');
  wrap.id='progression-panel';
  wrap.innerHTML=`<button id="quest-toggle" aria-label="Misiones">✦<span>${completed()}/${progression.quests().length}</span></button><div class="quest-drawer"><header><div><small>CRÓNICAS DE ELYNDOR</small><b>Misiones del Reino</b></div><strong>${completed()}/${progression.quests().length}</strong></header><div class="quest-list">${progression.quests().map(q=>{const pct=Math.min(100,Math.round(q.value/q.target*100));return `<article class="quest ${q.claimed?'claimed':q.value>=q.target?'ready':''}"><div class="quest-top"><b>${q.title}</b><span>${q.claimed?'✓':`${q.value}/${q.target}`}</span></div><p>${q.description}</p><div class="quest-progress"><i style="width:${pct}%"></i></div><footer><small>Recompensa · ${q.reward}</small>${q.value>=q.target&&!q.claimed?`<button data-claim="${q.id}">RECLAMAR</button>`:''}</footer></article>`}).join('')}</div><div class="season"><span>TEMPORADA I · EL DESPERTAR</span><b>Nivel de corona ${Math.max(1,completed()+1)}</b><div><i style="width:${Math.min(100,completed()*25+12)}%"></i></div></div></div>`;
  document.body.appendChild(wrap);
  document.querySelector('#quest-toggle')?.addEventListener('click',()=>wrap.classList.toggle('open'));
  wrap.querySelectorAll<HTMLElement>('[data-claim]').forEach(b=>b.onclick=()=>{if(progression.claim(b.dataset.claim!)){save();render();document.querySelector('#progression-panel')?.classList.add('open')}});
}

function advance(id:string,amount:number){progression.add(id,amount);save();render();}

document.addEventListener('click',event=>{
  const el=(event.target as HTMLElement).closest('button');if(!el)return;
  if(el.id==='train')setTimeout(()=>advance('train',5),0);
  else if(el.id==='upgrade-castle')setTimeout(()=>advance('castle',1),0);
  else if(el.id==='attack')setTimeout(()=>advance('battle',1),0);
  else if(el.id==='research')setTimeout(()=>advance('research',12),0);
});

render();
