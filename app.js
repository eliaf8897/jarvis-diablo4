(() => {
  const $ = (id) => document.getElementById(id);
  const state = { items: [], builds: [], query: "", category: "tutti", gameClass: "tutte" };
  const apiBase = (window.JARVIS_CONFIG?.API_BASE_URL || "").replace(/\/$/, "");
  const demoMode = !apiBase || apiBase.includes("INSERISCI-QUI");

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  async function api(path, options = {}) {
    if (demoMode) throw new Error("Configura API_BASE_URL in public/js/config.js dopo aver pubblicato il backend.");
    const response = await fetch(apiBase + path, { ...options, headers: { ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Errore HTTP ${response.status}`);
    return data;
  }
  function setStatus(id, message, bad = false) {
    const el = $(id); if (el) { el.textContent = message; el.classList.toggle("bad", bad); }
  }
  function card(item) {
    const demo = item.demo === true || item.demo === "true" || item.is_demo === true;
    const cls = item.class ? `<span class="tag">${esc(item.class)}</span>` : "";
    return `<button class="card" data-item-id="${esc(item.id)}"><h3>${esc(item.name)}</h3><p>${esc(item.description || item.goal || "Nessuna descrizione disponibile.")}</p><span class="tag">${esc(item.category || "build")}</span>${cls}${demo ? '<span class="tag demo">DEMO</span>' : ""}${item.sourceName || item.source_name ? `<p>Fonte: ${esc(item.sourceName || item.source_name)}</p>` : ""}</button>`;
  }
  function bindCardClicks(root) {
    root.querySelectorAll("[data-item-id]").forEach(btn => btn.addEventListener("click", () => {
      const item = state.items.find(x => String(x.id) === btn.dataset.itemId);
      if (!item) return;
      $("detailContent").innerHTML = `<h2>${esc(item.name)}</h2><p>${esc(item.description || "Nessuna descrizione disponibile.")}</p><div>${item.demo ? '<span class="tag demo">DATI DEMO</span>' : '<span class="tag">Fonte da verificare</span>'}</div><p>Categoria: ${esc(item.category || "—")}</p><p>Versione gioco: ${esc(item.gameVersion || item.game_version || "Non specificata")}</p>${item.sourceUrl || item.source_url ? `<p><a href="${esc(item.sourceUrl || item.source_url)}" target="_blank" rel="noopener">Apri fonte originale</a></p>` : ""}`;
      $("detailDialog").showModal();
    }));
  }
  function renderCatalog() {
    const q = state.query.toLowerCase();
    const filtered = state.items.filter(item => {
      const text = [item.name, item.description, item.category, item.subcategory, item.class].filter(Boolean).join(" ").toLowerCase();
      return (!q || text.includes(q)) && (state.category === "tutti" || item.category === state.category) && (state.gameClass === "tutte" || !item.class || item.class === state.gameClass);
    });
    $("catalogResults").innerHTML = filtered.length ? filtered.map(card).join("") : '<div class="status-card">Nessun risultato nel catalogo disponibile.</div>';
    $("homeResults").innerHTML = state.items.slice(0, 4).map(card).join("") || '<div class="status-card">Nessun dato ancora caricato.</div>';
    $("farmResults").innerHTML = state.items.filter(x => ["boss","farming"].includes(x.category)).map(card).join("") || '<div class="status-card">Nessun dato boss/farming verificato disponibile.</div>';
    bindCardClicks(document);
    $("searchHint").textContent = `${filtered.length} risultati nel catalogo caricato.`;
  }
  function showView(name) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${name}`));
    document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.view === name));
    if (name === "catalog") renderCatalog();
  }
  async function loadData() {
    if (demoMode) {
      $("connection").textContent = "Backend da configurare";
      setStatus("catalogStatus", "Collega il backend in public/js/config.js per caricare dati e fonti.");
      return;
    }
    try {
      const [catalog, builds, sources, health] = await Promise.all([
        api("/api/catalog?limit=100"), api("/api/builds"), api("/api/sources"), api("/api/health")
      ]);
      state.items = catalog.items || [];
      state.builds = builds.builds || [];
      $("connection").textContent = health.ok ? "API collegata" : "API da verificare";
      renderCatalog();
      $("savedBuilds").innerHTML = state.builds.length ? state.builds.map(b => card({ ...b, category:"build", description:b.goal || "Apri per dettagli.", demo:b.demo ?? b.is_demo })).join("") : '<div class="status-card">Nessuna build salvata. Importa una guida pubblica.</div>';
      $("sourceResults").innerHTML = (sources.sources || []).map(s => `<article class="source"><b>${esc(s.name)}</b><p>${esc(s.role)}<br>Stato: ${esc(s.status)}</p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></article>`).join("");
      setStatus("catalogStatus", `Catalogo caricato: ${catalog.count} voci. Controlla i contrassegni demo.`);
    } catch (e) {
      $("connection").textContent = "API non raggiungibile";
      setStatus("catalogStatus", e.message, true);
    }
  }
  document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));
  document.querySelectorAll("[data-category]").forEach(btn => btn.addEventListener("click", () => {
    state.category = btn.dataset.category; $("category").value = state.category; showView("catalog"); renderCatalog();
  }));
  $("search").addEventListener("input", e => { state.query = e.target.value.trim(); renderCatalog(); if (state.query) showView("catalog"); });
  $("clearSearch").addEventListener("click", () => { $("search").value = ""; state.query = ""; renderCatalog(); });
  $("category").addEventListener("change", e => { state.category = e.target.value; renderCatalog(); });
  $("gameClass").addEventListener("change", e => { state.gameClass = e.target.value; renderCatalog(); });
  $("closeDialog").addEventListener("click", () => $("detailDialog").close());
  $("importForm").addEventListener("submit", async e => {
    e.preventDefault();
    const url = $("guideUrl").value.trim();
    $("importStatus").textContent = "Importazione in corso…";
    $("buildResults").innerHTML = "";
    try {
      const endpoint = /\/d4\/planner\//i.test(url) ? "/api/builds/import-planner" : "/api/builds/import-guide";
      const result = await api(endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({url}) });
      const data = result.data;
      let html = `<div class="status-card">Importazione completata. I dati sono importati ma non automaticamente verificati.</div>`;
      const builds = data.builds || [data];
      for (const b of builds) {
        if (b.ok === false) { html += `<div class="status-card">${esc(b.error)}</div>`; continue; }
        html += `<article class="build-profile"><b>${esc(b.name || "Planner importato")}</b><p>Fonte: Maxroll · ID: ${esc(b.plannerId || "—")} · Profili: ${esc(b.profileCount ?? (b.profiles || []).length)}</p>`;
        (b.profiles || []).forEach((p, i) => {
          html += `<details class="build-profile"><summary>${esc(p.name || `Variante ${i+1}`)}</summary><pre>${esc(JSON.stringify(p.profile ?? p, null, 2))}</pre></details>`;
        });
        html += `<details class="build-profile"><summary>Oggetti / dati grezzi</summary><pre>${esc(JSON.stringify({items:b.items, raw:b.raw},null,2))}</pre></details></article>`;
      }
      $("buildResults").innerHTML = html;
      $("importStatus").textContent = "Importazione completata: controlla le informazioni recuperate e gli eventuali campi mancanti.";
    } catch (error) {
      $("importStatus").textContent = `Importazione non riuscita: ${error.message}`;
    }
  });
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  loadData();
})();
