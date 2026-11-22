// Learning Path Detail Controller
(async function() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const slug = parts[parts.length - 1];

  const headerEl = document.getElementById("pd-header");
  const timelineEl = document.getElementById("pd-timeline");
  const aiBtn = document.getElementById("pd-ai-btn");

  if (!slug || slug === "paths") {
    window.location.href = "/paths";
    return;
  }

  if (aiBtn) {
    aiBtn.href = `/ai?path=${encodeURIComponent(slug)}`;
  }

  let pathData = null;
  try {
    pathData = await api(`/api/paths/${encodeURIComponent(slug)}`);
  } catch (err) {
    console.error("Failed to fetch path", err);
  }

  if (!pathData || !pathData.slug) {
    if (headerEl) {
      headerEl.innerHTML = `
        <div class="empty">
          <h2 class="serif">Learning path not found</h2>
          <p>We couldn't locate this roadmap. Browse our curated journeys or generate one with Ascendr AI.</p>
          <div style="margin-top:20px;display:flex;gap:12px;justify-content:center">
            <a class="btn dk" href="/paths">View All Paths</a>
            <a class="btn glow" href="/ai">Consult Ascendr AI ✦</a>
          </div>
        </div>
      `;
    }
    return;
  }

  document.title = `${pathData.title} · Roadmap · ascendr.`;

  const certSlot = document.getElementById("pd-cert-slot");
  if (certSlot) {
    certSlot.innerHTML = pathData.certification ? `<span class="pd-badge">${esc(pathData.certification)}</span>` : '';
  }

  // Render Header
  if (headerEl) {
    headerEl.innerHTML = `
      <h1 class="serif pd-hero-title">${esc(pathData.title)}</h1>
      <p class="pd-hero-sub">${esc(pathData.tagline)}</p>
    `;
  }

  // Render Stages
  if (timelineEl && pathData.stages) {
    timelineEl.innerHTML = pathData.stages.map((stg, idx) => `
      <div class="milestone-node reveal" id="stage-${stg.num}">
        <div class="ms-marker">
          <div class="ms-circle">0${stg.num}</div>
          <div class="ms-line"></div>
        </div>
        <div class="ms-card">
          <div class="ms-header">
            <div class="lab">STAGE 0${stg.num} · MILESTONE</div>
            <h3 class="serif">${esc(stg.title)}</h3>
            <p class="ms-desc">${esc(stg.desc)}</p>
          </div>

          <div class="ms-skills">
            <span class="ms-skills-label">Skills acquired:</span>
            <div class="ms-chips">
              ${(stg.skills || []).map(s => `<span class="chip">${esc(s)}</span>`).join("")}
            </div>
          </div>

          <div class="ms-creds-box">
            <div class="ms-creds-title">
              <span>Recommended Hands-on Credentials</span>
              <a href="/catalogue?q=${encodeURIComponent(stg.search || '')}" class="ms-creds-more">Search in catalogue →</a>
            </div>
            <div class="ms-creds-list" id="creds-stage-${stg.num}">
              <div class="sc-loading">Fetching matched credentials...</div>
            </div>
          </div>
        </div>
      </div>
    `).join("");

    reveal();

    // Dynamically fetch credentials for each stage in parallel
    pathData.stages.forEach(async (stg) => {
      const stageCredsContainer = document.getElementById(`creds-stage-${stg.num}`);
      if (!stageCredsContainer) return;

      try {
        const query = stg.search || "cloud";
        const credRes = await api(`/api/credentials?q=${encodeURIComponent(query)}&page_size=3`);
        const rawItems = (credRes && credRes.items) ? credRes.items : [];
        const items = rawItems.filter(c => !c.id?.startsWith("placeholder_") && !c.title?.startsWith("Placeholder:"));

        if (!items.length) {
          stageCredsContainer.innerHTML = `<div class="sc-empty">Credentials available in full catalogue.</div>`;
          return;
        }

        stageCredsContainer.innerHTML = items.map(c => `
          <div class="sc-item">
            <div class="sc-item-top">
              <span class="mono sc-type">${KT[c.type] || c.type || "Credential"}</span>
              <span class="sc-dur">${dur(c.duration_minutes)}</span>
            </div>
            <h4 class="serif"><a href="/catalogue?q=${encodeURIComponent(c.title)}">${esc(c.title)}</a></h4>
            <div class="sc-footer">
              <span class="sc-lvl">${cap(c.level || "Introductory")}</span>
              <a href="${c.url ? esc(c.url) : `/catalogue?q=${encodeURIComponent(c.title)}`}" target="_blank" rel="noopener" class="sc-btn">
                ${c.url ? 'Launch ↗' : 'View in catalogue →'}
              </a>
            </div>
          </div>
        `).join("");
      } catch (err) {
        stageCredsContainer.innerHTML = `<div class="sc-empty">Credentials available in full catalogue.</div>`;
      }
    });
  }

  // Smooth scroll handler for anchor links (e.g. Start Stage 1 -> #stages)
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const targetId = link.getAttribute("href");
    if (targetId && targetId.length > 1) {
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.classList.add("in");
        target.querySelectorAll(".reveal").forEach(el => el.classList.add("in"));
        if (window.lenis && typeof window.lenis.scrollTo === "function") {
          window.lenis.scrollTo(target, { offset: -80, duration: 1.1 });
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  });
})();
