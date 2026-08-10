import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4173/Eternal/';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});
const action=async id=>{await page.evaluate(x=>{const b=document.createElement('button');b.id=x;document.body.appendChild(b);b.click();b.remove()},id);await page.waitForTimeout(120)};
try{
 await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>{localStorage.removeItem('eternal.campaign.v04');localStorage.removeItem('eternal.progression.v03')});await page.reload({waitUntil:'networkidle'});await page.getByText('ELYNDOR 0.4').waitFor();
 for(const id of ['scout','train','attack','research'])await action(id);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('eternal.campaign.v04')||'[]'));assert.deepEqual(new Set(stored),new Set(['scout','army','shadow','wisdom']));await page.evaluate(()=>document.getElementById('campaign-toggle')?.click());await page.getByText('FASE I COMPLETADA').waitFor();await page.screenshot({path:'e2e/phase-elyndor-complete.png',fullPage:true});console.log('OK Fase I completa: cuatro capítulos, persistencia y final de campaña.');
}finally{await browser.close();}