import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = 'https://malospelos.github.io/Eternal/?ci=' + Date.now();
const out = 'e2e-artifacts';
await fs.mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/01-inicio.png`, fullPage: true });

const canvas = page.locator('#game canvas');
if (!(await canvas.isVisible())) throw new Error('El canvas del juego no es visible');
const box = await canvas.boundingBox();
if (!box) throw new Error('No se pudo medir el canvas');

await page.mouse.click(box.x + box.width * 0.68, box.y + box.height * 0.59);
await page.waitForTimeout(250);
await page.mouse.click(box.x + box.width * 0.70, box.y + box.height * 0.84);
await page.waitForTimeout(750);
const state1 = await page.evaluate(() => JSON.parse(localStorage.getItem('eternal-crown-demo-state-v2') || '{}'));
if (!state1.construction || state1.construction.buildingCode !== 'FARM') throw new Error('No se inicio la construccion de la granja');
await page.screenshot({ path: `${out}/02-granja-construyendo.png`, fullPage: true });

await page.waitForTimeout(6000);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const state2 = await page.evaluate(() => JSON.parse(localStorage.getItem('eternal-crown-demo-state-v2') || '{}'));
const farm = state2.buildings?.find((b) => b.code === 'FARM');
if (!farm || farm.level < 1) throw new Error('La granja no termino correctamente');
await page.screenshot({ path: `${out}/03-granja-finalizada.png`, fullPage: true });

console.log('SMOKE_OK', JSON.stringify({ farmLevel: farm.level, food: state2.resources?.FOOD, wood: state2.resources?.WOOD }));
await browser.close();
