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
await page.waitForSelector('#agent-ask-input', { timeout: 15000 });

await page.click('#agent-ask-input');
await page.waitForTimeout(200);
console.log("suggestions visible after focus:", await page.isVisible('.agent-suggestions'));

await page.click('.connector-toggle');
await page.waitForTimeout(300);
console.log("popover visible after connector click (suggestions should be gone):", await page.isVisible('.connector-popover'));
console.log("suggestions still visible?", await page.isVisible('.agent-suggestions'));
await page.screenshot({ path: "/tmp/shot-reopen.png" });

await page.click('.connector-epfo-toggle input');
await page.waitForTimeout(600);
console.log("composer visible after epfo off:", await page.isVisible('#agent-ask-input'));
console.log("popover still open after toggling epfo:", await page.isVisible('.connector-popover'));
await page.screenshot({ path: "/tmp/shot-epfo-off2.png" });

await browser.close();
