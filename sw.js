// 小狗读书 service worker
// 每次发布新版本时，把这个数字改一下（比如 v1 -> v2），
// 否则浏览器会一直用旧缓存，你改的功能用户可能看不到。
const CACHE_NAME = 'xiaogou-duschu-v2';

const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

// 安装阶段：把核心文件预先缓存好
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // 新版本装好后立刻生效，不用等用户关掉所有标签页
});

// 激活阶段：清掉旧版本缓存，避免占用空间越滚越大
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 请求策略：网络优先，网络请求成功就更新缓存；网络失败（离线）时回退到缓存。
// 这样能保证："有网时总是拿到最新版本；没网时至少能打开上次缓存的版本"，
// 不会出现"改完代码用户却因为强缓存看不到"的问题。
self.addEventListener('fetch', (event) => {
  // 只处理get请求；DeepSeek API的调用请求(POST)不经过这里，照常直连网络
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
