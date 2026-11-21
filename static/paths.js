// Learning Paths gallery controller
(async function() {
  const container = document.getElementById("paths-gallery");
  if (!container) return;

  try {
    const res = await api("/api/paths");
    const paths = (res && (res.items || res.paths)) ? (res.items || res.paths) : [];
    
    if (!paths.length) {
      container.innerHTML = `<div class="empty"><h3>No learning paths found</h3><p>Check back shortly or build a custom one with Ascendr AI.</p></div>`;
      return;
    }

    container.innerHTML = paths.map((p, i) => {
      const num = String(i + 1).padStart(2, "0");
      const stagesHtml = (p.stages || []).map((stg, sIdx) => `
        <div class="pg-stage">
          <div class="pg-stage-num">0${sIdx + 1}</div>
          <div class="pg-stage-info">
            <h5>${esc(stg.title)}</h5>
            <p>${esc(stg.desc)}</p>
            <div class="pg-chips">
              ${(stg.skills || []).map(sk => `<span class="chip">${esc(sk)}</span>`).join("")}
            </div>
          </div>
        </div>
      `).join("");

      return `
        <article class="path-card-v2 reveal">
          <div class="pc-top">
            <span class="lab">PATH ${num}</span>
            <span class="pc-cert">${esc(p.certification || "Industry Aligned")}</span>
          </div>

          <h2 class="serif pc-title"><a href="/paths/${p.slug}">${esc(p.title)}</a></h2>
          <p class="pc-tagline">${esc(p.tagline)}</p>

          <div class="pc-meta">
            <span class="pc-pill">⏱ ${esc(p.duration)}</span>
            <span class="pc-pill">🎯 ${esc(p.level)}</span>
            <span class="pc-pill">3 Structured Stages</span>
          </div>

          <div class="pg-stages-list">
            ${stagesHtml}
          </div>

          <div class="pc-outcome">
            <strong>Target Competency:</strong> ${esc(p.outcome)}
          </div>

          <div class="pc-actions">
            <a class="btn dk" href="/paths/${p.slug}">Explore Full Roadmap →</a>
            <a class="btn" href="/ai?path=${p.slug}">Customize with AI ✦</a>
          </div>
        </article>
      `;
    }).join("");

    reveal();
  } catch (err) {
    console.error("Failed to load learning paths", err);
    container.innerHTML = `<div class="empty"><h3>Could not load learning paths</h3><p>Please refresh the page to retry.</p></div>`;
  }
})();
