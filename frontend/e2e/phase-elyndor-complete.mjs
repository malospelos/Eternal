import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4173/Eternal/';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});
try{
 await page.goto(base,{waitUntil:'networkidle'});
 await page.evaluate(()=>{localStorage.removeItem('eternal.campaign.v04');localStorage.removeItem('eternal.progression.v03')});await page.reload({waitUntil:'networkidle'});
 await page.getByText('ELYNDOR 0.4').waitFor();
 await page.getByRole('button',{name:/MAPA/}).click();await page.locator('#scout').click();
 await page.getByRole('button',{name:/EJÉRCITO/}).click();await page.locator('#train').click();
 await page.getByRole('button',{name:/MAPA/}).click();await page.locator('#attack').click();
 await page.getByRole('button',{name:/INVESTIGACIÓN/}).click();await page.locator('#research').click();
 await page.locator('#campaign-toggle').click();await page.getByText('FASE I COMPLETADA').waitFor();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('eternal.campaign.v04')||'[]'));
 assert.deepEqual(new Set(stored),new Set(['scout','army','shadow','wisdom']));
 await page.screenshot({path:'e2e/phase-elyndor-complete.png',fullPage:true});
 console.log('OK Fase I completa: navegación, exploración, entrenamiento, batalla, investigación y persistencia.');
}finally{await browser.close();}