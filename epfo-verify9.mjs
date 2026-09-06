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

// open account drawer, verify opaque + close
await page.click('.finance-account-toggle');
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/shot-drawer.png" });
await page.click('.finance-source-scrim');
await page.waitForTimeout(200);

// open connector popover
await page.click('.connector-toggle');
await page.waitForTimeout(300);
let popoverVisible = await page.isVisible('.connector-popover');
console.log("popover visible after opening:", popoverVisible);
await page.screenshot({ path: "/tmp/shot-connectors-epfo.png" });

// now click the chatbox input -- popover should close, no contradictory state
await page.click('#agent-ask-input');
await page.waitForTimeout(300);
popoverVisible = await page.isVisible('.connector-popover');
const suggestionsVisible = await page.isVisible('.agent-suggestions');
console.log("popover visible after clicking input:", popoverVisible, "| suggestions visible:", suggestionsVisible);
await page.screenshot({ path: "/tmp/shot-input-after-connector.png" });

// toggle passbook off and confirm chat stays
await page.click('.connector-toggle');
await page.waitForTimeout(300);
await page.click('.connector-epfo-toggle input');
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/shot-epfo-off.png" });
const composerVisible = await page.isVisible('#agent-ask-input');
console.log("composer visible after epfo off:", composerVisible);

console.log("CONSOLE_ERRORS:", JSON.stringify(errors));
await browser.close();
