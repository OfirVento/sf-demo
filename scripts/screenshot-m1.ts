/**
 * M1 preview screenshots: render the implementation route in light + dark
 * mode, with the agent panel expanded, and with the evidence drawer open.
 *
 * Outputs PNGs to preview/m1/. Requires a running dev/preview server on
 * PREVIEW_BASE (default http://localhost:5180).
 */

import { chromium, type Browser, type Page } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:5180';
const OUT_DIR = path.resolve('preview/m1');
const VIEWPORT = { width: 1440, height: 900 };
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function newPage(browser: Browser, theme: 'light' | 'dark'): Promise<Page> {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  // Function body runs in the page context — DOM globals exist there, not here.
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
    // 01 — light, default state
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/implementation`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Implementation report")');
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, '01-light.png'), fullPage: true });
    }

    // 02 — dark, default state
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/implementation`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Implementation report")');
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, '02-dark.png'), fullPage: true });
    }

    // 03 — light, agent panel expanded
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/implementation`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Implementation report")');
      await page.click('button[aria-label="Expand agent panel"]');
      await page.waitForSelector('text=Ask the assessment');
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(OUT_DIR, '03-agent-panel.png'), fullPage: false });
    }

    // 04 — light, evidence drawer open (Summary tab)
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/implementation`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Implementation report")');
      await page.click('button:has-text("View supporting evidence")');
      await page.waitForSelector('h2:has-text("Evidence")');
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, '04-evidence-drawer.png'), fullPage: false });

      // 05 — same drawer, Detailed tab
      await page.click('button:has-text("detailed")');
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(OUT_DIR, '05-evidence-detailed.png'), fullPage: false });
    }

    // 06 — light, technical detail expanded on a finding
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/implementation`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Implementation report")');
      await page.click('button:has-text("Show technical detail")');
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(OUT_DIR, '06-technical-detail.png'), fullPage: false });
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
