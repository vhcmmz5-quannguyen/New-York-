const CACHE_NAME = 'app-quantri-v3';
const urlsToCache = [
  './index.html',
  './style.css',
  './script.js'
];

// 1. Cài đặt và tải sẵn file vào bộ nhớ
self.addEventListener('install', e => {
  self.skipWaiting(); // Ép kích hoạt phiên bản mới ngay lập tức
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
});

// 2. Dọn dẹp rác (cache cũ) khi có phiên bản mới
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  return self.clients.claim(); // Chiếm quyền điều khiển trang web ngay lập tức
});

// 3. CHIẾN LƯỢC MỚI: Ưu tiên lấy từ Mạng (Network-First), mất mạng mới dùng Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Nếu có mạng, tải bản mới nhất và lưu đè vào cache để dành
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        // Nếu mất mạng (Offline), lôi đồ trong cache ra xài
        return caches.match(event.request);
      })
  );
});

// 4. CHUẨN BỊ LÕI: Lắng nghe sự kiện thông báo đẩy (Khi tắt app)
self.addEventListener('push', event => {
  // Lấy dữ liệu đẩy về, nếu không có thì dùng mặc định
  const data = event.data ? event.data.json() : { title: "LỚP HỌC CÔNG GIÁO", body: "Bạn có thông báo mới!" };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // Icon hiện trên thông báo
      badge: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // Icon nhỏ trên thanh trạng thái
      vibrate: [200, 100, 200] // Rung điện thoại
    })
  );
});

// 5. Mở lại web khi bấm vào thông báo
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Nếu đang mở web sẵn thì focus vào
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu chưa mở thì mở tab mới
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
