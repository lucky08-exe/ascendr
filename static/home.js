const PATHS=[["Backend Development","Services, APIs and data.",["Python","APIs","Databases","Capstone"]],["Artificial Intelligence","Foundations through applied models.",["Python","Statistics","ML basics","Applied AI"]],["Data Analytics","Ask better questions of your data.",["Spreadsheets","SQL","Visualisation","Reporting"]],["Cloud Computing","Build, ship and run in the cloud.",["Fundamentals","Labs","Deployment","Operations"]]];
$("#pathgrid").innerHTML=PATHS.map((p,i)=>`<div class="path reveal"><div class="lab">Path 0${i+1}</div><h3 class="serif">${p[0]}</h3><p>${p[1]}</p><div class="stages">${p[2].map((s,j)=>`<div class="stg"><em>STAGE ${j+1}</em>${s}</div>`).join("")}</div><div class="meta"><span>Four stages</span><a href="/catalogue">Browse →</a></div></div>`).join("");
reveal();
(async()=>{let d={items:[],placeholder:false};
  try{d=await api("/api/credentials",{page_size:6})}catch(e){}
  $("#cur").innerHTML=d.items.length?d.items.map(card).join(""):`<p style="grid-column:1/-1;text-align:center;color:var(--mute)">No credentials available yet.</p>`;
  $("#demo").innerHTML=d.items.slice(0,3).map(c=>`<div class="row"><div class="mono">a</div><div><h4>${esc(c.title)}</h4><small>${KT[c.type]||""} · ${cap(c.level)} · ${dur(c.duration_minutes)}</small></div></div>`).join("");
  if(d.placeholder)$("#phnote").textContent="Placeholder data shown.";
})();
