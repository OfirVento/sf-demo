/**
 * Quick verification script for the M7 fix:
 *  - Test A: Global theme=light + navigate to /assessment/migration → final
 *    data-theme should be 'dark' (Layer 4 default override holds).
 *  - Test B: Page-level truth label on /assessment/executive should match
 *    meta.truthLabel from the loaded payload (real_org_data → green badge).
 *
 * Captures one screenshot for each test as evidence.
 */

import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:5180';
const OUT_DIR = path.resolve('preview/m7-fix');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    // Test A — light global theme, navigate to /migration, expect final dark.
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx.addInitScript({
        content: `
          localStorage.setItem('vento-theme', JSON.stringify({ state: { theme: 'light' }, version: 0 }));
          localStorage.setItem('vento-guided-workflow', JSON.stringify({ state: { seen: true }, version: 0 }));
        `,
      });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/assessment/migration`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("AI Migration Drafts")');
      await page.waitForTimeout(1500);
      const dismiss = page.locator('button[aria-label="Dismiss"]');
      if (await dismiss.count()) await dismiss.first().click().catch(() => null);
      await page.waitForTimeout(300);
      const finalTheme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );
      console.log(`Test A (light global → /migration): final data-theme=${finalTheme}`);
      if (finalTheme !== 'dark') {
        throw new Error(`Test A FAILED — expected dark, got ${finalTheme}`);
      }
      await page.screenshot({
        path: path.join(OUT_DIR, '01-migration-forced-dark-while-global-light.png'),
        fullPage: false,
      });
    }

    // Test B — truth label on Executive page header reflects meta.truthLabel.
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx.addInitScript({
        content: `
          localStorage.setItem('vento-theme', JSON.stringify({ state: { theme: 'light' }, version: 0 }));
          localStorage.setItem('vento-guided-workflow', JSON.stringify({ state: { seen: true }, version: 0 }));
        `,
      });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Executive view")');
      await page.waitForTimeout(900);
      const dismiss = page.locator('button[aria-label="Dismiss"]');
      if (await dismiss.count()) await dismiss.first().click().catch(() => null);
      await page.waitForTimeout(300);
      // Page-level chip should read "Real org data" since meta.truthLabel = real_org_data.
      const realOrgChip = page.locator('h1:has-text("Executive view")').locator('..').locator('..').locator('text="Real org data"');
      const count = await realOrgChip.count();
      console.log(`Test B (page header truth label): "Real org data" chip count=${count}`);
      if (count === 0) {
        throw new Error('Test B FAILED — no "Real org data" chip in the executive page header');
      }
      await page.screenshot({
        path: path.join(OUT_DIR, '02-executive-page-header-real-org.png'),
        fullPage: false,
        clip: { x: 0, y: 0, width: 1440, height: 200 },
      });
    }

    console.log('All M7-fix tests passed.');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
