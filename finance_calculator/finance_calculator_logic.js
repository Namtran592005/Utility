document.addEventListener("DOMContentLoaded", () => {
  // --- BIẾN TOÀN CỤC VÀ KHỞI TẠO ---
  let compoundChartInstance, loanChartInstance;
  const allInputs = document.querySelectorAll(".tab-content input");

  // --- CÁC HÀM TIỆN ÍCH ---
  const numberFormatter = new Intl.NumberFormat("vi-VN");

  function parseFormattedNumber(str) {
    return parseFloat(String(str).replace(/[,.]/g, "")) || 0;
  }

  function formatCurrency(num) {
    return `${numberFormatter.format(num.toFixed(0))} VND`;
  }

  function formatInputAsCurrency(inputElement) {
    const value = parseFormattedNumber(inputElement.value);
    inputElement.value = numberFormatter.format(value);
  }

  // --- CÁC HÀM TÍNH TOÁN CHÍNH ---

  // 1. Tính Lãi Kép
  function calculateCompoundInterest() {
    const P = parseFormattedNumber(
      document.getElementById("cp-principal").value
    );
    const PMT = parseFormattedNumber(
      document.getElementById("cp-contribution").value
    );
    const r = parseFloat(document.getElementById("cp-rate").value) / 100;
    const t = parseInt(document.getElementById("cp-time").value);

    if (isNaN(r) || isNaN(t) || t <= 0) return;

    const n = 12; // Lãi kép hàng tháng
    const monthlyRate = r / n;
    const totalMonths = t * n;

    const futureValuePrincipal = P * Math.pow(1 + monthlyRate, totalMonths);
    const futureValueContributions =
      PMT * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    const totalBalance = futureValuePrincipal + futureValueContributions;

    const totalPrincipal = P + PMT * totalMonths;
    const totalInterest = totalBalance - totalPrincipal;

    document.getElementById("cp-total-balance").textContent =
      formatCurrency(totalBalance);
    document.getElementById("cp-total-principal").textContent =
      formatCurrency(totalPrincipal);
    document.getElementById("cp-total-interest").textContent =
      formatCurrency(totalInterest);

    updateCompoundChart(P, PMT, r, t);
  }

  // 2. Tính Kế hoạch Tiết kiệm
  function calculateSavingsPlan() {
    const FV = parseFormattedNumber(document.getElementById("sg-goal").value);
    const t = parseInt(document.getElementById("sg-time").value);
    const r = parseFloat(document.getElementById("sg-rate").value) / 100;

    if (isNaN(FV) || isNaN(t) || isNaN(r) || t <= 0) return;

    const n = 12;
    const monthlyRate = r / n;
    const totalMonths = t * n;

    const monthlyContribution =
      FV / ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);

    document.getElementById("sg-result").textContent =
      formatCurrency(monthlyContribution);
  }

  // 3. Tính Khoản vay
  function calculateLoan() {
    const P = parseFormattedNumber(document.getElementById("ln-amount").value);
    const r = parseFloat(document.getElementById("ln-rate").value) / 100;
    const t = parseInt(document.getElementById("ln-term").value);

    if (isNaN(P) || isNaN(r) || isNaN(t) || t <= 0 || P <= 0) return;

    const n = 12;
    const monthlyRate = r / n;
    const totalPayments = t * n;

    const monthlyPayment =
      (P * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const totalPayment = monthlyPayment * totalPayments;
    const totalInterest = totalPayment - P;

    document.getElementById("ln-monthly-payment").textContent =
      formatCurrency(monthlyPayment);
    document.getElementById("ln-total-payment").textContent =
      formatCurrency(totalPayment);
    document.getElementById("ln-total-interest").textContent =
      formatCurrency(totalInterest);

    updateLoanChart(P, totalInterest);
  }

  // --- CÁC HÀM CẬP NHẬT BIỂU ĐỒ ---
  function updateCompoundChart(P, PMT, r, t) {
    const years = Array.from({ length: t + 1 }, (_, i) => i);
    const data = years.map((year) => {
      const totalMonths = year * 12;
      const monthlyRate = r / 12;
      const fvP = P * Math.pow(1 + monthlyRate, totalMonths);
      const fvPMT =
        PMT * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
      return fvP + fvPMT;
    });

    const ctx = document.getElementById("compoundChart").getContext("2d");
    if (compoundChartInstance) compoundChartInstance.destroy();
    compoundChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: years.map((y) => `Năm ${y}`),
        datasets: [
          {
            label: "Tổng số dư",
            data: data,
            borderColor: "var(--primary-color)",
            backgroundColor: "rgba(13, 110, 253, 0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
    });
  }

  function updateLoanChart(principal, interest) {
    const ctx = document.getElementById("loanChart").getContext("2d");
    if (loanChartInstance) loanChartInstance.destroy();

    // Lấy giá trị màu từ CSS, nếu không có thì dùng màu mặc định an toàn
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor =
      rootStyles.getPropertyValue("--primary-color").trim() || "#0d6efd";
    const dangerColor =
      rootStyles.getPropertyValue("--danger-color").trim() || "#dc3545";
    const surfaceColor =
      rootStyles.getPropertyValue("--surface-color").trim() || "#ffffff";

    loanChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Vốn gốc", "Tổng lãi"],
        datasets: [
          {
            data: [principal, interest],
            // SỬA LẠI: Dùng giá trị màu hex trực tiếp
            backgroundColor: [primaryColor, dangerColor],
            borderColor: surfaceColor,
            borderWidth: 4,
            hoverOffset: 8, // Thêm hiệu ứng khi di chuột
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top", // Hiển thị chú thích ở trên
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed !== null) {
                  // Sử dụng lại hàm formatCurrency để tooltip hiển thị đẹp hơn
                  label += formatCurrency(context.parsed);
                }
                return label;
              },
            },
          },
        },
      },
    });
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

      // Tính toán lại cho tab mới
      runCalculationsForActiveTab();
    });
  });

  function runCalculationsForActiveTab() {
    const activeTabId = document.querySelector(".tab-content.active").id;
    if (activeTabId === "tab-compound") calculateCompoundInterest();
    else if (activeTabId === "tab-savings") calculateSavingsPlan();
    else if (activeTabId === "tab-loan") calculateLoan();
  }

  // --- GẮN SỰ KIỆN ---
  allInputs.forEach((input) => {
    input.addEventListener("input", runCalculationsForActiveTab);
    if (input.type === "text") {
      input.addEventListener("blur", () => formatInputAsCurrency(input)); // Format khi rời khỏi ô
    }
  });

  // --- KHỞI CHẠY ---
  document
    .querySelectorAll('input[type="text"]')
    .forEach(formatInputAsCurrency);
  runCalculationsForActiveTab();
});
