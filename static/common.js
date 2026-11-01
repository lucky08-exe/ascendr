const $=s=>document.querySelector(s);
const KT={lab:"Hands-on lab",course:"Skill course",learning_path:"Learning path"};
const cap=s=>s?s[0].toUpperCase()+s.slice(1):"Unspecified";
const dur=m=>m==null?"—":m<60?m+" min":(m/60).toFixed(m%60?1:0)+" hr";
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
async function api(path,params={}){const u=new URL(path,location.origin);
  Object.entries(params).forEach(([k,v])=>v!==""&&v!=null&&u.searchParams.set(k,v));
  const r=await fetch(u);if(!r.ok)throw new Error(r.status);return r.json()}
const card=c=>`<div class="cc"><div class="lab" style="margin:0">${KT[c.type]||"Credential"}</div><h4>${esc(c.title)}</h4><div><span class="tag">${cap(c.level)}</span></div><div class="meta"><span>${dur(c.duration_minutes)}</span>${c.url?`<a href="${esc(c.url)}" target="_blank" rel="noopener">Open ↗</a>`:"<span></span>"}</div></div>`;
function reveal(){const io=new IntersectionObserver(es=>es.forEach(x=>x.isIntersecting&&x.target.classList.add("in")),{threshold:.15});
  document.querySelectorAll(".reveal:not(.in)").forEach(x=>io.observe(x))}
document.querySelectorAll("[data-n]").forEach(a=>a.classList.toggle("on",a.dataset.n===document.body.dataset.page));
