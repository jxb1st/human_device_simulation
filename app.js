(function(){
const D=window.EPISODES; const $=s=>document.querySelector(s); const el=(t,c,txt)=>{const e=document.createElement(t); if(c)e.className=c; if(txt!=null)e.textContent=txt; return e;};
const state={ep:null,view:'external',compare:false,syncing:false};
const main=$('#main'); const grid=$('#compare-grid');
function fmt(t){return (Math.round(t*100)/100).toFixed(2)+' s';}
function cards(){const c=$('#cards'); c.innerHTML=''; D.episodes.forEach((ep,i)=>{const card=el('div','card'); const v=ep.views.external||Object.values(ep.views)[0];
  const img=el('img'); if(v&&v.poster){img.src=v.poster; img.alt=ep.id+' poster';} card.appendChild(img);
  const b=el('div','body'); const title=el('div','title',ep.sequence_id.replace(/_/g,' ')+' — '+ep.device_id); b.appendChild(title);
  const meta=el('div','meta',(v?Math.round(v.duration_s*10)/10+' s · '+v.width+'×'+v.height+' · '+(v.engine||''):'')+' · status '+ep.status+(ep.complete?'':' (incomplete)')); b.appendChild(meta);
  const mech=el('div'); [...new Set(ep.mechanisms.map(m=>m.mechanism))].forEach(m=>mech.appendChild(el('span','badge',m))); b.appendChild(mech);
  card.appendChild(b); card.addEventListener('click',()=>load(i)); card.dataset.i=i; c.appendChild(card);});}
function runinfo(ep){const v=ep.views[state.view]; const r=$('#runinfo'); r.innerHTML='';
  const rows=[['Run',ep.id],['Device',ep.device_id],['Duration',ep.timing.total_s+' s ('+ep.timing.n_frames+' frames at '+ep.timing.fps+' fps)'],['Resolution',v?v.width+'×'+v.height:'—'],['Engine',v?(v.engine+' / '+(v.device||'')):'—'],['Seed',ep.seed],['Trajectory',ep.trajectory_hash?ep.trajectory_hash.slice(0,12)+'…':'—'],['Status',ep.status],['Owner review',ep.owner_review]];
  const t=el('table'); rows.forEach(([k,vv])=>{const tr=el('tr'); tr.appendChild(el('th',null,k)); tr.appendChild(el('td',null,String(vv))); t.appendChild(tr);}); r.appendChild(t);
  if(v&&v.hidden_for_this_camera&&v.hidden_for_this_camera.length){r.appendChild(el('div','small','Camera-only visibility adjustment: '+v.hidden_for_this_camera.join(', ')+' hidden for this view.'));}
  const m=$('#measured'); m.innerHTML=''; ep.measured_events.forEach(e=>m.appendChild(el('div',null,(e.t!=null?fmt(e.t)+' ':'')+e.type+(e.q_m!=null?' q='+(e.q_m*1000).toFixed(2)+' mm':'')+' ['+e.step+'/'+e.part+']')));}
function chapters(ep){const c=$('#chapters'); c.innerHTML=''; ep.chapters.forEach(ch=>{const b=el('button',null,ch.id+' ('+ch.mechanism+')'); b.title=fmt(ch.t)+' '+ch.action+(ch.hand?' '+ch.hand:''); b.addEventListener('click',()=>seekAll(ch.t)); c.appendChild(b);});}
function cams(ep){const c=$('#cams'); c.innerHTML=''; Object.keys(ep.views).forEach(v=>{const b=el('button',v===state.view?'on':'',v); b.addEventListener('click',()=>switchView(v)); c.appendChild(b);});}
function load(i){state.ep=D.episodes[i]; document.querySelectorAll('.card').forEach(x=>x.classList.toggle('active',x.dataset.i==i)); const ep=state.ep;
  if(!ep.views[state.view]) state.view=Object.keys(ep.views)[0]; $('#viewer-title').textContent='Viewer — '+ep.sequence_id.replace(/_/g,' ');
  setSrc(main,ep.views[state.view]); cams(ep); chapters(ep); runinfo(ep); buildGrid(ep); evidence(ep); location.hash='#viewer';}
function setSrc(v,view){const t=v.currentTime||0; v.pause(); v.src=view.src; if(view.poster) v.poster=view.poster; v.load(); v.addEventListener('loadedmetadata',()=>{try{v.currentTime=Math.min(t,v.duration||t);}catch(e){}},{once:true});}
function switchView(v){state.view=v; const t=main.currentTime; setSrc(main,state.ep.views[v]); main.addEventListener('loadedmetadata',()=>{main.currentTime=t;},{once:true}); cams(state.ep); runinfo(state.ep);}
function buildGrid(ep){grid.innerHTML=''; Object.entries(ep.views).forEach(([name,view])=>{const wrap=el('div'); const vid=el('video'); vid.src=view.src; vid.muted=true; vid.playsInline=true; vid.preload='metadata'; vid.dataset.view=name; if(view.poster) vid.poster=view.poster; wrap.appendChild(vid); wrap.appendChild(el('div','small',name)); grid.appendChild(wrap);});}
function others(){return [...grid.querySelectorAll('video')];}
function seekAll(t){main.currentTime=t; if(state.compare) others().forEach(v=>{v.currentTime=t;});}
function playAll(){main.play().catch(()=>{}); if(state.compare) others().forEach(v=>v.play().catch(()=>{}));}
function pauseAll(){main.pause(); others().forEach(v=>v.pause());}
$('#play').addEventListener('click',()=>{main.paused?playAll():pauseAll();});
$('#restart').addEventListener('click',()=>{seekAll(0); playAll();});
$('#rate').addEventListener('change',e=>{const r=parseFloat(e.target.value); main.playbackRate=r; others().forEach(v=>v.playbackRate=r);});
$('#fs').addEventListener('click',()=>{if(main.requestFullscreen) main.requestFullscreen();});
$('#compare').addEventListener('click',()=>{state.compare=!state.compare; $('#compare').classList.toggle('on',state.compare); grid.classList.toggle('hidden',!state.compare); if(state.compare){others().forEach(v=>{v.currentTime=main.currentTime; v.playbackRate=main.playbackRate; if(!main.paused) v.play().catch(()=>{});});} else others().forEach(v=>v.pause());});
main.addEventListener('play',()=>{$('#play').textContent='Pause'; if(state.compare) others().forEach(v=>v.play().catch(()=>{}));});
main.addEventListener('pause',()=>{$('#play').textContent='Play'; others().forEach(v=>v.pause());});
main.addEventListener('seeked',()=>{if(state.compare) others().forEach(v=>{v.currentTime=main.currentTime;});});
main.addEventListener('waiting',()=>{if(state.compare) others().forEach(v=>v.pause());});
main.addEventListener('playing',()=>{if(state.compare) others().forEach(v=>v.play().catch(()=>{}));});
function tick(){const ep=state.ep; if(ep){const t=main.currentTime; $('#time').textContent=fmt(t)+' / '+fmt(main.duration||ep.timing.total_s); const cur=ep.chapters.filter(c=>t>=c.t&&t<=c.t_end).map(c=>c.id+' ('+c.mechanism+(c.hand?', '+c.hand:'')+')');
  const fx=ep.effects.filter(e=>t>=e.t_start&&t<=e.t_end).map(e=>e.id+' ('+e.mechanism+')'); $('#current').textContent=(cur.concat(fx).join(' · '))||'—';
  if(state.compare&&!main.paused){others().forEach(v=>{const d=v.currentTime-t; if(Math.abs(d)>0.08&&!v.seeking){v.currentTime=t;}});}}
  if(main.requestVideoFrameCallback){main.requestVideoFrameCallback(tick);} else {setTimeout(tick,100);} }
if(main.requestVideoFrameCallback){main.requestVideoFrameCallback(tick);} else {setInterval(tick,100);}
function evidence(ep){const b=$('#evidence-body'); b.innerHTML=''; const t=el('table'); const h=el('tr'); ['step','part','check','status','value','threshold'].forEach(x=>h.appendChild(el('th',null,x))); t.appendChild(h);
  Object.entries(ep.physics||{}).forEach(([sid,p])=>{Object.entries(p.checks||{}).forEach(([k,ok])=>{const tr=el('tr'); let val='',thr=''; if(k==='travel_ge_min'){val=(p.positive.min_or_max_travel_m*1000).toFixed(2)+' mm';thr='≥ '+(p.thresholds.min_travel_m*1000)+' mm';} if(k==='penetration_le_max'){val=(p.positive.max_penetration_m*1000).toFixed(2)+' mm (visible tip '+((p.visible_tip_penetration_max_m||0)*1000).toFixed(2)+' mm)';thr='≤ '+(p.thresholds.max_penetration_m*1000)+' mm';} if(k==='negative_no_motion'){val=(p.negative.max_abs_travel_m*1000).toFixed(3)+' mm';thr='< 0.1 mm';} if(k==='contact_seen'){val='max contacts '+p.positive.max_ncon;} if(k==='negative_no_contact'){val='contacts '+p.negative.max_ncon;}
    [sid,p.part,k,ok?'pass':'FAIL',val,thr].forEach(x=>tr.appendChild(el('td',null,x))); t.appendChild(tr);});});
  b.appendChild(el('p','small','Contact tests: measured in simulation (MuJoCo) with a kinematic fingertip proxy; a negative control moves the hand clear of the part. Not a real-world certification.')); b.appendChild(t);
  if(ep.proxies_check){b.appendChild(el('p','small','Fingertip-to-goal error in holds: '+(ep.proxies_check.tip_error_hold_max_m*1000).toFixed(3)+' mm; max fingertip speed '+ep.proxies_check.max_tip_speed_m_s.toFixed(2)+' m/s.'));}
  const ul=el('ul'); ep.limitations.forEach(l=>ul.appendChild(el('li',null,l))); b.appendChild(el('h3',null,'Limitations')); b.appendChild(ul);
  const d=el('details'); d.appendChild(el('summary',null,'Downloads (run records)')); const dl=el('div','mono small'); dl.appendChild(el('div',null,'data/'+ep.id+'/manifest.json · data/'+ep.id+'/events.jsonl · data/'+ep.id+'/physics_*.json')); d.appendChild(dl); b.appendChild(d);}
$('#mechnote').textContent=Object.entries(D.mechanism_note).map(([k,v])=>k+' = '+v).join('; '); $('#credits').textContent=D.attribution+' Versions: '+(D.episodes[0]?Object.entries(D.episodes[0].versions).map(([k,v])=>k+' '+v).join(', '):'');
document.querySelectorAll('.tl-bar[data-ep]').forEach(b=>b.addEventListener('click',()=>{const i=D.episodes.findIndex(e=>e.id===b.dataset.ep); if(i<0)return; const t=parseFloat(b.dataset.seek); load(i); const go=()=>{seekAll(t);}; if(main.readyState>=1) go(); main.addEventListener('loadedmetadata',go,{once:true});}));
cards(); if(D.episodes.length) load(0);
})();
