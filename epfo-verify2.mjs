import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.click('button:has-text("Login")');
await page.waitForSelector('input[maxlength="6"]', { timeout: 10000 });
await page.fill('input[maxlength="6"]', "123456");
await page.click('button:has-text("Verify and sign in")');
await page.waitForSelector('text=Good afternoon', { timeout: 15000 });
await page.click('button:has-text("Finance")');
await page.waitForSelector('text=Message your finance agent', { timeout: 15000 });

const composer = await page.$('form:has(#agent-ask-input)');
await composer.scrollIntoViewIfNeeded();
await composer.screenshot({ path: "/tmp/shot-composer2.png" });

await page.click('.connector-toggle');
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/shot-connectors-open2.png" });

const info = await page.evaluate(() => {
  const pop = document.querySelector(".connector-popover");
  const toggle = document.querySelector(".connector-toggle");
  return { popRect: pop.getBoundingClientRect().toJSON(), toggleRect: toggle.getBoundingClientRect().toJSON(), viewportH: window.innerHeight, viewportW: window.innerWidth };
});
console.log(JSON.stringify(info, null, 2));

const zerodhaRow = await page.$('button:has-text("Zerodha")');
await zerodhaRow.click();
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/shot-zerodha-expanded2.png" });

await browser.close();
