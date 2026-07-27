/**
 * Device-accurate screenshots via the Chrome DevTools Protocol.
 *
 * Chrome's --window-size flag does not reliably set the CSS viewport in
 * headless mode, so media queries evaluate at desktop widths and mobile
 * screenshots lie. Emulation.setDeviceMetricsOverride sets the real thing.
 *
 * Usage: node scripts/shot.mjs <url> <out.png> [width] [height] [mobile]
 */
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const [url, out, w = "390", h = "844", mobile = "true"] = process.argv.slice(2);
const PORT = 9222 + Math.floor(Number(process.pid) % 500);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  "--user-data-dir=/tmp/cdp-profile-" + PORT,
  "about:blank",
]);

async function cdpTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error("Chrome did not expose a debugging target");
}

const ws = new WebSocket(await cdpTarget());
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
};

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: 2,
  mobile: mobile === "true",
});

await send("Page.navigate", { url });
await sleep(4000);

// Report any horizontal overflow — the thing screenshots make easy to miss.
const { result } = await send("Runtime.evaluate", {
  expression: `JSON.stringify({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    burger: !!document.querySelector('[aria-label="Toggle menu"]')?.offsetParent
  })`,
  returnByValue: true,
});
console.log(`  ${w}x${h} →`, result.value);

const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
});
await writeFile(out, Buffer.from(shot.data, "base64"));
console.log(`  wrote ${out}`);

ws.close();
chrome.kill();
process.exit(0);
