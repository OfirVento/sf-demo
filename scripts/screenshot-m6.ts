/**
 * M6 preview screenshots: AI Migration Drafts layer.
 * Layer 4 forces dark mode by default — most shots taken in dark.
 */

import { chromium, type Browser, type Page } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:5180';
const OUT_DIR = path.resolve('preview/m6');
const VIEWPORT = { width: 1600, height: 1000 };
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
    // 01 — initial load (skeleton CTA on the right pane), dark
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/migration`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("AI Migration Drafts")');
      await page.waitForTimeout(1500); // shiki highlight
      await page.screenshot({
        path: path.join(OUT_DIR, '01-initial-skeleton.png'),
        fullPage: false,
      });
    }

    // 02 — generated draft revealed (click Generate, wait 1.6s)
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/migration`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("AI Migration Drafts")');
      await page.waitForTimeout(1500);
      await page.click('button:has-text("Generate RCA Draft")');
      await page.waitForTimeout(1700);
      await page.screenshot({
        path: path.join(OUT_DIR, '02-draft-revealed.png'),
        fullPage: false,
      });
    }

    // 03 — Reasoning tab on a high-confidence artifact
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/migration`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("AI Migration Drafts")');
      await page.waitForTimeout(1500);
      await page.click('button:has-text("Generate RCA Draft")');
      await page.waitForTimeout(1700);
      await page.click('button:has-text("Reasoning")');
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUT_DIR, '03-reasoning-tab.png'),
        fullPage: false,
      });
    }

    // 04 — Manual review artifact selected. Sort by confidence floats Manual_Review_Required
    // to the top; we then click the first list item under that sort.
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/migration`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("AI Migration Drafts")');
      await page.waitForTimeout(1500);
      await page.locator('button:has-text("confidence")').last().click();
      await page.waitForTimeout(300);
      // Click the first list item — a manual-review artifact under this sort.
      await page.locator('aside ul button').first().click();
      await page.waitForTimeout(500);
      await page.click('button:has-text("Generate RCA Draft")');
      await page.waitForTimeout(1700);
      await page.locator('nav button:has-text("Reasoning")').click();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUT_DIR, '04-manual-review.png'),
        fullPage: false,
      });
    }

    // 05 — Bulk draft modal mid-progress
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/migration`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("AI Migration Drafts")');
      await page.waitForTimeout(1500);
      await page.click('button:has-text("Bulk draft high-confidence")');
      await page.waitForSelector('h2:has-text("Bulk draft eligible artifacts")');
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUT_DIR, '05-bulk-modal-pre.png'),
        fullPage: false,
      });
      // Click draft and capture mid-progress
      await page.click('button:has-text("Draft ")', { force: true });
      await page.waitForTimeout(2400); // partway through — 4 of ~12 done
      await page.screenshot({
        path: path.join(OUT_DIR, '06-bulk-modal-progress.png'),
        fullPage: false,
      });
    }

    // 07 — Side-by-side diff view
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/migration`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("AI Migration Drafts")');
      await page.waitForTimeout(1500);
      await page.click('button:has-text("Side-by-side diff")');
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(OUT_DIR, '07-diff-view.png'),
        fullPage: false,
      });
    }

    // 08 — Light mode (Layer 4 default is dark; verify the user toggle still works)
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/migration`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("AI Migration Drafts")');
      // Force the document attribute back to light to defeat the layer-default
      // dark override — confirms the theme system can override Layer 4.
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(OUT_DIR, '08-light-mode-override.png'),
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
