const PATHS=[
  ["Backend Development","Services, APIs and data.",["Python","APIs","Databases","Capstone"],"backend-foundations"],
  ["Artificial Intelligence","Foundations through applied models.",["Python","Statistics","ML basics","Applied AI"],"first-steps-ai-ml"],
  ["Data Analytics","Ask better questions of your data.",["Spreadsheets","SQL","Visualisation","Reporting"],"data-analytics"],
  ["Cloud Computing","Build, ship and run in the cloud.",["Fundamentals","Labs","Deployment","Operations"],"cloud-computing"]
];
$("#pathgrid").innerHTML=PATHS.map((p,i)=>`
<div class="path reveal" onclick="window.location.href='/paths/${p[3]}'">
  <div class="lab">Path 0${i+1}</div>
  <h3 class="serif">${p[0]}</h3>
  <p>${p[1]}</p>
  <div class="stages">
    ${p[2].map((s,j)=>`<div class="stg"><em>STAGE ${j+1}</em>${s}</div>`).join("")}
  </div>
  <div class="meta">
    <span>Four stages</span>
    <a href="/paths/${p[3]}" onclick="event.stopPropagation()">Browse →</a>
  </div>
</div>`).join("");
reveal();
(async()=>{let d={items:[],placeholder:false};
  try{d=await api("/api/credentials",{page_size:6})}catch(e){}
  $("#cur").innerHTML=d.items.length?d.items.map(card).join(""):`<p style="grid-column:1/-1;text-align:center;color:var(--mute)">No credentials available yet.</p>`;
  $("#demo").innerHTML=d.items.slice(0,3).map(c=>`<div class="row"><div class="mono">a</div><div><h4>${esc(c.title)}</h4><small>${KT[c.type]||""} · ${cap(c.level)} · ${dur(c.duration_minutes)}</small></div></div>`).join("");
  if(d.placeholder)$("#phnote").textContent="Placeholder data shown.";
})();
