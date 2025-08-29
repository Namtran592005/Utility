// qr_code_logic.js

document.addEventListener("DOMContentLoaded", () => {
  // Lấy tham chiếu các phần tử
  const canvasEl = document.getElementById("canvas");
  const logoUploadEl = document.getElementById("logo-upload");
  const logoFilenameEl = document.getElementById("logo-filename");

  const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    data: "https://www.google.com/",
    image: "",
    dotsOptions: { color: "#000000", type: "square" },
    backgroundOptions: { color: "#ffffff" },
    cornersSquareOptions: { type: "square" },
    imageOptions: { crossOrigin: "anonymous", margin: 10, imageSize: 0.4 },
  });

  qrCode.append(canvasEl);

  // --- Lắng nghe các sự kiện thay đổi ---
  const allInputs = document.querySelectorAll(
    ".qr-options-panel input, .qr-options-panel select, .qr-options-panel textarea"
  );
  allInputs.forEach((input) => {
    if (input.id !== "logo-upload") {
      input.addEventListener("input", () => updateQrCode());
    }
  });

  logoUploadEl.addEventListener("change", (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        updateQrCode({ image: e.target.result });
      };
      reader.readAsDataURL(file);
      // THAY ĐỔI: Hiển thị tên tệp
      logoFilenameEl.textContent = file.name;
    }
  });

  document.getElementById("remove-logo").addEventListener("click", () => {
    logoUploadEl.value = "";
    // THAY ĐỔI: Reset tên tệp
    logoFilenameEl.textContent = "Chưa chọn tệp nào";
    updateQrCode({ image: "" });
  });

  document.getElementById("download-btn").addEventListener("click", () => {
    const format = document.getElementById("download-format").value;
    qrCode.download({ name: "qrcode", extension: format });
  });

  // --- Logic chuyển Tab ---
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(".tab-btn.active").classList.remove("active");
      button.classList.add("active");

      document.querySelector(".tab-content.active").classList.remove("active");
      document
        .getElementById(`tab-${button.dataset.tab}`)
        .classList.add("active");

      updateQrCode();
    });
  });

  // --- Hàm cập nhật chính ---
  function updateQrCode(overrideOptions = {}) {
    const data = getQrData();

    const options = {
      data: data,
      dotsOptions: {
        color: document.getElementById("dot-color").value,
        type: document.getElementById("dots-style").value,
      },
      backgroundOptions: {
        color: document.getElementById("bg-color").value,
      },
      cornersSquareOptions: {
        type: document.getElementById("corners-style").value,
      },
      ...overrideOptions,
    };

    qrCode.update(options);
  }

  // --- Hàm lấy dữ liệu từ tab đang hoạt động ---
  function getQrData() {
    const activeTab = document.querySelector(".tab-btn.active").dataset.tab;

    switch (activeTab) {
      case "wifi":
        const ssid = document.getElementById("wifi-ssid").value;
        const pass = document.getElementById("wifi-pass").value;
        const enc = document.getElementById("wifi-encryption").value;
        return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
      case "vcard":
        const name = document.getElementById("vcard-name").value;
        const phone = document.getElementById("vcard-phone").value;
        const email = document.getElementById("vcard-email").value;
        const url = document.getElementById("vcard-url").value;
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nURL:${url}\nEND:VCARD`;
      case "text":
      default:
        return document.getElementById("text-input").value || " ";
    }
  }

  updateQrCode();
});
