// file_transfer_logic.js
// Phiên bản cuối cùng: Tích hợp StreamSaver.js để ghi file trực tiếp vào đĩa, giải quyết vấn đề RAM.

document.addEventListener("DOMContentLoaded", () => {
  // ========== DOM refs ==========
  const statusTextEl = document.getElementById("status-text");
  const myIdEl = document.getElementById("my-id");
  const copyIdBtn = document.getElementById("copy-id-btn");
  const peerIdInput = document.getElementById("peer-id-input");
  const connectBtn = document.getElementById("connect-btn");
  const transferPanel = document.getElementById("transfer-panel");
  const transferHeading = document.getElementById("transfer-heading");
  const fileInput = document.getElementById("file-input");
  const sendBtn = document.getElementById("send-btn");
  const dropZone = document.getElementById("drop-zone");
  const selectedFileNameEl = document.getElementById("selected-file-name");
  const progressContainer = document.getElementById("progress-container");
  const progressFilename = document.getElementById("progress-filename");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  // Lưu ý: Các element của download-prompt không còn cần thiết với StreamSaver
  // nhưng vẫn để đó để không gây lỗi nếu HTML chưa được dọn dẹp.

  // ========== State ==========
  let peer = null,
    connection = null,
    fileToSend = null;
  let sending = false,
    cancelSend = false;

  // State cho việc nhận file streaming
  let fileStream = null;
  let streamWriter = null;

  // ========== Helpers UI ==========
  function setStatus(txt, state = "") {
    statusTextEl.textContent = txt;
    statusTextEl.className = state;
    console.log(`[status: ${state}]`, txt);
  }

  function showTransferPanel(peerId) {
    transferPanel.style.display = "block";
    setTimeout(() => transferPanel.classList.add("visible"), 10);
    transferHeading.textContent = `Đã kết nối với: ${peerId}`;
    document.querySelector(".connection-block").style.display = "none";
  }

  function hideTransferPanel() {
    transferPanel.classList.remove("visible");
    setTimeout(() => (transferPanel.style.display = "none"), 400);
    document.querySelector(".connection-block").style.display = "block";
  }

  function showProgress(filename) {
    progressContainer.style.display = "block";
    progressContainer.classList.add("visible");
    progressFilename.textContent = filename;
    updateProgress(0);
  }

  function updateProgress(percentage) {
    const p = Math.round(percentage);
    progressBar.style.width = `${p}%`;
    progressText.textContent = `${p}%`;
  }

  function hideProgress() {
    progressContainer.classList.remove("visible");
    setTimeout(() => {
      progressContainer.style.display = "none";
      selectedFileNameEl.textContent = "";
      fileInput.value = "";
      fileToSend = null;
      sendBtn.disabled = true;
    }, 300);
  }

  // ========== PeerJS init & Connection ==========
  function initializePeer() {
    setStatus("Đang khởi tạo...", "connecting");
    // Tạo ID ngẫu nhiên, dễ đọc
    const randomId = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    peer = new Peer(randomId, {
      /* debug: 2 */
    });

    peer.on("open", (id) => {
      myIdEl.textContent = id;
      setStatus("Sẵn sàng kết nối", "connected");
    });

    peer.on("connection", (conn) => {
      // Chỉ cho phép một kết nối tại một thời điểm
      if (connection && connection.open) {
        conn.close();
        return;
      }
      connection = conn;
      setupConnectionEvents(connection);
    });

    peer.on("error", (err) => {
      console.error("PeerJS Error:", err);
      setStatus(`Lỗi: ${err.message}`, "error");
    });
  }

  connectBtn.addEventListener("click", () => {
    const peerId = peerIdInput.value.trim();
    if (!peerId) return alert("Vui lòng nhập ID của người nhận.");
    setStatus(`Đang kết nối tới ${peerId}...`, "connecting");
    connection = peer.connect(peerId, { reliable: true });
    setupConnectionEvents(connection);
  });

  copyIdBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(myIdEl.textContent);
    copyIdBtn.textContent = "Đã chép!";
    setTimeout(() => (copyIdBtn.textContent = "Sao chép"), 1500);
  });

  function setupConnectionEvents(conn) {
    conn.on("open", () => {
      setStatus(`Kết nối thành công với ${conn.peer}`, "connected");
      showTransferPanel(conn.peer);
    });
    conn.on("data", handleIncomingData);
    conn.on("close", () => {
      alert("Kết nối đã bị đóng.");
      resetState();
    });
    conn.on("error", (err) => {
      alert("Lỗi kết nối: " + err);
      resetState();
    });
  }

  // ========== File Input & Drag-Drop ==========
  function handleFileSelect(files) {
    if (!files || files.length === 0) return;
    fileToSend = files[0];
    selectedFileNameEl.textContent = `Đã chọn: ${fileToSend.name} (${(
      fileToSend.size /
      1024 /
      1024
    ).toFixed(2)} MB)`;
    sendBtn.disabled = false;
  }
  fileInput.addEventListener("change", (e) => handleFileSelect(e.target.files));
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () =>
    dropZone.classList.remove("dragover")
  );
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    handleFileSelect(e.dataTransfer.files);
  });

  // ========== LOGIC NHẬN FILE MỚI VỚI STREAM-SAVER ==========
  let incomingFileInfo = null;
  let receivedBytes = 0;

  function handleIncomingData(data) {
    try {
      if (data.type === "info") {
        incomingFileInfo = data.payload;
        receivedBytes = 0;

        // Ngay lập tức bắt đầu stream, người dùng sẽ thấy file đang tải xuống
        // Điều này sẽ kích hoạt hộp thoại "Lưu" của trình duyệt
        fileStream = streamSaver.createWriteStream(incomingFileInfo.name, {
          size: incomingFileInfo.size,
        });
        streamWriter = fileStream.getWriter();

        showProgress(`Đang nhận: ${incomingFileInfo.name}`);
        setStatus("Đang nhận file...", "connecting");
      } else if (data.type === "chunk") {
        if (!streamWriter) {
          console.error("Lỗi: Nhận được chunk nhưng stream chưa sẵn sàng.");
          return;
        }
        // Ghi chunk trực tiếp vào đĩa, không lưu vào RAM
        streamWriter.write(new Uint8Array(data.payload));

        receivedBytes += data.payload.byteLength;
        updateProgress(
          Math.round((receivedBytes / incomingFileInfo.size) * 100)
        );
      } else if (data.type === "done") {
        if (!streamWriter) {
          console.error(
            "Lỗi: Nhận được tín hiệu done nhưng stream chưa sẵn sàng."
          );
          return;
        }
        updateProgress(100);
        streamWriter.close(); // Đóng stream để hoàn tất việc ghi file
        streamWriter = null;
        fileStream = null;
        setStatus(`Tải xong: ${incomingFileInfo.name}`, "connected");
        hideProgress();
      } else if (data.type === "cancel") {
        if (streamWriter) {
          streamWriter.abort("Người gửi đã hủy"); // Hủy bỏ việc ghi file
        }
        alert("Bên gửi đã hủy truyền tệp.");
        resetState();
      }
    } catch (error) {
      console.error("Lỗi khi nhận dữ liệu:", error);
      setStatus(`Lỗi nghiêm trọng khi nhận file: ${error.message}`, "error");
      if (streamWriter) streamWriter.abort(error);
      resetState();
    }
  }

  // ========== LOGIC GỬI FILE (SENDING) ==========
  sendBtn.addEventListener("click", async () => {
    if (!connection?.open || !fileToSend || sending) return;

    sending = true;
    cancelSend = false;
    sendBtn.classList.add("sending");
    sendBtn.disabled = true;
    setStatus(`Đang gửi: ${fileToSend.name}`, "connecting");
    showProgress(`Đang gửi: ${fileToSend.name}`);

    // Gửi thông tin file trước
    connection.send({
      type: "info",
      payload: {
        name: fileToSend.name,
        size: fileToSend.size,
        type: fileToSend.type,
      },
    });

    // Bắt đầu đọc và gửi file theo từng chunk
    const CHUNK_SIZE = 64 * 1024; // 64KB là kích thước chunk tốt cho WebRTC
    let offset = 0;
    while (offset < fileToSend.size) {
      if (cancelSend) {
        connection.send({ type: "cancel" });
        break;
      }
      const slice = fileToSend.slice(offset, offset + CHUNK_SIZE);
      const chunk = await slice.arrayBuffer();

      connection.send({ type: "chunk", payload: chunk });

      offset += chunk.byteLength;
      updateProgress(Math.round((offset / fileToSend.size) * 100));

      // Thêm một độ trễ nhỏ để không làm nghẽn luồng
      await new Promise((r) => setTimeout(r, 2));
    }

    if (cancelSend) {
      setStatus("Đã hủy gửi.", "");
    } else {
      connection.send({ type: "done" });
      setStatus(`Gửi hoàn tất: ${fileToSend.name}`, "connected");
    }

    sending = false;
    sendBtn.classList.remove("sending");
    hideProgress();
  });

  // ========== Utility & Reset ==========
  function resetState() {
    if (connection) {
      connection.close();
    }
    if (streamWriter) {
      streamWriter.abort("Kết nối đã reset");
    }
    connection = null;
    streamWriter = null;
    fileStream = null;
    sending = false;
    cancelSend = false;

    hideTransferPanel();
    setStatus("Sẵn sàng kết nối", "connected");
    hideProgress();
  }

  // Khởi chạy ứng dụng
  initializePeer();
});
