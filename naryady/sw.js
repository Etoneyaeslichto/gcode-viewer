/* offline cache; BUILD is replaced at deploy time so every release refreshes the cache */
var C='nar-4796e8bc',FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(C).then(function(c){return c.addAll(FILES)}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==C&&n.split('-')[0]===C.split('-')[0]}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
if(e.request.mode==='navigate'){var sp=new URL(self.registration.scope).pathname;if(u.pathname!==sp&&u.pathname!==sp+'index.html')return;e.respondWith(fetch(e.request).then(function(r){var cp=r.clone();caches.open(C).then(function(c){c.put('index.html',cp)});return r}).catch(function(){return caches.match('index.html')}));return}
e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request)}))});
