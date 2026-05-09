/**
 * M2 preview screenshots: render the executive route in light + dark mode,
 * with the KB drawer open, with a concern card expanded, and with the
 * hero re-roll button visible (hover state).
 *
 * Outputs PNGs to preview/m2/. Requires a running preview server on
 * PREVIEW_BASE (default http://localhost:5180).
 */

import { chromium, type Browser, type Page } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:5180';
const OUT_DIR = path.resolve('preview/m2');
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
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Executive view")');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT_DIR, '01-light.png'), fullPage: true });
    }

    // 02 — dark, full page
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Executive view")');
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT_DIR, '02-dark.png'), fullPage: true });
    }

    // 03 — light, hero verdict block hovered (re-roll button revealed)
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Executive view")');
      // Hover over the narrative paragraph that lives inside the verdict section
      await page.hover('p.text-2xl');
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(OUT_DIR, '03-hero-reroll-hover.png'),
        fullPage: false,
        clip: { x: 0, y: 0, width: 1440, height: 600 },
      });
    }

    // 04 — concern card expanded
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("Top concerns")');
      await page.click('article:has(h3) >> nth=0');
      await page.waitForTimeout(300);
      await page.locator('h2:has-text("Top concerns")').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(OUT_DIR, '04-concern-expanded.png'), fullPage: true });
    }

    // 05 — KB drawer open via Learn More on the first capability tile
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("RCA capabilities unlocked")');
      await page.locator('h2:has-text("RCA capabilities unlocked")').scrollIntoViewIfNeeded();
      await page.click('button:has-text("Learn more") >> nth=0');
      await page.waitForSelector('h2:has-text("Pricing Procedures (BRE)")', { timeout: 5000 }).catch(() => null);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, '05-kb-drawer.png'), fullPage: false });
    }

    // 06 — time-to-value section close-up
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("Time-to-value")');
      const section = page.locator('section:has(h2:has-text("Time-to-value"))');
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, '06-time-to-value.png'), fullPage: false });
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
