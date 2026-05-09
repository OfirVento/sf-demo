/**
 * M4 preview screenshots: Sales layer with talking points, four chart
 * cards, full LOE section, and risk-as-prompt cards.
 */

import { chromium, type Browser, type Page } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:5180';
const OUT_DIR = path.resolve('preview/m4');
const VIEWPORT = { width: 1440, height: 900 };
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function newPage(browser: Browser, theme: 'light' | 'dark'): Promise<Page> {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await context.addInitScript({
    content: `localStorage.setItem('vento-theme', JSON.stringify({ state: { theme: ${JSON.stringify(theme)} }, version: 0 }));
document.documentElement.setAttribute('data-theme', ${JSON.stringify(theme)});`,
  });
  return context.newPage();
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    // 01 — light, full page
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/sales`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Sales view")');
      await page.waitForTimeout(800); // give recharts time to render
      await page.screenshot({ path: path.join(OUT_DIR, '01-light-full.png'), fullPage: true });
    }

    // 02 — dark, full page
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/sales`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Sales view")');
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT_DIR, '02-dark-full.png'), fullPage: true });
    }

    // 03 — top half (talking points + charts visible)
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/sales`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Sales view")');
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(OUT_DIR, '03-talking-points-charts.png'),
        fullPage: false,
      });
    }

    // 04 — chart card hover with copy buttons visible
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/sales`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h3:has-text("Complexity by dimension")');
      await page.waitForTimeout(800);
      const card = page.locator('article:has(h3:has-text("Complexity by dimension"))');
      await card.hover();
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(OUT_DIR, '04-chartcard-hover.png'),
        fullPage: false,
        clip: { x: 600, y: 200, width: 800, height: 400 },
      });
    }

    // 05 — LOE section close-up (limiting factors expanded)
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/sales`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("LOE / Scoping")');
      await page.waitForTimeout(800);
      await page.locator('h2:has-text("LOE / Scoping")').scrollIntoViewIfNeeded();
      await page.click('button:has-text("limiting factor")');
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(OUT_DIR, '05-loe-section.png'),
        fullPage: false,
      });
    }

    // 06 — Risk prompts close-up
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/sales`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("Risks as conversation prompts")');
      await page.waitForTimeout(800);
      await page
        .locator('h2:has-text("Risks as conversation prompts")')
        .scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(OUT_DIR, '06-risk-prompts.png'),
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
