/**
 * M3 preview screenshots: agent panel (live wiring), evidence drawer
 * polished, truth-label audit visible on Layer 1 + Layer 5.
 *
 * Note: the agent panel uses the live Anthropic API at runtime. This script
 * does not exercise the API call (no key in CI); it captures the empty
 * conversation state (prebuilt chips visible) and the post-input UI.
 */

import { chromium, type Browser, type Page } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:5180';
const OUT_DIR = path.resolve('preview/m3');
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
    // 01 — Executive layer with agent panel expanded showing prebuilt chips
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Executive view")');
      await page.click('button[aria-label="Expand agent panel"]');
      await page.waitForSelector('text=Ask the assessment');
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUT_DIR, '01-agent-prebuilts.png'),
        fullPage: false,
      });
    }

    // 02 — Implementation layer with truth-label audit (ai_generated badges per finding)
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/implementation`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Implementation report")');
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT_DIR, '02-impl-truth-audit.png'), fullPage: true });
    }

    // 03 — Executive concerns with truth labels
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h2:has-text("Top concerns")');
      await page
        .locator('h2:has-text("Top concerns")')
        .scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUT_DIR, '03-exec-concerns-truth.png'),
        fullPage: false,
      });
    }

    // 04 — Evidence drawer (post-polish, width matches agent panel)
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/implementation`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Implementation report")');
      await page.click('button:has-text("View supporting evidence")');
      await page.waitForSelector('h2:has-text("Evidence")');
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUT_DIR, '04-evidence-drawer.png'),
        fullPage: false,
      });
    }

    // 05 — Hero verdict with re-roll button visible (hover)
    {
      const page = await newPage(browser, 'light');
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Executive view")');
      await page.hover('p.text-2xl');
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(OUT_DIR, '05-reroll-hover.png'),
        fullPage: false,
        clip: { x: 0, y: 0, width: 1440, height: 600 },
      });
    }

    // 06 — Dark mode executive with agent expanded
    {
      const page = await newPage(browser, 'dark');
      await page.goto(`${BASE}/assessment/executive`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Executive view")');
      await page.click('button[aria-label="Expand agent panel"]');
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUT_DIR, '06-dark-agent.png'),
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
