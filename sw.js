// 抗菌薬MAP 拡大ビューア：通信なしでも開けるように、アプリ本体を端末に保存する
const VER='abx-v0.4.0';
const SHELL=['./','index.html','lib/pdf.min.js','lib/pdf.worker.min.js','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VER).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER&&k!=='abx-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const timeout=(ms)=>new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms));
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    const isPage=req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('index.html');
    if(isPage){ // 本体は新しいものを優先し、つながらない・遅いときは保存した版を使う
      e.respondWith(Promise.race([fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(VER).then(c=>c.put('index.html',cp))}return r}),timeout(2500)])
        .catch(()=>caches.match('index.html').then(r=>r||caches.match('./'))));
    }else{
      e.respondWith(caches.match(req).then(r=>r||fetch(req).then(n=>{if(n.ok){const cp=n.clone();caches.open(VER).then(c=>c.put(req,cp))}return n})));
    }
  }else if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open('abx-fonts').then(c=>c.match(req).then(r=>r||fetch(req).then(n=>{c.put(req,n.clone());return n}).catch(()=>new Response('',{status:504})))));
  }
});
