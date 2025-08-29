document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Lấy tham chiếu DOM ---
  const sexInputs = document.querySelectorAll('input[name="sex"]');
  const ageInput = document.getElementById("age");
  const heightInput = document.getElementById("height");
  const weightInput = document.getElementById("weight");
  const neckInput = document.getElementById("neck");
  const waistInput = document.getElementById("waist");
  const hipInput = document.getElementById("hip");
  const activityLevelSelect = document.getElementById("activity-level");
  const goalTypeSelect = document.getElementById("goal-type");

  const bmiValueEl = document.getElementById("bmi-value");
  const bmiCategoryEl = document.getElementById("bmi-category");
  const bmiMarkerEl = document.getElementById("bmi-marker");

  const bfpValueEl = document.getElementById("bfp-value");
  const bfpCategoryEl = document.getElementById("bfp-category");

  const bmrValueEl = document.getElementById("bmr-value");
  const tdeeValueEl = document.getElementById("tdee-value");
  const tdeeMaintainEl = document.getElementById("tdee-maintain");
  const tdeeLossEl = document.getElementById("tdee-loss");
  const tdeeGainEl = document.getElementById("tdee-gain");

  const carbGEl = document.getElementById("carb-g");
  const proteinGEl = document.getElementById("protein-g");
  const fatGEl = document.getElementById("fat-g");
  const macrosSummaryEl = document.getElementById("macros-summary");

  const waterIntakeValueEl = document.getElementById("water-intake-value");
  const waterIntakeRecEl = document.getElementById(
    "water-intake-recommendation"
  );

  const idealWeightValueEl = document.getElementById("ideal-weight-value");
  const whrValueEl = document.getElementById("whr-value");
  const whrRiskEl = document.getElementById("whr-risk");
  const whtrValueEl = document.getElementById("whtr-value");
  const whtrRiskEl = document.getElementById("whtr-risk");
  const piValueEl = document.getElementById("pi-value");
  const piCategoryEl = document.getElementById("pi-category");

  // ** DÒNG "const femaleOnlyDiv" ĐÃ ĐƯỢC XÓA TẠI ĐÂY **

  // --- 2. Hàm tính toán chính ---
  function calculateAll() {
    const sex = document.querySelector('input[name="sex"]:checked').value;
    const age = parseFloat(ageInput.value);
    const height = parseFloat(heightInput.value); // cm
    const weight = parseFloat(weightInput.value); // kg
    const neck = parseFloat(neckInput.value); // cm
    const waist = parseFloat(waistInput.value); // cm
    const hip = parseFloat(hipInput.value); // cm
    const activityFactor = parseFloat(activityLevelSelect.value);
    const goalType = goalTypeSelect.value;

    // ** DÒNG "femaleOnlyDiv.style.display" ĐÃ ĐƯỢC XÓA TẠI ĐÂY **

    // --- Các giá trị mặc định cho trường hợp NaN ---
    const safeAge = isNaN(age) || age <= 0 ? 30 : age;
    const safeHeight = isNaN(height) || height <= 0 ? 170 : height;
    const safeWeight = isNaN(weight) || weight <= 0 ? 60 : weight;

    // --- BMI ---
    let bmi = NaN;
    if (safeHeight > 0 && safeWeight > 0) {
      bmi = safeWeight / Math.pow(safeHeight / 100, 2);
    }
    updateBmiUI(bmi);

    // --- BFP ---
    let bfp = NaN;
    if (safeHeight > 0 && neck > 0 && waist > 0) {
      if (sex === "male") {
        bfp =
          495 /
            (1.0324 -
              0.19077 * Math.log10(waist - neck) +
              0.15456 * Math.log10(safeHeight)) -
          450;
      } else if (sex === "female" && hip > 0) {
        // Công thức BFP nữ vẫn cần hip > 0
        bfp =
          495 /
            (1.29579 -
              0.35004 * Math.log10(waist + hip - neck) +
              0.221 * Math.log10(safeHeight)) -
          450;
      }
    }
    updateBfpUI(bfp, sex, hip);

    // --- BMR & TDEE ---
    let bmr = NaN;
    if (safeWeight > 0 && safeHeight > 0 && safeAge > 0) {
      bmr =
        10 * safeWeight +
        6.25 * safeHeight -
        5 * safeAge +
        (sex === "male" ? 5 : -161);
    }
    const tdee = bmr * activityFactor;
    updateCaloriesUI(bmr, tdee);

    // --- Macros ---
    updateMacrosUI(tdee, goalType);

    // --- Water Intake ---
    updateWaterIntakeUI(safeWeight, activityFactor);

    // --- Other Metrics ---
    // Ideal Weight (BMI method)
    const idealBmiLower = 18.5;
    const idealBmiUpper = 24.9;
    const idealWeightLower = idealBmiLower * Math.pow(safeHeight / 100, 2);
    const idealWeightUpper = idealBmiUpper * Math.pow(safeHeight / 100, 2);

    // WHR
    let whr = NaN;
    if (waist > 0 && hip > 0) {
      whr = waist / hip;
    }

    // WHtR
    let whtr = NaN;
    if (waist > 0 && safeHeight > 0) {
      whtr = waist / safeHeight;
    }

    // Ponderal Index
    let pi = NaN;
    if (safeWeight > 0 && safeHeight > 0) {
      pi = safeWeight / Math.pow(safeHeight / 100, 3); // kg / m^3
    }
    updateOtherMetricsUI(
      idealWeightLower,
      idealWeightUpper,
      whr,
      whtr,
      pi,
      sex
    );
  }

  // --- 3. Hàm cập nhật UI cho từng chỉ số ---

  function updateBmiUI(bmi) {
    if (isNaN(bmi)) {
      bmiValueEl.textContent = "...";
      bmiCategoryEl.textContent = "Vui lòng nhập chiều cao và cân nặng.";
      bmiMarkerEl.style.left = "0%";
      return;
    }
    bmiValueEl.textContent = bmi.toFixed(1);

    let category = "Không xác định",
      markerPos = 0;
    if (bmi < 18.5) {
      category = "Gầy";
      markerPos = (bmi / 18.5) * 25;
    } else if (bmi < 25) {
      category = "Bình thường";
      markerPos = 25 + ((bmi - 18.5) / 6.5) * 25;
    } else if (bmi < 30) {
      category = "Thừa cân";
      markerPos = 50 + ((bmi - 25) / 5) * 25;
    } else {
      category = "Béo phì";
      markerPos = 75 + ((bmi - 30) / 10) * 25;
    }

    bmiCategoryEl.textContent = `Phân loại: ${category}`;
    bmiMarkerEl.style.left = `${Math.min(100, Math.max(0, markerPos))}%`;
  }

  // Sửa lại hàm updateBfpUI để xử lý trường hợp nam và nữ rõ ràng hơn
  function updateBfpUI(bfp, sex, hip) {
    if (sex === "female" && (isNaN(hip) || hip <= 0)) {
      bfpValueEl.textContent = "...";
      bfpCategoryEl.textContent = "Nữ giới cần nhập số đo hông để tính BFP.";
      return;
    }

    if (isNaN(bfp)) {
      bfpValueEl.textContent = "...";
      bfpCategoryEl.textContent = "Vui lòng nhập đủ các số đo.";
      return;
    }
    bfpValueEl.textContent = `${bfp.toFixed(1)}%`;
    bfpCategoryEl.textContent = "";
  }

  function updateCaloriesUI(bmr, tdee) {
    if (isNaN(bmr) || isNaN(tdee)) {
      bmrValueEl.textContent = "...";
      tdeeValueEl.textContent = "...";
      tdeeMaintainEl.textContent = "...";
      tdeeLossEl.textContent = "...";
      tdeeGainEl.textContent = "...";
      return;
    }
    bmrValueEl.textContent = bmr.toFixed(0);
    tdeeValueEl.textContent = `${tdee.toFixed(0)} Kcal/ngày`;
    tdeeMaintainEl.textContent = `${tdee.toFixed(0)} Kcal`;
    tdeeLossEl.textContent = `${(tdee - 500).toFixed(0)} Kcal`;
    tdeeGainEl.textContent = `${(tdee + 500).toFixed(0)} Kcal`;
  }

  function updateMacrosUI(tdee, goalType) {
    if (isNaN(tdee) || tdee <= 0) {
      macrosSummaryEl.textContent = "...";
      carbGEl.textContent = "... g";
      proteinGEl.textContent = "... g";
      fatGEl.textContent = "... g";
      return;
    }

    let targetTDEE = tdee;
    if (goalType === "loss") targetTDEE = tdee - 500;
    else if (goalType === "gain") targetTDEE = tdee + 500;

    targetTDEE = Math.max(1200, targetTDEE);

    const carbPercent = 0.5;
    const proteinPercent = 0.25;
    const fatPercent = 0.25;

    const carbKcal = targetTDEE * carbPercent;
    const proteinKcal = targetTDEE * proteinPercent;
    const fatKcal = targetTDEE * fatPercent;

    const carbG = carbKcal / 4;
    const proteinG = proteinKcal / 4;
    const fatG = fatKcal / 9;

    macrosSummaryEl.textContent = `${targetTDEE.toFixed(0)} Kcal`;
    carbGEl.textContent = `${carbG.toFixed(0)} g`;
    proteinGEl.textContent = `${proteinG.toFixed(0)} g`;
    fatGEl.textContent = `${fatG.toFixed(0)} g`;
  }

  function updateWaterIntakeUI(weightKg, activityFactor) {
    if (isNaN(weightKg) || weightKg <= 0) {
      waterIntakeValueEl.textContent = "...";
      waterIntakeRecEl.textContent = "Vui lòng nhập cân nặng.";
      return;
    }

    let baseWater = (weightKg * 30) / 1000;
    const additionalWaterFactor = (activityFactor - 1.2) * (0.3 / (1.9 - 1.2));
    const totalWater = baseWater * (1 + additionalWaterFactor);

    waterIntakeValueEl.textContent = `${totalWater.toFixed(1)}`;
    waterIntakeRecEl.textContent = `Đây là ước tính. Hãy uống nhiều hơn nếu bạn hoạt động thể chất hoặc thời tiết nóng.`;
  }

  function updateOtherMetricsUI(idealLower, idealUpper, whr, whtr, pi, sex) {
    if (!isNaN(idealLower) && !isNaN(idealUpper)) {
      idealWeightValueEl.textContent = `${idealLower.toFixed(
        1
      )}kg - ${idealUpper.toFixed(1)}kg`;
    } else {
      idealWeightValueEl.textContent = "...";
    }

    if (!isNaN(whr)) {
      whrValueEl.textContent = whr.toFixed(2);
      let risk = "Không xác định";
      const maleLowRisk = 0.95;
      const maleHighRisk = 1.0;
      const femaleLowRisk = 0.8;
      const femaleHighRisk = 0.85;

      if (sex === "male") {
        if (whr <= maleLowRisk) risk = "Rủi ro thấp";
        else if (whr < maleHighRisk) risk = "Rủi ro trung bình";
        else risk = "Rủi ro cao";
      } else {
        if (whr <= femaleLowRisk) risk = "Rủi ro thấp";
        else if (whr < femaleHighRisk) risk = "Rủi ro trung bình";
        else risk = "Rủi ro cao";
      }
      whrRiskEl.textContent = `(${risk})`;
    } else {
      whrValueEl.textContent = "...";
      whrRiskEl.textContent = "(Cần số đo eo & hông)";
    }

    if (!isNaN(whtr)) {
      whtrValueEl.textContent = whtr.toFixed(2);
      let whtrRisk = "Không xác định";
      if (whtr < 0.4) whtrRisk = "Thiếu cân";
      else if (whtr < 0.5) whtrRisk = "Bình thường";
      else if (whtr < 0.6) whtrRisk = "Thừa cân";
      else whtrRisk = "Béo phì";
      whtrRiskEl.textContent = `(${whtrRisk})`;
    } else {
      whtrValueEl.textContent = "...";
      whtrRiskEl.textContent = "(Cần số đo eo & chiều cao)";
    }

    if (!isNaN(pi)) {
      piValueEl.textContent = pi.toFixed(2);
      let piCategory = "";
      if (pi < 8) piCategory = "Rất gầy";
      else if (pi < 11) piCategory = "Gầy";
      else if (pi < 15) piCategory = "Bình thường";
      else if (pi < 18) piCategory = "Thừa cân";
      else piCategory = "Béo phì";
      piCategoryEl.textContent = `(${piCategory})`;
    } else {
      piValueEl.textContent = "...";
      piCategoryEl.textContent = "(Cần cân nặng & chiều cao)";
    }
  }

  // --- 4. Gắn sự kiện & Khởi tạo ---
  const allInputs = [
    ...sexInputs,
    ageInput,
    heightInput,
    weightInput,
    neckInput,
    waistInput,
    hipInput,
    activityLevelSelect,
    goalTypeSelect,
  ];
  allInputs.forEach((input) => input.addEventListener("input", calculateAll));

  calculateAll();
});
