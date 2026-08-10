import { chromium } from 'playwright';
import fs from 'node:fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const base = process.env.BASE_URL || 'http://127.0.0.1:4173/Eternal/';
const dir = 'e2e-artifacts/human';
fs.mkdirSync(dir, { recursive: true });
const shot = async name => page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
const phaseNames = ['El Despertar','Expansión del Reino','Mapa y Conquista','Legado de la Corona','El Arte de la Guerra','Crónicas de la Corona','Diplomacia'];
const steps = [4,4,3,4,3,3,3];

try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  await page.getByText('CAMPAÑA GUIADA 1.2').waitFor();
  await page.getByText('OBJETIVO ACTUAL').waitFor();
  await page.locator('[data-phase="2"]').evaluate(el => { if (!(el instanceof HTMLButtonElement) || !el.disabled) throw new Error('La Fase II debe empezar bloqueada'); });
  await shot('00-inicio-limpio');

  for (let phase = 1; phase <= 7; phase++) {
    await page.getByRole('heading', { name: phaseNames[phase - 1] }).waitFor();
    for (let i = 0; i < steps[phase - 1]; i++) {
      const action = page.locator('#action');
      await action.waitFor({ state: 'visible' });
      const before = await page.locator('.mission-head strong').innerText();
      await action.click();
      if (i < steps[phase - 1] - 1) {
        const after = await page.locator('.mission-head strong').innerText();
        if (before === after) throw new Error(`Fase ${phase}: el objetivo no avanzó tras una acción visible`);
      }
    }
    await page.getByText(`FASE ${phase} COMPLETADA`).waitFor();
    await shot(`0${phase}-fase-${phase}-completa`);
    if (phase < 7) {
      const next = page.locator(`[data-phase="${phase + 1}"]`);
      if (await next.isDisabled()) throw new Error(`La Fase ${phase + 1} sigue bloqueada después de completar la ${phase}`);
      await next.click();
    }
  }

  await page.getByText('La campaña de Elyndor ha sido completada.').waitFor();
  const progress = await page.locator('.progress b').innerText();
  if (progress !== '100%') throw new Error(`Progreso final incorrecto: ${progress}`);

  const snapshot = await page.evaluate(() => localStorage.getItem('eternal-guided-v1'));
  if (!snapshot) throw new Error('No se persistió la campaña');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('FASE 7 COMPLETADA').waitFor();
  if ((await page.locator('.progress b').innerText()) !== '100%') throw new Error('La campaña no sobrevivió a la recarga');
  await shot('08-recarga-persistida');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('ETERNAL CROWN').waitFor();
  await shot('09-movil');

  console.log('HUMAN JOURNEY OK: campaña I-VII guiada, visible, persistente y completada sin overlays ni controles ocultos.');
} finally {
  await browser.close();
}
