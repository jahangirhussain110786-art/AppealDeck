// Shared sidebar, top bar and step rail for the v6 prototype pages.
// Each page sets <body data-step="0..5"> (0 = the case home). Plain HTML otherwise.
(function () {
  const STEPS = [
    { n: 1, href: "step-1.html", title: "Check what Amazon wants", state: "done" },
    { n: 2, href: "step-2.html", title: "Gather your documents", state: "doing" },
    { n: 3, href: "step-3.html", title: "Write your answers", state: "todo" },
    { n: 4, href: "step-4.html", title: "Check your letter", state: "todo" },
    { n: 5, href: "step-5.html", title: "Send it to Amazon", state: "todo" },
  ];
  window.V6_STEPS = STEPS;
  const step = Number(document.body.dataset.step || 0);
  const icon = (d) =>
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

  const side = `
  <aside class="side" aria-label="App">
    <a class="logo" href="index.html"><svg width="26" height="26" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="7" fill="#fff"/><path d="M8 14.5l4 4 8-9" stroke="#EA580C" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>AppealDeck</a>
    <a class="nav" href="../2026-09-26-prototype-v5/decode.html">${icon('<path d="M12 5v14M5 12h14"/>')}<span class="lg">Decode a new notice</span><span class="sm">New case</span></a>
    <a class="nav" href="../2026-09-26-prototype-v5/dashboard.html">${icon('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>')}Dashboard</a>
    <a class="nav" href="../2026-09-26-prototype-v5/vault.html">${icon('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>')}Vault</a>
    <div class="h">Cases</div>
    <a class="case on" href="case.html"><span style="width:8px;height:8px;border-radius:4px;background:var(--accent-glow)"></span><span>Policy violation</span><span class="num" style="font-size:12px;color:#fdba74">Step 2</span></a>
    <div class="foot-card">
      <div style="display:flex;align-items:center;gap:8px;color:#fff;font-weight:600"><span style="width:7px;height:7px;border-radius:4px;background:var(--accent-glow)"></span>Saved in this browser</div>
      <div style="margin-top:4px"><a href="#" style="color:#fdba74">Sign in</a> to keep it safe</div>
    </div>
  </aside>`;

  const crumb = step
    ? `<a href="case.html" style="color:var(--ink-3);text-decoration:none">Policy violation</a><span>/</span><strong style="color:var(--ink)">Step ${step} of 5</strong>`
    : `<a href="../2026-09-26-prototype-v5/dashboard.html" style="color:var(--ink-3);text-decoration:none">Cases</a><span>/</span><strong style="color:var(--ink)">Policy violation</strong>`;
  const bar = `
    <div class="bar">
      <nav style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--ink-3)" aria-label="Breadcrumb">${crumb}</nav>
      <span style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-3)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>Saved</span>
    </div>`;

  // The step rail: every step is a link, so the seller can jump anywhere at any time.
  const dot = (s) =>
    s.state === "done"
      ? '<span class="chk ok"></span>'
      : `<span class="v6-n${s.n === step ? " on" : ""}">${s.n}</span>`;
  const rail = step
    ? `<nav class="v6-rail" aria-label="Steps">${STEPS.map(
        (s) =>
          `<a href="${s.href}"${s.n === step ? ' aria-current="step"' : ""}>${dot(s)}<span>${s.title}</span></a>`,
      ).join("")}</nav>`
    : "";

  const main = document.getElementById("main");
  const app = document.createElement("div");
  app.className = "app";
  app.innerHTML = side;
  main.parentNode.insertBefore(app, main);
  app.appendChild(main);
  main.insertAdjacentHTML("afterbegin", bar + rail);
})();
