/**
 * M5 preview screenshots: Salesforce Partner layer + briefing route.
 */

import { chromium, type Browser, type Page } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:5180';
const OUT_DIR = path.resolve('preview/m5');
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
      await page.goto(`${BASE}/assessment/salesforce`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Revenue Cloud")');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT_DIR, '01-light-full.png'), fullPage: true });
    }

    // 02 — dark, full page
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/salesforce`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Revenue Cloud")');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT_DIR, '02-dark-full.png'), fullPage: true });
    }

    // 03 — readiness header + expansion grid close-up
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/salesforce`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("Expansion signals")');
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(OUT_DIR, '03-readiness-expansion.png'),
        fullPage: false,
      });
    }

    // 04 — risk heatmap close-up
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/salesforce`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("Migration risk profile")');
      await page.waitForTimeout(400);
      await page
        .locator('h2:has-text("Migration risk profile")')
        .scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(OUT_DIR, '04-risk-heatmap.png'), fullPage: false });
    }

    // 05 — co-sell + export CTA
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/salesforce`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("Co-sell narrative")');
      await page
        .locator('h2:has-text("Co-sell narrative")')
        .scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, '05-cosell-export.png'), fullPage: false });
    }

    // 06 — briefing route, light
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/salesforce/briefing`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Salesforce briefing")');
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, '06-briefing.png'), fullPage: true });
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
