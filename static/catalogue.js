const BR=[["<30m","≤ 30 min"],["<1h","31–60 min"],["1-3h","1–3 hours"],[">3h","3+ hours"]];
const LV=["introductory","intermediate","advanced","unspecified"];
const S={q:"",type:new Set,level:new Set,dur:new Set,sort:"relevance",page:1};
const PS=12;let timer,facets={};
function readURL(){const p=new URLSearchParams(location.search);S.q=p.get("q")||"";S.sort=p.get("sort")||"relevance";S.page=+p.get("page")||1;
  [["type","type"],["level","level"],["dur","duration_bracket"]].forEach(([k,n])=>(p.get(n)||"").split(",").filter(Boolean).forEach(v=>S[k].add(v)));
  $("#q").value=S.q;$("#so").value=S.sort}
function params(){return {q:S.q.trim(),type:[...S.type].join(","),level:[...S.level].join(","),duration_bracket:[...S.dur].join(","),sort:S.sort==="relevance"?"":S.sort,page:S.page>1?S.page:""}}
function pills(id,k,items,fk){$(id).innerHTML=items.map(([v,n])=>`<button class="pill${S[k].has(v)?" on":""}" data-k="${k}" data-v="${esc(v)}">${n}${facets[fk]?.[v]!=null?`<span class="cnt-n">${facets[fk][v]}</span>`:""}</button>`).join(" ")}
function drawFilters(){pills("#ft","type",Object.entries(KT),"type");pills("#fl","level",LV.map(x=>[x,cap(x)]),"level");pills("#fd","dur",BR,"duration_bracket")}
async function load(){
  const p=params();history.replaceState(null,"","/catalogue"+(Object.values(p).some(Boolean)?"?"+new URLSearchParams(Object.entries(p).filter(([,v])=>v)):""));
  drawFilters();
  try{const d=await api("/api/credentials",{...p,page_size:PS});
    $("#cnt").textContent=`${d.total} credential${d.total===1?"":"s"}`;
    $("#ban").style.display=d.placeholder?"block":"none";
    $("#list").innerHTML=d.items.length?d.items.map(c=>`<div class="res"><div class="mono">a</div><div><h3>${c.url?`<a class="t" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a>`:esc(c.title)}</h3>${c.description?`<p style="color:var(--mute);font-size:13px;margin-top:4px;max-width:560px">${esc(c.description.slice(0,160))}${c.description.length>160?"…":""}</p>`:""}<div><span class="tag">${KT[c.type]||"Credential"}</span><span class="tag">${cap(c.level)}</span></div><div class="m"><span>${dur(c.duration_minutes)}</span></div></div>${c.url?`<a class="src" href="${esc(c.url)}" target="_blank" rel="noopener">View source ↗</a>`:`<span class="src" style="opacity:.5">No source link</span>`}</div>`).join(""):`<div class="empty"><h3>No credentials found</h3><p>Try a different search or clear your filters.</p></div>`;
    const pages=Math.max(1,Math.ceil(d.total/PS));
    $("#pager").innerHTML=pages>1?`<button class="pill" data-go="-1" ${S.page<=1?"disabled":""}>← Prev</button>Page ${S.page} of ${pages}<button class="pill" data-go="1" ${S.page>=pages?"disabled":""}>Next →</button>`:"";
  }catch(e){$("#cnt").textContent="";$("#list").innerHTML=`<div class="empty"><h3>Couldn’t load credentials</h3><p>The API isn’t responding. Please try again.</p></div>`}
}
$("#sugs").innerHTML=["Cloud","Data","Security","Containers"].map(x=>`<button>${x}</button>`).join(" ");
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.dataset.k){const s=S[b.dataset.k];s.has(b.dataset.v)?s.delete(b.dataset.v):s.add(b.dataset.v);S.page=1}
  else if(b.dataset.go){S.page+=+b.dataset.go;scrollTo(0,0)}
  else if(b.id==="clr"){S.type.clear();S.level.clear();S.dur.clear();S.q="";S.sort="relevance";S.page=1;$("#q").value="";$("#so").value="relevance"}
  else if(b.closest("#sugs")){S.q=b.textContent;S.page=1;$("#q").value=S.q}else return;load()});
$("#q").addEventListener("input",e=>{S.q=e.target.value;S.page=1;clearTimeout(timer);timer=setTimeout(load,200)});
$("#so").addEventListener("change",e=>{S.sort=e.target.value;S.page=1;load()});
(async()=>{readURL();try{facets=await api("/api/filters")}catch(e){}load()})();
