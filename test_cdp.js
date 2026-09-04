const res = await fetch("http://localhost:9222/json");
const pages = await res.json();
const page = pages.find(p => p.type === "page" && p.url.includes("localhost:8085"));
if (!page) {
  console.log("No page found!");
  Deno.exit(1);
}
console.log("Found page ws:", page.webSocketDebuggerUrl);

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 1;
function send(method, params = {}) {
  const curId = id++;
  return new Promise((resolve) => {
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === curId) {
        ws.removeEventListener("message", handler);
        resolve(data.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

await send("Runtime.enable");
const title = await send("Runtime.evaluate", { expression: "document.title" });
console.log("Document title:", title.result?.value);

const buttons = await send("Runtime.evaluate", {
  expression: "Array.from(document.querySelectorAll('button')).map(b => (b.id || b.className || b.innerText.trim()).slice(0, 30))"
});
console.log("Buttons in page:", buttons.result?.value?.length);

ws.close();
