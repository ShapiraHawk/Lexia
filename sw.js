/* LEXIA service worker.
   The app is one self-contained file, so the cache is tiny and the strategy is
   simple: serve the shell from cache first so it opens instantly with no
   connection, and refresh it in the background for next launch.
   A patient mid-session must never see a network error. */
const VERSION = "lexia-v1.0.0";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(VERSION)
      // individual failures must not abort the whole install
      .then(c=>Promise.allSettled(SHELL.map(u=>c.add(u))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;

  // Navigations: cache first, so a dead connection still opens the app.
  if(req.mode === "navigate"){
    e.respondWith(
      caches.match("./index.html").then(hit=>{
        const net = fetch(req).then(res=>{
          if(res && res.ok) caches.open(VERSION).then(c=>c.put("./index.html", res.clone()));
          return res;
        }).catch(()=>hit);
        return hit || net;
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit=>{
      if(hit){
        fetch(req).then(res=>{
          if(res && res.ok) caches.open(VERSION).then(c=>c.put(req, res.clone()));
        }).catch(()=>{});
        return hit;
      }
      return fetch(req).then(res=>{
        if(res && res.ok) caches.open(VERSION).then(c=>c.put(req, res.clone()));
        return res;
      }).catch(()=>caches.match("./index.html"));
    })
  );
});
