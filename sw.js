// sw.js — Service Worker ສຳລັບ Cache ໜ້າ Shell ໃຫ້ເປີດໄວຂຶ້ນ ແລະ ໃຊ້ Offline ໄດ້ບາງສ່ວນ
// ໝາຍເຫດ: ຂໍ້ມູນຈິງ (ສະຕັອກ, ຍອດຂາຍ) ຍັງຕ້ອງການອິນເຕີເນັດສະເໝີ ເພາະດຶງຈາກ Google Apps Script
//
// ໃຊ້ກົນລະຍຸດ "Network First": ພະຍາຍາມດຶງໄຟລ໌ໃໝ່ຈາກ Server ກ່ອນສະເໝີ,
// ຖ້າອິນເຕີເນັດຂາດຈຶ່ງໃຊ້ Cache ເກົ່າແທນ — ເພື່ອບໍ່ໃຫ້ຄ້າງເວີຊັນເກົ່າອີກຄືທີ່ຜ່ານມາ

const CACHE_NAME = 'watersale-cache-v2'; // *** ປ່ຽນເລກນີ້ທຸກຄັ້ງທີ່ຢາກບັງຄັບລ້າງ Cache ເກົ່າ ***
const SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './config.js',
  './api.js',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting(); // ບັງຄັບໃຫ້ Service Worker ໃໝ່ເຮັດວຽກທັນທີ ບໍ່ຕ້ອງລໍ Tab ເກົ່າອອກ
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // ເອົາ Tab ທີ່ເປີດຄ້າງໄວ້ໃຫ້ໃຊ້ Service Worker ໃໝ່ທັນທີ
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ບໍ່ Cache ຄຳຮ້ອງໄປຫາ Google Apps Script — ຕ້ອງເອີ້ນສົດສະເໝີ
  if (url.hostname.indexOf('script.google.com') !== -1) {
    return; // ປ່ອຍໃຫ້ browser ຈັດການປົກກະຕິ
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request)) // Offline -> ໃຊ້ Cache ເກົ່າແທນ
  );
});
