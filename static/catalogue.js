// Explore / Catalogue Controller
const BR = [
  ["<30m", "Quick (≤ 30 min)"],
  ["<1h", "Short (31–60 min)"],
  ["1-3h", "Medium (1–3 hours)"],
  [">3h", "Extended (3+ hours)"]
];
const LV = [
  ["introductory", "Introductory"],
  ["intermediate", "Intermediate"],
  ["advanced", "Advanced"],
  ["unspecified", "Unspecified"]
];
const TP = [
  ["lab", "Hands-on Lab"],
  ["course", "Skill Course"]
];

const S = { q: "", type: new Set(), level: new Set(), dur: new Set(), sort: "relevance", page: 1 };
const PS = 12;
let timer, facets = {}, itemsById = {};

function readURL() {
  const p = new URLSearchParams(location.search);
  S.q = p.get("q") || "";
  S.sort = p.get("sort") || "relevance";
  S.page = +p.get("page") || 1;
  [["type", "type"], ["level", "level"], ["dur", "duration_bracket"]].forEach(([k, n]) => {
    (p.get(n) || "").split(",").filter(Boolean).forEach(v => S[k].add(v));
  });
  const qInput = $("#q");
  const soSelect = $("#so");
  if (qInput) qInput.value = S.q;
  if (soSelect) soSelect.value = S.sort;
}

function params() {
  return {
    q: S.q.trim(),
    type: [...S.type].join(","),
    level: [...S.level].join(","),
    duration_bracket: [...S.dur].join(","),
    sort: S.sort === "relevance" ? "" : S.sort,
    page: S.page > 1 ? S.page : ""
  };
}

function renderSidebarGroup(containerId, key, allLabel, items, facetKey) {
  const el = $(containerId);
  if (!el) return;

  const fData = facets[facetKey] || {};
  let totalCount = 0;
  items.forEach(([val]) => {
    if (fData[val] != null) totalCount += fData[val];
  });

  const isAllSelected = S[key].size === 0;

  let html = `
    <button class="filter-row ${isAllSelected ? 'on' : ''}" data-k="${key}" data-v="all">
      <span class="f-name">
        ${key === 'level' ? '<span class="f-dot dot-all"></span>' : ''}
        ${allLabel}
      </span>
      <span class="f-cnt">${totalCount || "—"}</span>
    </button>
  `;

  items.forEach(([val, label]) => {
    const isSelected = S[key].has(val);
    const count = fData[val] != null ? fData[val] : "—";
    const dot = key === 'level' ? `<span class="f-dot dot-${val}"></span>` : '';
    html += `
      <button class="filter-row ${isSelected ? 'on' : ''}" data-k="${key}" data-v="${esc(val)}">
        <span class="f-name">${dot}${esc(label)}</span>
        <span class="f-cnt">${count}</span>
      </button>
    `;
  });

  el.innerHTML = html;
}

function drawFilters() {
  renderSidebarGroup("#fl", "level", "All Levels", LV, "level");
  renderSidebarGroup("#fd", "dur", "Any Duration", BR, "duration_bracket");

  const clrBtn = $("#clr");
  if (clrBtn) {
    const hasActive = S.level.size > 0 || S.dur.size > 0 || S.q !== "" || S.sort !== "relevance";
    clrBtn.style.visibility = hasActive ? "visible" : "hidden";
  }
}

async function load() {
  const p = params();
  const queryStr = new URLSearchParams(Object.entries(p).filter(([, v]) => v)).toString();
  history.replaceState(null, "", "/catalogue" + (queryStr ? "?" + queryStr : ""));

  drawFilters();

  const listEl = $("#list");
  const cntEl = $("#cnt");
  const banEl = $("#ban");
  const pagerEl = $("#pager");

  try {
    const d = await api("/api/credentials", { ...p, page_size: PS });
    if (cntEl) {
      cntEl.textContent = `Showing ${d.total.toLocaleString()} credential${d.total === 1 ? '' : 's'}`;
    }
    if (banEl) {
      banEl.style.display = d.placeholder ? "block" : "none";
    }

    itemsById = {};
    if (d.items && d.items.length) {
      d.items.forEach(c => { itemsById[c.id] = c; });
      listEl.innerHTML = d.items.map(c => `
        <article class="cred-card-grid">
          <div class="cg-top">
            <div class="cg-badges">
              <span class="cg-type-badge">${KT[c.type] || "Credential"}</span>
              <span class="cg-level-badge level-${c.level || 'unspecified'}">
                <span class="f-dot dot-${c.level || 'unspecified'}"></span>
                ${cap(c.level || "Introductory")}
              </span>
            </div>
            <span class="cg-dur">${dur(c.duration_minutes)}</span>
          </div>

          <h3 class="serif cg-title">${esc(c.title)}</h3>

          <p class="cg-desc">${esc(c.description || "Hands-on cloud credential verification and lab modules.")}</p>

          <div class="cg-bottom">
            <button class="btn-quick-view" data-cid="${esc(c.id)}">Quick View</button>
            ${c.url ? `
              <a class="btn dk cg-launch" href="${esc(c.url)}" target="_blank" rel="noopener">
                <span>Launch</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </a>
            ` : `
              <span class="cg-no-url">In catalogue</span>
            `}
          </div>
        </article>
      `).join("");
    } else {
      listEl.innerHTML = `
        <div class="empty">
          <h3 class="serif">No credentials found</h3>
          <p>Try clearing filters, searching for a different skill, or broadening your query.</p>
        </div>
      `;
    }

    const pages = Math.max(1, Math.ceil(d.total / PS));
    if (pagerEl) {
      pagerEl.innerHTML = pages > 1 ? `
        <button class="pill" data-go="-1" ${S.page <= 1 ? "disabled" : ""}>← Prev</button>
        <span class="pager-info">Page ${S.page} of ${pages}</span>
        <button class="pill" data-go="1" ${S.page >= pages ? "disabled" : ""}>Next →</button>
      ` : "";
    }
  } catch (err) {
    if (cntEl) cntEl.textContent = "";
    if (listEl) listEl.innerHTML = `
      <div class="empty">
        <h3 class="serif">Couldn't load credentials</h3>
        <p>The catalogue API is currently unavailable. Please refresh.</p>
      </div>
    `;
  }
}

// Render Trending Chips
const TRENDING = ["BigQuery", "Kubernetes", "Generative AI", "Terraform", "Security", "Vertex AI", "⚡ ≤ 30 min"];
const sugsEl = $("#sugs");
if (sugsEl) {
  sugsEl.innerHTML = TRENDING.map(tag => `<button class="trend-pill" data-tag="${esc(tag)}">${esc(tag)}</button>`).join("");
}

// Global Click Handlers
document.addEventListener("click", e => {
  const filterRow = e.target.closest(".filter-row");
  if (filterRow) {
    const k = filterRow.dataset.k;
    const v = filterRow.dataset.v;
    if (v === "all") {
      S[k].clear();
    } else {
      if (S[k].has(v)) {
        S[k].delete(v);
      } else {
        S[k].add(v);
      }
    }
    S.page = 1;
    load();
    return;
  }

  const trendBtn = e.target.closest(".trend-pill");
  if (trendBtn) {
    const tag = trendBtn.dataset.tag;
    if (tag.includes("≤ 30 min")) {
      S.dur.has("<30m") ? S.dur.delete("<30m") : S.dur.add("<30m");
    } else {
      S.q = tag;
      const qInput = $("#q");
      if (qInput) qInput.value = tag;
    }
    S.page = 1;
    load();
    return;
  }

  if (e.target.closest("#clr")) {
    S.type.clear();
    S.level.clear();
    S.dur.clear();
    S.q = "";
    S.sort = "relevance";
    S.page = 1;
    const qInput = $("#q");
    const soSelect = $("#so");
    if (qInput) qInput.value = "";
    if (soSelect) soSelect.value = "relevance";
    load();
    return;
  }

  const goBtn = e.target.closest("[data-go]");
  if (goBtn) {
    S.page += +goBtn.dataset.go;
    window.scrollTo({ top: 0, behavior: "smooth" });
    load();
    return;
  }

  // Quick View Modal Open
  const qvBtn = e.target.closest(".btn-quick-view");
  if (qvBtn) {
    const cid = qvBtn.dataset.cid;
    const c = itemsById[cid];
    if (c) {
      openQuickView(c);
    }
    return;
  }

  // Quick View Modal Close
  if (e.target.closest("#modal-close") || e.target.id === "cred-modal") {
    closeQuickView();
  }
});

// Quick View Modal Implementation
function openQuickView(c) {
  const modal = $("#cred-modal");
  const body = $("#modal-body");
  if (!modal || !body) return;

  body.innerHTML = `
    <div class="modal-top">
      <span class="cg-type-badge">${KT[c.type] || "Credential"}</span>
      <span class="cg-level-badge level-${c.level || 'unspecified'}">
        <span class="f-dot dot-${c.level || 'unspecified'}"></span>
        ${cap(c.level || "Introductory")}
      </span>
      <span class="cg-dur" style="margin-left:auto">⏱ ${dur(c.duration_minutes)}</span>
    </div>

    <h2 class="serif modal-title">${esc(c.title)}</h2>

    <div class="modal-desc">
      ${esc(c.description || "In this hands-on credential, you will develop practical experience and verify demonstrable skills on real cloud tools.")}
    </div>

    <div class="modal-meta-grid">
      <div class="mm-item">
        <span class="lab">Format</span>
        <strong>${KT[c.type] || "Interactive Lab"}</strong>
      </div>
      <div class="mm-item">
        <span class="lab">Level</span>
        <strong>${cap(c.level || "Introductory")}</strong>
      </div>
      <div class="mm-item">
        <span class="lab">Duration</span>
        <strong>${dur(c.duration_minutes)}</strong>
      </div>
    </div>

    <div class="modal-actions">
      ${c.url ? `
        <a class="btn dk modal-launch" href="${esc(c.url)}" target="_blank" rel="noopener">
          <span>Launch on Official Platform</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
        </a>
      ` : `
        <span style="font-size:13px;color:var(--mute)">Verified credential registered in Ascendr base.</span>
      `}
    </div>
  `;

  modal.style.display = "grid";
  document.body.style.overflow = "hidden";
}

function closeQuickView() {
  const modal = $("#cred-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeQuickView();
});

// Search input debounce
$("#q")?.addEventListener("input", e => {
  S.q = e.target.value;
  S.page = 1;
  clearTimeout(timer);
  timer = setTimeout(load, 250);
});

// Sort select handler
$("#so")?.addEventListener("change", e => {
  S.sort = e.target.value;
  S.page = 1;
  load();
});

// Initial boot
(async () => {
  readURL();
  try {
    facets = await api("/api/filters");
  } catch (e) {
    console.error("Failed to load filter facets", e);
  }
  load();
})();
