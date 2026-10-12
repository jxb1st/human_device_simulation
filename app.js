(function(){
const $$=(s,r)=>[...(r||document).querySelectorAll(s)];
function seek(task,t,play){$$('video',task).forEach(v=>{try{v.currentTime=t;}catch(e){} if(play) v.play().catch(()=>{});});}
$$('.task').forEach(task=>{
  const vs=$$('video',task); if(!vs.length) return;
  const lead=vs[0], svg=task.querySelector('svg.tl'), ph=svg&&svg.querySelector('.ph'), time=task.querySelector('.vtime');
  const bars=$$('.tl-bar[data-end]',task);
  $$('.vbtns button',task).forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.act;
    if(a==='play') vs.forEach(v=>v.play().catch(()=>{})); if(a==='pause') vs.forEach(v=>v.pause()); if(a==='restart') seek(task,0,true);}));
  vs.forEach(v=>v.addEventListener('seeked',()=>{vs.forEach(o=>{if(o!==v&&Math.abs(o.currentTime-v.currentTime)>0.3){try{o.currentTime=v.currentTime;}catch(e){}}});}));
  function tick(){const t=lead.currentTime; if(svg&&ph){const tot=parseFloat(svg.dataset.total); const x=parseFloat(svg.dataset.l)+parseFloat(svg.dataset.w)*Math.min(t,tot)/tot;
      ph.setAttribute('x1',x); ph.setAttribute('x2',x); ph.setAttribute('opacity',(lead.paused&&t===0)?0:1);}
    bars.forEach(b=>b.classList.toggle('on',t>=parseFloat(b.dataset.seek)&&t<=parseFloat(b.dataset.end))); if(time) time.textContent=t.toFixed(1)+' s';}
  lead.addEventListener('timeupdate',tick); lead.addEventListener('seeked',tick);
});
$$('.tl-bar[data-seek]').forEach(b=>b.addEventListener('click',()=>{const task=b.closest('.task'); if(!task||!task.querySelector('video')) return;
  seek(task,parseFloat(b.dataset.seek),true); const v=task.querySelector('.vids'); if(v) v.scrollIntoView({block:'nearest',behavior:'smooth'});}));
})();
