// file_receiver_worker.js
// "Công nhân" chuyên xử lý việc nhận và ghép tệp ở chế độ nền.

let fileInfo = null;
let chunks = [];

self.onmessage = function (e) {
  const { type, payload } = e.data;

  switch (type) {
    case "info":
      // Nhận thông tin file và reset trạng thái
      fileInfo = payload;
      chunks = [];
      console.log("[Worker] Đã nhận thông tin file:", fileInfo.name);
      break;

    case "chunk":
      // Nhận và lưu trữ chunk
      if (fileInfo) {
        chunks.push(payload);
      }
      break;

    case "done":
      // Tín hiệu hoàn thành, bắt đầu ghép file
      if (fileInfo && chunks.length > 0) {
        console.log("[Worker] Bắt đầu ghép file...");
        const blob = new Blob(chunks, {
          type: fileInfo.type || "application/octet-stream",
        });

        // Kiểm tra lại kích thước
        if (blob.size === fileInfo.size) {
          const url = URL.createObjectURL(blob);
          // Gửi URL đã tạo về lại luồng chính
          self.postMessage({
            type: "downloadReady",
            payload: { url, name: fileInfo.name },
          });
        } else {
          self.postMessage({
            type: "error",
            payload: "Kích thước tệp không khớp!",
          });
        }

        // Dọn dẹp bộ nhớ trong worker
        fileInfo = null;
        chunks = [];
      }
      break;

    case "cancel":
      // Hủy bỏ và dọn dẹp
      fileInfo = null;
      chunks = [];
      console.log("[Worker] Đã hủy nhận.");
      break;
  }
};
