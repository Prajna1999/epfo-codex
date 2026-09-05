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
await page.screenshot({ path: "/tmp/shot-final-chat.png" });

// click textbox alone -- should NOT open broker panel, should NOT show a big suggestions dump
await page.click('#agent-ask-input');
await page.waitForTimeout(300);
console.log("popover visible on plain focus:", await page.isVisible('.connector-popover'));
console.log("big suggestions panel visible on plain focus:", await page.isVisible('.agent-suggestions'));
await page.screenshot({ path: "/tmp/shot-focus-only.png" });

await page.click('.finance-account-toggle');
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/shot-settings-drawer.png" });
await page.click('.finance-source-scrim');
await page.waitForTimeout(200);

await page.click('.connector-toggle');
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/shot-broker-panel.png" });
console.log("CONSOLE_ERRORS:", JSON.stringify(errors));
await browser.close();
