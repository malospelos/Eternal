import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4173/Eternal/';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});
const nav=async view=>{await page.locator(`nav button[data-view="${view}"]`).click();};
try{
 await page.goto(base,{waitUntil:'networkidle'});
 await page.evaluate(()=>{localStorage.removeItem('eternal.campaign.v04');localStorage.removeItem('eternal.progression.v03')});await page.reload({waitUntil:'networkidle'});
 await page.getByText('ELYNDOR 0.4').waitFor();
 await nav('map');await page.locator('#scout').click();
 await nav('army');await page.locator('#train').click();
 await nav('map');await page.locator('#attack').click();
 await nav('research');await page.locator('#research').click();
 await page.locator('#campaign-toggle').click();await page.getByText('FASE I COMPLETADA').waitFor();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('eternal.campaign.v04')||'[]'));
 assert.deepEqual(new Set(stored),new Set(['scout','army','shadow','wisdom']));
 await page.screenshot({path:'e2e/phase-elyndor-complete.png',fullPage:true});
 console.log('OK Fase I completa: navegación, exploración, entrenamiento, batalla, investigación y persistencia.');
}finally{await browser.close();}