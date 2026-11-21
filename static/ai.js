/**
 * Ascendr AI — Intelligent Learning Guidance Consultant & Blueprint Builder
 */
const BLUEPRINTS = {
  ai: {
    title: "Artificial Intelligence & Applied ML",
    tagline: "From mathematical foundations to fine-tuning LLMs and production inference.",
    level: "Introductory to Intermediate",
    time: "8–10 weeks (4–6 hrs/week)",
    career: "AI Application Developer, Machine Learning Engineer",
    stages: [
      {
        name: "Stage 01: Foundations & Mental Models",
        desc: "Build intuition for model training, vectors, loss functions, and evaluation metrics.",
        search: "machine learning"
      },
      {
        name: "Stage 02: Hands-on Labs & Prompt Engineering",
        desc: "Implement prompt patterns, embeddings, and multimodal models with structured outputs.",
        search: "generative ai"
      },
      {
        name: "Stage 03: Production MLOps & Capstone",
        desc: "Deploy models with monitoring, scaling pipelines, and responsible AI safety boundaries.",
        search: "vertex ai"
      }
    ]
  },
  cloud: {
    title: "Cloud Solutions Architect Journey",
    tagline: "Master distributed infrastructure, networking, container orchestration, and reliability.",
    level: "Intermediate",
    time: "10–12 weeks (5 hrs/week)",
    career: "Cloud Architect, DevOps / SRE Engineer",
    stages: [
      {
        name: "Stage 01: Cloud Infrastructure & Networking",
        desc: "Understand VPCs, IAM security perimeters, compute instances, and storage tiers.",
        search: "fundamentals"
      },
      {
        name: "Stage 02: Kubernetes & Container Orchestration",
        desc: "Deploy, scale, and debug containerized microservices across resilient clusters.",
        search: "kubernetes"
      },
      {
        name: "Stage 03: Architecture Framework & High Availability",
        desc: "Design multi-region failover, cost-optimized telemetry, and disaster recovery.",
        search: "security"
      }
    ]
  },
  backend: {
    title: "Modern Backend Engineering & Systems",
    tagline: "Build dependable services, design high-throughput APIs, and master data persistence.",
    level: "Introductory to Intermediate",
    time: "8 weeks (4 hrs/week)",
    career: "Backend Engineer, API Platform Specialist",
    stages: [
      {
        name: "Stage 01: HTTP Protocols & RESTful Services",
        desc: "Route design, request lifecycles, authentication middlewares, and validation.",
        search: "python"
      },
      {
        name: "Stage 02: Relational & Document Data Stores",
        desc: "Schema design, index tuning, transaction semantics, and connection pooling.",
        search: "database"
      },
      {
        name: "Stage 03: Microservices, Caching & Deployment",
        desc: "Event queues, containerization, Redis caching, and CI/CD automated deployment.",
        search: "containers"
      }
    ]
  },
  data: {
    title: "Data Analytics & Analytics Engineering",
    tagline: "Transform raw information into reliable decision-making pipelines and executive dashboards.",
    level: "All Levels",
    time: "6–8 weeks (4 hrs/week)",
    career: "Data Analyst, Analytics Engineer, BI Developer",
    stages: [
      {
        name: "Stage 01: SQL Mastery & Data Modeling",
        desc: "Aggregations, window functions, relational joins, and clean analytical schemas.",
        search: "sql"
      },
      {
        name: "Stage 02: Cloud Data Warehouses & Pipelines",
        desc: "Partitioning, cost-effective querying, and automated scheduled ETL ingestion.",
        search: "analytics"
      },
      {
        name: "Stage 03: Visual Storytelling & BI Insights",
        desc: "Executive reporting, metric governance, and actionable telemetry dashboards.",
        search: "reporting"
      }
    ]
  }
};

const dialogue = $("#dialogue");
const form = $("#consult-form");
const input = $("#user-input");
const canvas = $("#blueprint-content");
const statusEl = $("#blueprint-status");

function addMessage(role, html) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = role === "ai"
    ? `<div class="avatar">✦</div><div class="bubble">${html}</div>`
    : `<div class="bubble user-bubble">${esc(html)}</div>`;
  dialogue.appendChild(div);
  dialogue.scrollTop = dialogue.scrollHeight;
}

async function renderBlueprint(planKey, customGoal = "") {
  const plan = BLUEPRINTS[planKey] || BLUEPRINTS.ai;
  statusEl.textContent = "Blueprint Ready";

  canvas.innerHTML = `
    <div class="bp-hero">
      <span class="bp-tag">Tailored Pathway</span>
      <h2>${esc(plan.title)}</h2>
      <p class="bp-sub">${esc(plan.tagline)}</p>
      <div class="bp-meta">
        <span>⏱ ${esc(plan.time)}</span>
        <span>🎯 Level: ${esc(plan.level)}</span>
        <span>💼 Target: ${esc(plan.career)}</span>
      </div>
    </div>
    <div class="bp-stages" id="bp-stages-list">
      <div class="bp-loading">Fetching verified credentials for your roadmap...</div>
    </div>
  `;

  const stagesList = $("#bp-stages-list");
  let stagesHTML = "";

  for (let i = 0; i < plan.stages.length; i++) {
    const s = plan.stages[i];
    let creds = [];
    try {
      const data = await api("/api/credentials", { q: s.search, page_size: 2 });
      creds = data.items || [];
    } catch (e) {
      creds = [];
    }

    stagesHTML += `
      <div class="bp-stage">
        <div class="stage-num">0${i + 1}</div>
        <div class="stage-body">
          <h3>${esc(s.name)}</h3>
          <p class="stage-desc">${esc(s.desc)}</p>
          <div class="stage-creds">
            ${creds.map(c => `
              <div class="stage-card">
                <div class="sc-top">
                  <span class="tag">${KT[c.type] || "Credential"}</span>
                  <span class="sc-dur">${dur(c.duration_minutes)}</span>
                </div>
                <h4>${esc(c.title)}</h4>
                <div class="sc-act">
                  ${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">Start Lab / Course ↗</a>` : `<span>Core Milestone</span>`}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  stagesList.innerHTML = stagesHTML + `
    <div class="bp-actions">
      <a class="btn dk" href="/catalogue">Explore All Supporting Credentials</a>
      <button class="btn" id="share-plan-btn">Save Blueprint</button>
    </div>
  `;

  $("#share-plan-btn")?.addEventListener("click", () => {
    navigator.clipboard?.writeText(window.location.href);
    alert("Blueprint link copied to clipboard!");
  });
}

// Starter chips click handler
$("#starters")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const intent = btn.dataset.intent;
  addMessage("user", btn.textContent.trim());

  addMessage("ai", `
    <p>Excellent choice. Designing your pathway for <strong>${esc(btn.textContent.trim())}</strong>.</p>
    <p>I have structured a 3-stage blueprint on the right: moving from foundational labs into applied engineering and capstone certification.</p>
  `);

  await renderBlueprint(intent);
});

// User form submit
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  addMessage("user", text);

  // Intent classification heuristics
  const lower = text.toLowerCase();
  let intent = "ai";
  if (lower.includes("cloud") || lower.includes("architect") || lower.includes("k8s") || lower.includes("kubernetes")) {
    intent = "cloud";
  } else if (lower.includes("backend") || lower.includes("api") || lower.includes("python") || lower.includes("django")) {
    intent = "backend";
  } else if (lower.includes("data") || lower.includes("sql") || lower.includes("analytic") || lower.includes("bi")) {
    intent = "data";
  }

  addMessage("ai", `
    <p>Got it. Based on: <em>"${esc(text)}"</em>, I’ve mapped out your progression path.</p>
    <p>Take a look at your generated roadmap on the right canvas. You can click into each verified lab to get started.</p>
  `);

  await renderBlueprint(intent, text);
});

// Auto-initialize if URL parameter provides a path or intent
(async () => {
  const params = new URLSearchParams(window.location.search);
  const pathParam = params.get("path") || params.get("intent");
  if (!pathParam) return;

  const slugMap = {
    "cloud-computing": "cloud",
    "cloud": "cloud",
    "first-steps-ai-ml": "ai",
    "ai": "ai",
    "backend-foundations": "backend",
    "backend": "backend",
    "data-analytics": "data",
    "data": "data",
    "technical-internship-prep": "backend"
  };

  const intent = slugMap[pathParam] || "ai";
  const bp = BLUEPRINTS[intent];
  if (bp) {
    addMessage("user", `I'd like to adapt the "${bp.title}" path to my learning schedule.`);
    addMessage("ai", `
      <p>Welcome! I've loaded the <strong>${esc(bp.title)}</strong> framework into your blueprint studio on the right.</p>
      <p>How many hours per week do you plan to dedicate, and what is your current comfort level with these technologies?</p>
    `);
    await renderBlueprint(intent);
  }
})();
