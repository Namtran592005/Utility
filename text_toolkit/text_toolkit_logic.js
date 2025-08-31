document.addEventListener("DOMContentLoaded", () => {
  // --- 1. LẤY THAM CHIẾU DOM ---
  const textInput = document.getElementById("text-input");
  const textOutput = document.getElementById("text-output");
  const copyBtn = document.getElementById("copy-btn");
  const clearBtn = document.getElementById("clear-btn");
  const sidebar = document.querySelector(".toolkit-sidebar");

  // Inspector Panel
  const charCountEl = document.getElementById("char-count");
  const wordCountEl = document.getElementById("word-count");
  const lineCountEl = document.getElementById("line-count");
  const sentenceCountEl = document.getElementById("sentence-count");

  // Analysis Panel
  const readingTimeEl = document.getElementById("reading-time");
  const readabilityScoreEl = document.getElementById("readability-score");
  const googleTranslateBtn = document.getElementById("google-translate-btn");

  // Find & Replace
  const findInput = document.getElementById("find-input");
  const replaceInput = document.getElementById("replace-input");
  const caseSensitiveCheckbox = document.getElementById(
    "case-sensitive-checkbox"
  );

  // --- 2. CÁC HÀM PHÂN TÍCH VÀ CẬP NHẬT ---

  // Hàm tính thời gian đọc (ước tính)
  function calculateReadingTime(wordCount) {
    const wordsPerMinute = 200; // Tốc độ đọc trung bình
    const minutes = wordCount / wordsPerMinute;
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds} giây`;
    }
    return `${Math.ceil(minutes)} phút`;
  }

  // Hàm cập nhật các link ngoài
  function updateExternalLinks() {
    const text = textInput.value;
    const encodedText = encodeURIComponent(text);

    if (text.trim() === "") {
      googleTranslateBtn.href = "https://translate.google.com/";
    } else {
      googleTranslateBtn.href = `https://translate.google.com/?sl=auto&tl=en&text=${encodedText}&op=translate`;
    }
  }

  // Hàm chính cập nhật tất cả các chỉ số
  function updateInspector() {
    const text = textInput.value;

    const words = text.match(/\b\w+\b/g) || [];
    const wordCount = words.length;
    const charCount = text.length;
    const lines = text.split("\n");
    const lineCount = text === "" ? 0 : lines.length;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const sentenceCount = sentences.length;

    charCountEl.textContent = charCount.toLocaleString("vi-VN");
    wordCountEl.textContent = wordCount.toLocaleString("vi-VN");
    lineCountEl.textContent = lineCount.toLocaleString("vi-VN");
    sentenceCountEl.textContent = sentenceCount.toLocaleString("vi-VN");

    // Cập nhật Analysis Panel
    readingTimeEl.textContent = calculateReadingTime(wordCount);

    // Cập nhật Flesch-Kincaid Reading Ease (công thức đơn giản hóa)
    if (wordCount > 0 && sentenceCount > 0) {
      // Chỉ số này chính xác hơn với văn bản tiếng Anh
      readabilityScoreEl.textContent = "Tiếng Anh";
    } else {
      readabilityScoreEl.textContent = "N/A";
    }

    updateExternalLinks();
  }

  // --- 3. CÁC HÀM XỬ LÝ VĂN BẢN ---
  const textActions = {
    uppercase: (text) => text.toUpperCase(),
    lowercase: (text) => text.toLowerCase(),
    titlecase: (text) =>
      text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
    sentencecase: (text) =>
      text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()),
    sort: (text) => text.split("\n").sort().join("\n"),
    reverse: (text) => text.split("\n").reverse().join("\n"),
    "remove-duplicates": (text) => [...new Set(text.split("\n"))].join("\n"),
    "remove-empty": (text) =>
      text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .join("\n"),
    "replace-all": (text) => {
      const findValue = findInput.value;
      if (!findValue) return text;
      const replaceValue = replaceInput.value;
      const flags = caseSensitiveCheckbox.checked ? "g" : "gi";
      const regex = new RegExp(findValue, flags);
      return text.replace(regex, replaceValue);
    },
  };

  // --- 4. GẮN CÁC SỰ KIỆN ---
  textInput.addEventListener("input", updateInspector);

  sidebar.addEventListener("click", (e) => {
    const target = e.target.closest(".tool-btn");
    if (!target) return;

    const action = target.dataset.action;
    if (textActions[action]) {
      const transformedText = textActions[action](textInput.value);
      textOutput.value = transformedText;
    }
  });

  copyBtn.addEventListener("click", () => {
    if (textOutput.value) {
      navigator.clipboard.writeText(textOutput.value).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Đã sao chép!";
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 1500);
      });
    }
  });

  clearBtn.addEventListener("click", () => {
    textInput.value = "";
    textOutput.value = "";
    updateInspector();
  });

  // --- 5. KHỞI TẠO ---
  updateInspector();
});
