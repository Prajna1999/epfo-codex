import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.click('button:has-text("Login")');
await page.waitForSelector('input[maxlength="6"]', { timeout: 10000 });
await page.fill('input[maxlength="6"]', "123456");
await page.click('button:has-text("Verify and sign in")');
await page.waitForSelector('text=Good afternoon', { timeout: 15000 });
await page.click('button:has-text("Finance")');
await page.waitForSelector('#agent-ask-input', { timeout: 15000 });
await page.screenshot({ path: "/tmp/shot-noheader.png" });

await page.click('.finance-account-toggle');
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/shot-drawer.png" });

await page.click('.connector-toggle');
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/shot-connectors-epfo.png" });

console.log("CONSOLE_ERRORS:", JSON.stringify(errors));
await browser.close();
