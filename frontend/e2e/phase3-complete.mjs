import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const url=process.env.ETERNAL_URL||'http://127.0.0.1:4173/Eternal/';
await page.goto(url,{waitUntil:'networkidle'});await page.click('#conquest-toggle');await page.waitForSelector('.conquest-drawer');
for(const id of ['forest','ruins','watch']){
 await page.click(`[data-province="${id}"]`);await page.click('#phase3-scout');await page.click('#phase3-resolve');
 const status=await page.locator(`[data-province="${id}"] small`).innerText();if(!status.includes('SCOUTED'))throw new Error(`${id}: exploración no resuelta`);
 await page.click(`[data-province="${id}"]`);await page.click('#phase3-attack');await page.click('#phase3-resolve');
 const owned=await page.locator(`[data-province="${id}"] small`).innerText();if(!owned.includes('ELYNDOR'))throw new Error(`${id}: conquista no resuelta`);
}
const final=await page.locator('#phase3-status').innerText();if(final!=='FASE III COMPLETADA')throw new Error(`Estado final incorrecto: ${final}`);
const goals=await page.locator('.phase3-goals').innerText();if((goals.match(/✓/g)||[]).length!==3)throw new Error('No se completaron los tres objetivos');
await page.screenshot({path:'e2e/phase3-complete.png',fullPage:true});console.log('FASE III OK: exploración, niebla, marchas y conquista verificadas visualmente.');await browser.close();