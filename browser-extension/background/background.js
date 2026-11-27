// Background Service Worker for Hey FRIDAY Extension (<45 lines)
chrome.runtime.onInstalled.addListener(() => {
  console.log("⚡ [Hey FRIDAY] Browser Extension Installed.");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CHECK_BACKEND") {
    fetch("http://127.0.0.1:4141/api/health")
      .then((r) => r.json())
      .then((data) => sendResponse({ online: true, data }))
      .catch(() => sendResponse({ online: false }));
    return true;
  }

  if (msg.type === "DISPATCH_QUERY") {
    fetch("http://127.0.0.1:4141/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: msg.query }),
    })
      .then((r) => r.json())
      .then((res) => sendResponse({ success: true, res }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }
});
