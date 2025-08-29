document.addEventListener("DOMContentLoaded", () => {
  // --- CẤU TRÚC DỮ LIỆU CÁC CÔNG CỤ THEO DANH MỤC ---
  const TOOL_CATEGORIES = {
    formatters: {
      name: "Formatters & Beautifiers",
      tools: {
        "js-beautify": {
          name: "JavaScript Formatter",
          language: "javascript",
          processor: formatJS,
          btnText: "Định dạng",
        },
        "css-beautify": {
          name: "CSS Formatter",
          language: "css",
          processor: formatCSS,
          btnText: "Định dạng",
        },
        "html-beautify": {
          name: "HTML Formatter",
          language: "xml",
          processor: formatHTML,
          btnText: "Định dạng",
        },
        "sql-format": {
          name: "SQL Formatter",
          language: "sql",
          processor: formatSQL,
          btnText: "Định dạng",
        },
        "json-validate": {
          name: "JSON Validator & Viewer",
          language: "javascript",
          processor: validateAndShowJSON,
          btnText: "Kiểm tra & Xem",
        },
      },
    },
    minifiers: {
      name: "Minifiers & Optimizers",
      tools: {
        "js-minify": {
          name: "JavaScript Minifier",
          language: "javascript",
          processor: minifyJS,
          btnText: "Rút gọn",
        },
        "css-minify": {
          name: "CSS Minifier",
          language: "css",
          processor: minifyCSS,
          btnText: "Rút gọn",
        },
        "html-minify": {
          name: "HTML Minifier",
          language: "xml",
          processor: minifyHTML,
          btnText: "Rút gọn",
        },
      },
    },
    encoders: {
      name: "Encoders / Decoders",
      tools: {
        "base64-encode": {
          name: "Base64 Encode",
          language: "text",
          processor: base64Encode,
          btnText: "Mã hóa",
        },
        "base64-decode": {
          name: "Base64 Decode",
          language: "text",
          processor: base64Decode,
          btnText: "Giải mã",
        },
        "url-encode": {
          name: "URL Encode",
          language: "text",
          processor: urlEncode,
          btnText: "Mã hóa",
        },
        "url-decode": {
          name: "URL Decode",
          language: "text",
          processor: urlDecode,
          btnText: "Giải mã",
        },
      },
    },
  };

  // Tạo một đối tượng phẳng để dễ dàng truy cập thông tin công cụ
  const FLAT_TOOLS = Object.values(TOOL_CATEGORIES).reduce((acc, category) => {
    return { ...acc, ...category.tools };
  }, {});

  // --- KHỞI TẠO EDITOR VÀ DOM ---
  const toolSelect = document.getElementById("tool-select");
  const processBtn = document.getElementById("process-btn");
  const processBtnText = document.getElementById("process-btn-text");
  const copyBtn = document.getElementById("copy-output-btn");
  const clearBtn = document.getElementById("clear-btn");
  const statusBar = document.getElementById("status-bar");
  const jsonViewerEl = $("#json-viewer");

  const cmOptions = {
    lineNumbers: true,
    theme: "material-darker",
    lineWrapping: true,
    indentUnit: 4,
  };
  const inputEditor = CodeMirror.fromTextArea(
    document.getElementById("input-editor"),
    cmOptions
  );
  const outputEditor = CodeMirror.fromTextArea(
    document.getElementById("output-editor"),
    cmOptions
  );

  // --- CÁC HÀM XỬ LÝ (Không thay đổi) ---
  function formatJS(code) {
    return js_beautify(code, { indent_size: 2 });
  }
  async function minifyJS(code) {
    const r = await Terser.minify(code);
    if (r.error) throw r.error;
    return r.code;
  }
  function formatCSS(code) {
    return css_beautify(code, { indent_size: 2 });
  }
  function minifyCSS(code) {
    return code
      .replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]/g, "")
      .replace(/ {2,}/g, " ")
      .replace(/ ([{:;}]) /g, "$1")
      .replace(/([{:;}]) /g, "$1")
      .replace(/(:) /g, ":");
  }
  function formatHTML(code) {
    return html_beautify(code, { indent_size: 2 });
  }
  function minifyHTML(code) {
    return code
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/>\s+</g, "><")
      .trim();
  }
  function formatSQL(code) {
    return sqlFormatter.format(code, { language: "sql", tabWidth: 2 });
  }
  function validateAndShowJSON(code) {
    const data = JSON.parse(code);
    jsonViewerEl.jsonViewer(data, { collapsed: false, withQuotes: true });
    return `✅ JSON hợp lệ. Xem kết quả dạng cây.`;
  }
  function base64Encode(text) {
    return btoa(unescape(encodeURIComponent(text)));
  }
  function base64Decode(text) {
    return decodeURIComponent(escape(atob(text)));
  }
  function urlEncode(text) {
    return encodeURIComponent(text);
  }
  function urlDecode(text) {
    return decodeURIComponent(text);
  }

  // --- LOGIC CHÍNH ---

  // ** CẬP NHẬT HÀM NÀY **
  function populateTools() {
    toolSelect.innerHTML = ""; // Xóa các option cũ
    for (const categoryKey in TOOL_CATEGORIES) {
      const category = TOOL_CATEGORIES[categoryKey];
      const optgroup = document.createElement("optgroup");
      optgroup.label = category.name;

      for (const toolKey in category.tools) {
        const tool = category.tools[toolKey];
        const option = document.createElement("option");
        option.value = toolKey;
        option.textContent = tool.name;
        optgroup.appendChild(option);
      }
      toolSelect.appendChild(optgroup);
    }
  }

  function updateToolUI(tool) {
    if (!tool) return; // Bảo vệ nếu không tìm thấy tool
    inputEditor.setOption("mode", tool.language);
    outputEditor.setOption("mode", tool.language);
    processBtnText.textContent = `${tool.btnText} `;
    $("#output-wrapper .CodeMirror").toggle(
      tool.processor !== validateAndShowJSON
    );
    jsonViewerEl.toggle(tool.processor === validateAndShowJSON);
  }

  async function processCode() {
    const selectedToolKey = toolSelect.value;
    const tool = FLAT_TOOLS[selectedToolKey]; // ** SỬ DỤNG FLAT_TOOLS **
    const inputCode = inputEditor.getValue();
    if (!inputCode) {
      updateStatus("Đầu vào trống!", "error");
      return;
    }
    try {
      updateStatus("Đang xử lý...", "processing");
      const result = await tool.processor(inputCode);
      if (tool.processor !== validateAndShowJSON) {
        outputEditor.setValue(result);
      }
      updateStatus("Hoàn thành!", "success");
    } catch (error) {
      outputEditor.setValue(`Lỗi: ${error.message}`);
      updateStatus(`Lỗi: ${error.message}`, "error");
    }
  }

  function updateStatus(message, type) {
    statusBar.textContent = message;
    statusBar.className = `status-bar ${type}`;
  }

  // --- GẮN SỰ KIỆN ---
  toolSelect.addEventListener("change", () => {
    const tool = FLAT_TOOLS[toolSelect.value]; // ** SỬ DỤNG FLAT_TOOLS **
    updateToolUI(tool);
    inputEditor.setValue("");
    outputEditor.setValue("");
    jsonViewerEl.html("");
    updateStatus("Sẵn sàng", "");
  });

  processBtn.addEventListener("click", processCode);

  copyBtn.addEventListener("click", () => {
    const tool = FLAT_TOOLS[toolSelect.value]; // ** SỬ DỤNG FLAT_TOOLS **
    const textToCopy =
      tool.processor === validateAndShowJSON
        ? inputEditor.getValue()
        : outputEditor.getValue();
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      updateStatus("Đã sao chép vào clipboard!", "success");
    }
  });

  clearBtn.addEventListener("click", () => {
    inputEditor.setValue("");
    outputEditor.setValue("");
    jsonViewerEl.html("");
    updateStatus("Đã xóa nội dung", "");
  });

  // --- KHỞI TẠO ---
  populateTools();
  updateToolUI(FLAT_TOOLS[toolSelect.value]); // ** SỬ DỤNG FLAT_TOOLS **
  updateStatus("Sẵn sàng", "");
});
