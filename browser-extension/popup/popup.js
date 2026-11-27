// Popup logic (<55 lines)
document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("backend-status");
  const outputEl = document.getElementById("output-box");
  const inputEl = document.getElementById("query-input");
  const sendBtn = document.getElementById("send-btn");
  const studioBtn = document.getElementById("open-studio");
  const apkBtn = document.getElementById("open-apk");

  // Check local backend
  chrome.runtime.sendMessage({ type: "CHECK_BACKEND" }, (res) => {
    if (res && res.online) {
      statusEl.textContent = "Local Port 4141";
      statusEl.className = "badge online";
    } else {
      statusEl.textContent = "Web Standalone";
      statusEl.className = "badge offline";
    }
  });

  const sendQuery = () => {
    const q = inputEl.value.trim();
    if (!q) return;
    outputEl.textContent = "Thinking...";
    chrome.runtime.sendMessage({ type: "DISPATCH_QUERY", query: q }, (res) => {
      if (res && res.success && res.res) {
        outputEl.textContent = res.res.response || "Command executed.";
      } else {
        // Fallback to web search or redirect
        outputEl.textContent = `Offline: "${q}". Open Studio for full AI engine.`;
      }
    });
    inputEl.value = "";
  };

  sendBtn.addEventListener("click", sendQuery);
  inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") sendQuery(); });

  studioBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://dr-week.github.io/hey-FRIDAY-/" });
  });

  apkBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://dr-week.github.io/hey-FRIDAY-/downloads/hey-friday-latest.apk" });
  });
});
