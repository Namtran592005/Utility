document.addEventListener("DOMContentLoaded", () => {
  // --- Lấy tham chiếu DOM ---
  // Tab Generator
  const generatedPasswordEl = document.getElementById("generated-password");
  const regenerateBtn = document.getElementById("regenerate-btn");
  const copyBtn = document.getElementById("copy-btn");
  const lengthSlider = document.getElementById("length");
  const lengthValueEl = document.getElementById("length-value");
  const optionsCheckboxes = document.querySelectorAll(
    ".password-options input"
  );

  // Tab Analyzer
  const passwordToCheckEl = document.getElementById("password-to-check");
  const toggleVisibilityBtn = document.getElementById("toggle-visibility");
  const strengthBarEl = document.getElementById("strength-bar");
  const strengthTextEl = document.getElementById("strength-text");
  const timeToCrackEl = document.getElementById("time-to-crack");
  const pwnedStatusEl = document.getElementById("pwned-status");
  const pwnedCard = document.getElementById("pwned-card");

  // --- LOGIC TAB GENERATOR ---
  const charSets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+~`|}{[]:;?><,./-=",
  };

  function generatePassword() {
    const length = parseInt(lengthSlider.value);
    let charPool = "";
    let password = "";
    let guaranteedChars = "";

    optionsCheckboxes.forEach((opt) => {
      if (opt.checked) {
        charPool += charSets[opt.id];
        guaranteedChars +=
          charSets[opt.id][Math.floor(Math.random() * charSets[opt.id].length)];
      }
    });

    if (charPool === "") {
      generatedPasswordEl.textContent = "Chọn ít nhất 1 loại ký tự!";
      return;
    }

    for (let i = guaranteedChars.length; i < length; i++) {
      password += charPool[Math.floor(Math.random() * charPool.length)];
    }

    generatedPasswordEl.textContent = (password + guaranteedChars)
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  }

  lengthSlider.addEventListener("input", () => {
    lengthValueEl.textContent = lengthSlider.value;
    generatePassword();
  });
  optionsCheckboxes.forEach((opt) =>
    opt.addEventListener("change", generatePassword)
  );
  regenerateBtn.addEventListener("click", generatePassword);

  copyBtn.addEventListener("click", () => {
    const password = generatedPasswordEl.textContent;
    if (password && !password.startsWith("Chọn")) {
      navigator.clipboard.writeText(password).then(() => {
        const icon = copyBtn.querySelector(".material-symbols-outlined");
        icon.textContent = "done";
        setTimeout(() => {
          icon.textContent = "content_copy";
        }, 2000);
      });
    }
  });

  // --- LOGIC TAB ANALYZER ---
  let debounceTimer;
  passwordToCheckEl.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      analyzePassword(passwordToCheckEl.value);
    }, 300); // Đợi 300ms sau khi người dùng ngừng gõ
  });

  toggleVisibilityBtn.addEventListener("click", () => {
    const isPassword = passwordToCheckEl.type === "password";
    passwordToCheckEl.type = isPassword ? "text" : "password";
    toggleVisibilityBtn.querySelector(
      ".material-symbols-outlined"
    ).textContent = isPassword ? "visibility_off" : "visibility";
  });

  async function analyzePassword(password) {
    if (!password) {
      resetAnalyzerUI();
      return;
    }

    // 1. Phân tích độ mạnh với zxcvbn
    const analysis = zxcvbn(password);
    const score = analysis.score; // 0-4

    strengthBarEl.style.width = `${(score + 1) * 20}%`;
    const strengthLevels = [
      { text: "Rất yếu", color: "var(--danger-color)" },
      { text: "Yếu", color: "#fd7e14" },
      { text: "Trung bình", color: "var(--warning-color)" },
      { text: "Mạnh", color: "#10a9e8" },
      { text: "Rất mạnh", color: "var(--success-color)" },
    ];
    strengthBarEl.style.backgroundColor = strengthLevels[score].color;
    strengthTextEl.textContent = strengthLevels[score].text;
    strengthTextEl.style.color = strengthLevels[score].color;

    timeToCrackEl.textContent =
      analysis.crack_times_display.offline_slow_hashing_1e4_per_second;

    // 2. Kiểm tra rò rỉ (Pwned)
    pwnedStatusEl.textContent = "Đang kiểm tra...";
    pwnedCard.className = "result-card pending";

    try {
      // Hash the password (SHA-1 is required by the API)
      const digest = await crypto.subtle.digest(
        "SHA-1",
        new TextEncoder().encode(password)
      );
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`
      );
      if (!response.ok) throw new Error("API request failed");

      const text = await response.text();
      const hashes = text.split("\r\n").map((line) => line.split(":"));
      const match = hashes.find((h) => h[0] === suffix);

      if (match) {
        pwnedStatusEl.textContent = `Bị rò rỉ ${parseInt(
          match[1]
        ).toLocaleString("vi-VN")} lần`;
        pwnedCard.className = "result-card pwned";
      } else {
        pwnedStatusEl.textContent =
          "An toàn! Không tìm thấy trong dữ liệu rò rỉ.";
        pwnedCard.className = "result-card safe";
      }
    } catch (error) {
      pwnedStatusEl.textContent = "Không thể kiểm tra";
      pwnedCard.className = "result-card error";
      console.error("Pwned check error:", error);
    }
  }

  function resetAnalyzerUI() {
    strengthBarEl.style.width = "0%";
    strengthTextEl.textContent = "";
    timeToCrackEl.textContent = "...";
    pwnedStatusEl.textContent = "Nhập mật khẩu để kiểm tra";
    pwnedCard.className = "result-card";
  }

  // --- LOGIC CHUYỂN TAB ---
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("active")) return;
      document.querySelector(".tab-btn.active").classList.remove("active");
      button.classList.add("active");

      document.querySelector(".tab-content.active").classList.remove("active");
      document
        .getElementById(`tab-${button.dataset.tab}`)
        .classList.add("active");
    });
  });

  // --- KHỞI TẠO ---
  generatePassword();
  resetAnalyzerUI();
});
