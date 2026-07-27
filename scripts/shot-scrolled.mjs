/**
 * Screenshot after scrolling through the whole page, so IntersectionObserver
 * driven reveal animations have actually fired. A plain full-page capture
 * leaves below-the-fold content at opacity 0 and looks like a rendering bug.
 *
 * Usage: node scripts/shot-scrolled.mjs <url> <out.png> [width] [height]
 */
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const [url, out, w = "1440", h = "900"] = process.argv.slice(2);
const PORT = 9700 + Math.floor(Number(process.pid) % 250);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--user-data-dir=/tmp/cdp-scroll-" + PORT,
  "about:blank",
]);

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("no CDP target");
}

const ws = new WebSocket(await target());
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: 1,
  mobile: Number(w) < 700,
});
await send("Page.navigate", { url });
await sleep(3500);

// Walk the page so every reveal enters the viewport at least once.
await send("Runtime.evaluate", {
  expression: `(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 220));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 600));
  })()`,
  awaitPromise: true,
});

const hidden = await send("Runtime.evaluate", {
  expression: `document.querySelectorAll('.reveal:not([data-in="true"])').length`,
  returnByValue: true,
});
console.log(`  reveals still hidden after scroll: ${hidden.result.value}`);

const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
});
await writeFile(out, Buffer.from(shot.data, "base64"));
console.log(`  wrote ${out}`);

ws.close();
chrome.kill();
process.exit(0);
