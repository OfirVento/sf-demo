/**
 * M7 preview screenshots: guided workflow overlay, dark-mode pass per layer,
 * Compass trigger in the TopBar.
 */

import { chromium, type Browser, type Page } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:5180';
const OUT_DIR = path.resolve('preview/m7');
const VIEWPORT = { width: 1440, height: 900 };
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function newPage(
  browser: Browser,
  theme: 'light' | 'dark',
  guidedSeen: boolean = true,
): Promise<Page> {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const init = `
    localStorage.setItem('vento-theme', JSON.stringify({ state: { theme: ${JSON.stringify(theme)} }, version: 0 }));
    document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)});
    localStorage.setItem('vento-guided-workflow', JSON.stringify({ state: { seen: ${guidedSeen} }, version: 0 }));
  `;
  await context.addInitScript({ content: init });
  return context.newPage();
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    // 01 — Guided workflow first-time auto-launch (step 1: Connect)
    {
      const page = await newPage(browser, 'light', false);
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("Connect a Salesforce CPQ org")', {
        timeout: 5000,
      });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, '01-guided-step1-connect.png'), fullPage: false });
    }

    // 02 — Guided step 2 (assessment progress)
    {
      const page = await newPage(browser, 'light', false);
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("Connect a Salesforce CPQ org")');
      await page.click('button:has-text("Connect (stubbed)")');
      // Catch the assess step partway through its 3.5s progress.
      await page.waitForSelector('h2:has-text("Run the assessment")');
      await page.waitForTimeout(1400);
      await page.screenshot({ path: path.join(OUT_DIR, '02-guided-step2-assess.png'), fullPage: false });
    }

    // 03 — Guided step 3 (pick view) — wait through the full assess timer
    {
      const page = await newPage(browser, 'light', false);
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("Connect a Salesforce CPQ org")');
      await page.click('button:has-text("Connect (stubbed)")');
      await page.waitForSelector('h2:has-text("Pick your view")', { timeout: 8000 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, '03-guided-step3-pick.png'), fullPage: false });
    }

    // 04 — Compass trigger visible in the TopBar (top-right cluster). We wait for
    // any auto-launched workflow to settle, then capture the topbar area.
    {
      const page = await newPage(browser, 'light', true);
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Executive view")');
      await page.waitForTimeout(800);
      // If the workflow opened despite seen=true (hydration race), dismiss it
      // before the screenshot.
      const dismissBtn = page.locator('button[aria-label="Dismiss"]');
      if (await dismissBtn.count()) {
        await dismissBtn.first().click().catch(() => null);
        await page.waitForTimeout(200);
      }
      await page.screenshot({
        path: path.join(OUT_DIR, '04-topbar-with-compass.png'),
        fullPage: false,
        clip: { x: 0, y: 0, width: 1440, height: 80 },
      });
    }

    // 05–09 — Dark-mode pass across layers
    const layers = [
      ['executive', 'h1:has-text("Executive view")'],
      ['sales', 'h1:has-text("Sales view")'],
      ['salesforce', 'h1:has-text("Revenue Cloud")'],
      ['migration', 'h1:has-text("AI Migration Drafts")'],
      ['implementation', 'h1:has-text("Implementation report")'],
    ] as const;
    for (let i = 0; i < layers.length; i++) {
      const [slug, sel] = layers[i];
      const page = await newPage(browser, 'dark', true);
      await page.goto(`${BASE}/assessment/${slug}`, { waitUntil: 'networkidle' });
      await page.waitForSelector(sel);
      await page.waitForTimeout(900); // shiki + recharts + any workflow auto-launch race
      // Dismiss the guided workflow if it auto-launched against the seen=true
      // localStorage (hydration race we accept for the demo).
      const dismiss = page.locator('button[aria-label="Dismiss"]');
      if (await dismiss.count()) {
        await dismiss.first().click().catch(() => null);
        await page.waitForTimeout(300);
      }
      await page.screenshot({
        path: path.join(OUT_DIR, `0${5 + i}-dark-${slug}.png`),
        fullPage: false,
      });
    }

    console.log(`Wrote screenshots to ${OUT_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
