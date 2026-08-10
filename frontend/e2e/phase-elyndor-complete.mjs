import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4173/Eternal/';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});
const nav=async view=>{const ok=await page.evaluate(v=>{const all=[...document.querySelectorAll('button[data-view]')];const b=all.find(x=>x.getAttribute('data-view')===v);if(!b)return false;b.click();return true},view);assert.equal(ok,true,`No existe navegación ${view}`);await page.waitForTimeout(100)};
const click=async id=>{const ok=await page.evaluate(x=>{const b=document.getElementById(x);if(!b)return false;b.click();return true},id);assert.equal(ok,true,`No existe la acción ${id}`);await page.waitForTimeout(120)};
try{
 await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>{localStorage.removeItem('eternal.campaign.v04');localStorage.removeItem('eternal.progression.v03')});await page.reload({waitUntil:'networkidle'});await page.getByText('ELYNDOR 0.4').waitFor();
 await nav('map');await click('scout');await nav('army');await click('train');await nav('map');await click('attack');await nav('research');await click('research');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('eternal.campaign.v04')||'[]'));assert.deepEqual(new Set(stored),new Set(['scout','army','shadow','wisdom']));await page.evaluate(()=>document.getElementById('campaign-toggle')?.click());await page.getByText('FASE I COMPLETADA').waitFor();await page.screenshot({path:'e2e/phase-elyndor-complete.png',fullPage:true});console.log('OK Fase I completa.');
}finally{await browser.close();}