// email_sender_logic.js
document.addEventListener("DOMContentLoaded", () => {
  // === DOM References ===
  const emailForm = document.getElementById("email-form");
  const sendBtn = document.getElementById("send-btn");
  const statusPanel = document.getElementById("status-panel");
  const htmlFileInput = document.getElementById("html-file");
  const htmlContentTextarea = document.getElementById("html-content");
  const htmlStatus = document.getElementById("html-status");
  const fileNameDisplay = document.getElementById("file-name");

  // === UI HELPER FUNCTIONS ===
  const showStatus = (message, type = "processing") => {
    statusPanel.textContent = message;
    statusPanel.className = `status-bar ${type}`; // success, error, processing
    statusPanel.style.display = "block";
  };

  const hideStatus = () => {
    statusPanel.style.display = "none";
  };

  // === DYNAMIC EMAIL LIST LOGIC ===
  const createEmailInput = (container, isFirst = false) => {
    const group = document.createElement("div");
    group.className = "email-input-group";

    const input = document.createElement("input");
    input.type = "email";
    input.placeholder = "example@email.com";
    group.appendChild(input);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "icon-btn add";
    addButton.innerHTML =
      '<span class="material-symbols-outlined">add_circle</span>';
    addButton.title = "Thêm email khác";
    addButton.onclick = () => {
      createEmailInput(container);
      addButton.style.display = "none"; // Hide current add button
    };
    group.appendChild(addButton);

    if (!isFirst) {
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "icon-btn remove";
      removeButton.innerHTML =
        '<span class="material-symbols-outlined">remove_circle</span>';
      removeButton.title = "Xóa email này";
      removeButton.onclick = () => {
        // Find the previous add button and show it
        const prevGroup = group.previousElementSibling;
        if (prevGroup) {
          prevGroup.querySelector(".icon-btn.add").style.display =
            "inline-flex";
        }
        group.remove();
      };
      group.appendChild(removeButton);
    }

    container.appendChild(group);
    input.focus();
  };

  const getEmailsFromContainer = (containerId) => {
    const container = document.getElementById(containerId);
    return Array.from(container.querySelectorAll('input[type="email"]'))
      .map((input) => input.value.trim())
      .filter((email) => email !== ""); // Filter out empty strings
  };

  // Initialize email lists
  ["to-list", "cc-list", "bcc-list"].forEach((id) => {
    const container = document.getElementById(id);
    createEmailInput(container, true);
  });

  // === FILE HANDLING ===
  htmlFileInput.addEventListener("change", () => {
    const file = htmlFileInput.files[0];
    if (!file) {
      fileNameDisplay.textContent = "Chưa có tệp nào được chọn";
      htmlContentTextarea.value = "";
      updateHtmlStatus(false);
      return;
    }

    fileNameDisplay.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      htmlContentTextarea.value = e.target.result;
      updateHtmlStatus(true, "Nội dung HTML đã sẵn sàng.");
    };
    reader.onerror = () => {
      updateHtmlStatus(false, "Lỗi khi đọc tệp.");
    };
    reader.readAsText(file);
  });

  const updateHtmlStatus = (isReady, message = "") => {
    htmlStatus.innerHTML = `<span class="material-symbols-outlined">${
      isReady ? "check_circle" : "warning"
    }</span> ${message || (isReady ? "" : "Chưa có nội dung HTML.")}`;
    htmlStatus.className = `note ${isReady ? "success" : "error"}`;
  };

  // === FORM SUBMISSION (AJAX) ===
  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Basic validation
    if (!emailForm.checkValidity() || getEmailsFromContainer("to-list").length === 0) {
      showStatus("Vui lòng điền đầy đủ các trường bắt buộc, bao gồm ít nhất một email người nhận (TO).", "error");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = `
      <span class="material-symbols-outlined spin" style="margin-right: 8px">autorenew</span>
      Đang gửi...`;
    showStatus("Đang thực hiện gửi mail, vui lòng chờ...", "processing");

    const formData = new FormData();
    formData.append("smtp_user", document.getElementById("smtp-user").value);
    formData.append("smtp_pass", document.getElementById("smtp-pass").value);
    formData.append("subject", document.getElementById("subject").value);
    formData.append("html_content", htmlContentTextarea.value);
    
    // Append email lists as comma-separated strings
    formData.append("to_email", getEmailsFromContainer("to-list").join(","));
    formData.append("cc_email", getEmailsFromContainer("cc-list").join(","));
    formData.append("bcc_email", getEmailsFromContainer("bcc-list").join(","));

    try {
      const response = await fetch("send.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showStatus(result.message, "success");
      } else {
        showStatus(result.message, "error");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      showStatus("Lỗi kết nối hoặc máy chủ. Vui lòng kiểm tra console.", "error");
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = `
        <span class="material-symbols-outlined" style="margin-right: 8px">send</span>
        Gửi Email`;
    }
  });
});