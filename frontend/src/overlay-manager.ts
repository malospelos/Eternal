const panels=['#campaign-panel','#phase2-panel','#phase3-panel','#phase4-panel','#phase5','#phase6','#phase7','#journey'];
const toggles=new Map<string,string>([['#campaign-toggle','#campaign-panel'],['#kingdom-toggle','#phase2-panel'],['#conquest-toggle','#phase3-panel'],['#phase4-toggle','#phase4-panel'],['.p5-toggle','#phase5'],['.p6-toggle','#phase6'],['.p7-toggle','#phase7'],['#journey-toggle','#journey']]);

document.addEventListener('click',event=>{
  const target=event.target as HTMLElement;
  for(const [toggle,panel] of toggles){
    if(target.closest(toggle)){
      for(const p of panels) if(p!==panel) document.querySelector(p)?.classList.remove('open');
      return;
    }
  }
},true);
