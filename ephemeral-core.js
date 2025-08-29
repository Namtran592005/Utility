/**
 * =================================================================================
 * EPHEMERAL CORE v2.0 - LÕI TRẠNG THÁI TẠM THỜI
 * =================================================================================
 * Kiến trúc độc quyền "All-in-One" tự kiến tạo (self-constructing).
 * Tệp này tự động tạo và đăng ký Service Worker và Manifest từ bộ nhớ,
 * đồng thời thực thi chính sách "không lưu trữ" (zero-retention) triệt để.
 * Chỉ cần nhúng tệp này vào HTML của bạn.
 * ---------------------------------------------------------------------------------
 */

(() => {
  "use strict";

  // --- CẤU HÌNH CỐT LÕI ---
  const CORE_VERSION = "ec-v2.0";
  const LOG_PREFIX = `[EphemeralCore ${CORE_VERSION}]`;

  /**
   * DỮ LIỆU MANIFEST
   * Dữ liệu này sẽ được tự động chuyển thành manifest.json.
   */
  const MANIFEST_DATA = {
    name: "Công cụ Tiện ích",
    short_name: "Tiện ích",
    description: "Bộ công cụ tiện ích nhanh, an toàn và riêng tư.",
    start_url: "/index.html",
    display: "standalone",
    background_color: "#1a1b26", // Dark theme background
    theme_color: "#7aa2f7", // Dark theme primary
    icons: [
      {
        src: "./assets/images/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        src: "./assets/images/icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
  };

  /**
   * MÃ NGUỒN SERVICE WORKER
   * Toàn bộ logic của Service Worker được chứa trong một chuỗi đa dòng.
   */
  const SERVICE_WORKER_CODE = `
    const VERSION = '${CORE_VERSION}';
    const LOG_PREFIX = \`[ESSW \${VERSION}]\`;

    self.addEventListener('install', event => {
      console.log(LOG_PREFIX, 'Đang cài đặt...');
      self.skipWaiting();
    });

    self.addEventListener('activate', event => {
      console.log(LOG_PREFIX, 'Đang kích hoạt...');
      event.waitUntil(
        (async () => {
          await self.clients.claim();
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => {
              console.log(LOG_PREFIX, \`Đang xóa cache cũ: \${cacheName}\`);
              return caches.delete(cacheName);
            })
          );
          console.log(LOG_PREFIX, 'Tất cả cache đã được dọn dẹp. Hệ thống sạch sẽ.');
        })()
      );
    });

    self.addEventListener('fetch', event => {
      // Bỏ qua cache, luôn đi đến mạng. Đây là chính sách cốt lõi.
      event.respondWith(fetch(event.request));
    });
  `;

  // --- CÁC HÀM THI HÀNH ---

  /**
   * Tự động tiêm Manifest vào <head> từ đối tượng MANIFEST_DATA.
   */
  function injectManifest() {
    try {
      const manifestString = JSON.stringify(MANIFEST_DATA);
      const manifestBlob = new Blob([manifestString], {
        type: "application/json",
      });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      const linkElement = document.createElement("link");
      linkElement.rel = "manifest";
      linkElement.href = manifestUrl;

      document.head.appendChild(linkElement);
      console.log(LOG_PREFIX, "Manifest đã được tiêm động thành công.");
    } catch (error) {
      console.error(LOG_PREFIX, "Lỗi khi tiêm Manifest:", error);
    }
  }

  /**
   * Tự động đăng ký Service Worker từ chuỗi SERVICE_WORKER_CODE.
   */
  function registerEphemeralWorker() {
    if (!("serviceWorker" in navigator)) {
      console.warn(LOG_PREFIX, "Trình duyệt không hỗ trợ Service Worker.");
      return;
    }

    try {
      const workerBlob = new Blob([SERVICE_WORKER_CODE], {
        type: "application/javascript",
      });
      const workerUrl = URL.createObjectURL(workerBlob);

      navigator.serviceWorker
        .register(workerUrl)
        .then((registration) => {
          console.log(
            LOG_PREFIX,
            "Service Worker đã được đăng ký thành công từ bộ nhớ đệm (Blob). Scope:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error(LOG_PREFIX, "Đăng ký Service Worker thất bại:", error);
        });
    } catch (error) {
      console.error(LOG_PREFIX, "Lỗi khi tạo Service Worker Blob:", error);
    }
  }

  /**
   * Thực thi chính sách dọn dẹp phía client (localStorage, sessionStorage).
   */
  function clientSideCleanup() {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log(
        LOG_PREFIX,
        "Dọn dẹp phía client (localStorage, sessionStorage) hoàn tất."
      );
    } catch (error) {
      console.error(LOG_PREFIX, "Lỗi khi dọn dẹp client-side storage:", error);
    }
  }

  // --- ĐIỂM KHỞI ĐẦU ---

  // 1. Dọn dẹp ngay lập tức.
  clientSideCleanup();

  // 2. Tiêm manifest vào trang.
  injectManifest();

  // 3. Đăng ký Service Worker sau khi trang đã tải xong để không ảnh hưởng đến hiệu suất ban đầu.
  window.addEventListener("load", registerEphemeralWorker);
})();
