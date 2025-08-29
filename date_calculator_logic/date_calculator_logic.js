document.addEventListener("DOMContentLoaded", () => {
  // --- Lấy tham chiếu các phần tử DOM ---
  // Tab Đếm Ngày
  const startDateEl = document.getElementById("start-date");
  const endDateEl = document.getElementById("end-date");
  const durationResultEl = document.getElementById("duration-result");
  const durationDaysTotalEl = document.getElementById("duration-days-total");

  // Tab Cộng/Trừ Ngày
  const baseDateEl = document.getElementById("base-date");
  const yearsInput = document.getElementById("years");
  const monthsInput = document.getElementById("months");
  const daysInput = document.getElementById("days");
  const addSubtractResultEl = document.getElementById("add-subtract-result");

  // Tab Tính Tuổi
  const birthDateEl = document.getElementById("birth-date");
  const ageResultEl = document.getElementById("age-result");
  const zodiacSignEl = document.getElementById("zodiac-sign");
  const chineseZodiacEl = document.getElementById("chinese-zodiac");
  const nextBirthdayEl = document.getElementById("next-birthday");

  // Tab Đếm ngược
  const eventNameEl = document.getElementById("event-name");
  const eventDateEl = document.getElementById("event-date");
  let countdownInterval;

  // --- CÁC HÀM TÍNH TOÁN ---

  function calculateDuration() {
    // ... Giữ nguyên hàm này ...
    if (!startDateEl.value || !endDateEl.value) {
      durationResultEl.textContent = "...";
      durationDaysTotalEl.textContent = "Vui lòng chọn cả hai ngày.";
      return;
    }
    let start = new Date(startDateEl.value);
    let end = new Date(endDateEl.value);
    if (start > end) {
      [start, end] = [end, start];
    }
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    durationDaysTotalEl.textContent = `Tổng cộng: ${diffDays.toLocaleString(
      "vi-VN"
    )} ngày`;
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    if (days < 0) {
      months--;
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    durationResultEl.textContent = `${years} năm, ${months} tháng, và ${days} ngày`;
  }

  function calculateAddSubtract() {
    // ... Giữ nguyên hàm này ...
    if (!baseDateEl.value) {
      addSubtractResultEl.textContent = "Vui lòng chọn ngày bắt đầu.";
      return;
    }
    const baseDate = new Date(baseDateEl.value);
    const years = parseInt(yearsInput.value) || 0;
    const months = parseInt(monthsInput.value) || 0;
    const days = parseInt(daysInput.value) || 0;
    baseDate.setFullYear(baseDate.getFullYear() + years);
    baseDate.setMonth(baseDate.getMonth() + months);
    baseDate.setDate(baseDate.getDate() + days);
    addSubtractResultEl.textContent = baseDate.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // MỚI: Hàm tính tuổi và các thông tin liên quan
  function calculateAge() {
    if (!birthDateEl.value) {
      ageResultEl.textContent = "Vui lòng chọn ngày sinh.";
      return;
    }
    const birthDate = new Date(birthDateEl.value);
    const today = new Date();

    // Tính tuổi
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    ageResultEl.textContent = `${years} tuổi, ${months} tháng, ${days} ngày`;

    // Tính Cung Hoàng Đạo
    const day = birthDate.getDate();
    const month = birthDate.getMonth() + 1;
    const zodiacs = [
      "Ma Kết",
      "Bảo Bình",
      "Song Ngư",
      "Bạch Dương",
      "Kim Ngưu",
      "Song Tử",
      "Cự Giải",
      "Sư Tử",
      "Xử Nữ",
      "Thiên Bình",
      "Bọ Cạp",
      "Nhân Mã",
      "Ma Kết",
    ];
    const last_day = [19, 18, 20, 19, 20, 20, 22, 22, 22, 22, 21, 21, 19];
    zodiacSignEl.textContent =
      day > last_day[month - 1] ? zodiacs[month] : zodiacs[month - 1];

    // Tính Con Giáp
    const chineseZodiacs = [
      "Tý",
      "Sửu",
      "Dần",
      "Mão",
      "Thìn",
      "Tỵ",
      "Ngọ",
      "Mùi",
      "Thân",
      "Dậu",
      "Tuất",
      "Hợi",
    ];
    chineseZodiacEl.textContent =
      chineseZodiacs[(birthDate.getFullYear() - 4) % 12];

    // Đếm ngược sinh nhật
    let nextBday = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );
    if (nextBday < today) {
      nextBday.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = nextBday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    nextBirthdayEl.textContent = `Còn ${diffDays} ngày`;
  }

  // MỚI: Hàm đếm ngược
  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    if (!eventDateEl.value) {
      document.getElementById("countdown-display").style.display = "none";
      return;
    }
    document.getElementById("countdown-display").style.display = "flex";

    const targetDate = new Date(eventDateEl.value).getTime();

    countdownInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(countdownInterval);
        document.getElementById(
          "countdown-display"
        ).innerHTML = `<p class="result-text">Sự kiện đã diễn ra!</p>`;
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      document.getElementById("cd-days").textContent = String(days).padStart(
        2,
        "0"
      );
      document.getElementById("cd-hours").textContent = String(hours).padStart(
        2,
        "0"
      );
      document.getElementById("cd-minutes").textContent = String(
        minutes
      ).padStart(2, "0");
      document.getElementById("cd-seconds").textContent = String(
        seconds
      ).padStart(2, "0");
    }, 1000);
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

      if (button.dataset.tab === "countdown") startCountdown();
      else if (countdownInterval) clearInterval(countdownInterval);
    });
  });

  // --- KHỞI TẠO VÀ GẮN SỰ KIỆN ---
  const today = new Date().toISOString().split("T")[0];
  startDateEl.value = today;
  endDateEl.value = today;
  baseDateEl.value = today;
  birthDateEl.value = "2000-01-01";
  eventDateEl.value = new Date(new Date().getFullYear() + 1, 0, 1)
    .toISOString()
    .split("T")[0];

  [startDateEl, endDateEl].forEach((el) =>
    el.addEventListener("change", calculateDuration)
  );
  [baseDateEl, yearsInput, monthsInput, daysInput].forEach((el) =>
    el.addEventListener("input", calculateAddSubtract)
  );
  birthDateEl.addEventListener("change", calculateAge);
  [eventDateEl, eventNameEl].forEach((el) =>
    el.addEventListener("input", startCountdown)
  );

  calculateDuration();
  calculateAddSubtract();
  calculateAge();
});
