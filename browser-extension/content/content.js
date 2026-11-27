// Content Script for Floating Assistant on any webpage (<75 lines)
(function () {
  if (window.__HEY_FRIDAY_INJECTED__) return;
  window.__HEY_FRIDAY_INJECTED__ = true;

  const pill = document.createElement("div");
  pill.id = "hey-friday-web-pill";
  pill.innerHTML = `
    <div class="friday-pill-body">
      <span class="friday-orb"></span>
      <span class="friday-label">FRIDAY</span>
      <button class="friday-mic-btn" title="Toggle Voice / Studio">🎙️</button>
    </div>
  `;
  document.body.appendChild(pill);

  const micBtn = pill.querySelector(".friday-mic-btn");
  micBtn.addEventListener("click", () => {
    const labUrl = "https://dr-week.github.io/hey-FRIDAY-/";
    window.open(labUrl, "HeyFridayStudio", "width=480,height=720,menubar=no,toolbar=no");
  });
})();
