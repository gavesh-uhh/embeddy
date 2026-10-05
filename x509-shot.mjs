import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:6767";
const out = process.argv[3] ?? "shot.png";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: out });
await browser.close();
console.log("saved", out);
