document.addEventListener("DOMContentLoaded", () => {
  // --- CẤU TRÚC DỮ LIỆU ĐƠN VỊ ---
  const CONVERSION_CATEGORIES = {
    currency: {
      name: "💰 Tiền tệ (Tỷ giá tham khảo)",
      isCurrency: true,
      baseUnit: "USD", // Dùng USD làm đơn vị cơ sở để tính toán
      units: {
        USD: { name: "Đô la Mỹ", rate: 1 },
        VND: { name: "Việt Nam Đồng", rate: 26450 },
        EUR: { name: "Euro", rate: 0.92 },
        JPY: { name: "Yên Nhật", rate: 157 },
        GBP: { name: "Bảng Anh", rate: 0.79 },
        AUD: { name: "Đô la Úc", rate: 1.51 },
        CAD: { name: "Đô la Canada", rate: 1.37 },
        CNY: { name: "Nhân dân tệ", rate: 7.25 },
        KRW: { name: "Won Hàn Quốc", rate: 1380 },
      },
    },
    length: {
      name: "📏 Chiều dài",
      baseUnit: "m",
      units: {
        m: { name: "Mét (m)", factor: 1 },
        km: { name: "Kilômét (km)", factor: 1000 },
        cm: { name: "Centimét (cm)", factor: 0.01 },
        mm: { name: "Milimét (mm)", factor: 0.001 },
        mi: { name: "Dặm (mi)", factor: 1609.34 },
        yd: { name: "Yard (yd)", factor: 0.9144 },
        ft: { name: "Feet (ft)", factor: 0.3048 },
        in: { name: "Inch (in)", factor: 0.0254 },
      },
    },
    area: {
      name: "🏞️ Diện tích",
      baseUnit: "m2",
      units: {
        m2: { name: "Mét vuông (m²)", factor: 1 },
        km2: { name: "Kilômét vuông (km²)", factor: 1e6 },
        ha: { name: "Hecta (ha)", factor: 10000 },
        acre: { name: "Mẫu Anh (acre)", factor: 4046.86 },
      },
    },
    volume: {
      name: "💧 Thể tích",
      baseUnit: "l",
      units: {
        l: { name: "Lít (l)", factor: 1 },
        ml: { name: "Mililít (ml)", factor: 0.001 },
        m3: { name: "Mét khối (m³)", factor: 1000 },
        gal_us: { name: "Gallon (US)", factor: 3.78541 },
      },
    },
    weight: {
      name: "⚖️ Khối lượng",
      baseUnit: "kg",
      units: {
        kg: { name: "Kilôgam (kg)", factor: 1 },
        g: { name: "Gam (g)", factor: 0.001 },
        t: { name: "Tấn (t)", factor: 1000 },
        lb: { name: "Pound (lb)", factor: 0.453592 },
        oz: { name: "Ounce (oz)", factor: 0.0283495 },
      },
    },
    speed: {
      name: "🚀 Tốc độ",
      baseUnit: "m/s",
      units: {
        "m/s": { name: "Mét/giây", factor: 1 },
        "km/h": { name: "Kilômét/giờ", factor: 1 / 3.6 },
        mph: { name: "Dặm/giờ", factor: 0.44704 },
        knot: { name: "Hải lý/giờ", factor: 0.514444 },
      },
    },
    data: {
      name: "💾 Lưu trữ Dữ liệu",
      baseUnit: "b",
      units: {
        b: { name: "Byte (B)", factor: 1 },
        kb: { name: "Kilobyte (KB)", factor: 1024 },
        mb: { name: "Megabyte (MB)", factor: Math.pow(1024, 2) },
        gb: { name: "Gigabyte (GB)", factor: Math.pow(1024, 3) },
        tb: { name: "Terabyte (TB)", factor: Math.pow(1024, 4) },
      },
    },
    temperature: {
      name: "🌡️ Nhiệt độ",
      units: {
        c: { name: "Độ C (°C)", toBase: (v) => v, fromBase: (v) => v },
        f: {
          name: "Độ F (°F)",
          toBase: (v) => ((v - 32) * 5) / 9,
          fromBase: (v) => (v * 9) / 5 + 32,
        },
        k: {
          name: "Độ K (K)",
          toBase: (v) => v - 273.15,
          fromBase: (v) => v + 273.15,
        },
      },
    },
  };

  // --- DOM ELEMENTS ---
  const categorySelect = document.getElementById("category");
  const inputA = document.getElementById("inputA");
  const selectA = document.getElementById("selectA");
  const inputB = document.getElementById("inputB");
  const selectB = document.getElementById("selectB");
  const swapBtn = document.getElementById("swap-btn");
  const flagA = document.getElementById("flag-A");
  const flagB = document.getElementById("flag-B");
  const rateInfoDisplay = document.getElementById("rate-info-display");

  // --- UI FUNCTIONS ---
  function populateCategories() {
    for (const key in CONVERSION_CATEGORIES) {
      categorySelect.innerHTML += `<option value="${key}">${CONVERSION_CATEGORIES[key].name}</option>`;
    }
  }

  function populateUnits() {
    const category = CONVERSION_CATEGORIES[categorySelect.value];
    const units = category.units;
    selectA.innerHTML = "";
    selectB.innerHTML = "";
    for (const key in units) {
      const option = `<option value="${key}">${key} - ${units[key].name}</option>`;
      selectA.innerHTML += option;
      selectB.innerHTML += option;
    }

    // Đặt giá trị mặc định cho tiền tệ
    if (category.isCurrency) {
      selectA.value = "USD";
      selectB.value = "VND";
    } else {
      selectA.selectedIndex = 0;
      selectB.selectedIndex = Object.keys(units).length > 1 ? 1 : 0;
    }

    toggleCurrencyUI(category.isCurrency);
    convert();
  }

  function toggleCurrencyUI(isCurrency) {
    document.getElementById("currency-info").style.display = isCurrency
      ? "block"
      : "none";
    document.getElementById("quick-conversion-table-container").style.display =
      isCurrency ? "block" : "none";
    flagA.style.display = isCurrency ? "inline" : "none";
    flagB.style.display = isCurrency ? "inline" : "none";
    updateFlags();
  }

  function updateFlags() {
    if (CONVERSION_CATEGORIES[categorySelect.value].isCurrency) {
      flagA.src = `https://flagsapi.com/${selectA.value.substring(
        0,
        2
      )}/flat/32.png`;
      flagB.src = `https://flagsapi.com/${selectB.value.substring(
        0,
        2
      )}/flat/32.png`;
    }
  }

  // --- CORE CONVERSION LOGIC ---
  const numberFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 10,
  });
  function formatNumber(numStr) {
    const cleanedStr = String(numStr).replace(/,/g, "");
    if (cleanedStr === "" || isNaN(cleanedStr)) return "";
    return numberFormatter.format(parseFloat(cleanedStr));
  }
  function parseFormattedNumber(formattedStr) {
    return parseFloat(String(formattedStr).replace(/,/g, ""));
  }

  function convert() {
    const category = CONVERSION_CATEGORIES[categorySelect.value];
    const fromUnit = selectA.value;
    const toUnit = selectB.value;
    const value = parseFormattedNumber(inputA.value);

    if (isNaN(value)) {
      inputB.value = "";
      return;
    }

    let result;
    if (category.isCurrency) {
      const fromRate = category.units[fromUnit].rate;
      const toRate = category.units[toUnit].rate;
      const valueInBase = value / fromRate; // Chuyển về USD
      result = valueInBase * toRate;
    } else if (category.baseUnit) {
      const fromFactor = category.units[fromUnit].factor;
      const toFactor = category.units[toUnit].factor;
      const valueInBase = value * fromFactor;
      result = valueInBase / toFactor;
    } else {
      // Special case like Temperature
      result = category.units[toUnit].fromBase(
        category.units[fromUnit].toBase(value)
      );
    }

    inputB.value = formatNumber(result);

    // Update rate info for currency
    if (category.isCurrency) {
      const rate = category.units[toUnit].rate / category.units[fromUnit].rate;
      rateInfoDisplay.textContent = `1 ${fromUnit} = ${rate.toLocaleString(
        "en-US",
        { maximumFractionDigits: 4 }
      )} ${toUnit}`;
      updateQuickConversionTable();
    }
  }

  function updateQuickConversionTable() {
    const tableBody = document.querySelector("#quick-conversion-table tbody");
    tableBody.innerHTML = "";
    const baseUnit = selectA.value;
    const category = CONVERSION_CATEGORIES.currency;
    const units = category.units;
    const baseRate = units[baseUnit].rate;

    for (const unit in units) {
      if (unit !== baseUnit) {
        const rate = units[unit].rate / baseRate;
        tableBody.innerHTML += `<tr><td>1 ${unit}</td><td>${(
          1 / rate
        ).toLocaleString("en-US", {
          maximumFractionDigits: 4,
        })} ${baseUnit}</td></tr>`;
      }
    }
  }

  // --- EVENT LISTENERS ---
  categorySelect.addEventListener("change", populateUnits);
  [selectA, selectB].forEach((el) =>
    el.addEventListener("change", () => {
      updateFlags();
      convert();
    })
  );
  inputA.addEventListener("input", (e) => {
    const cursorPosition = e.target.selectionStart;
    const originalLength = e.target.value.length;
    const formattedValue = formatNumber(e.target.value);
    e.target.value = formattedValue;
    const newLength = formattedValue.length;
    e.target.setSelectionRange(
      cursorPosition + (newLength - originalLength),
      cursorPosition + (newLength - originalLength)
    );
    convert();
  });
  swapBtn.addEventListener("click", () => {
    [selectA.value, selectB.value] = [selectB.value, selectA.value];
    updateFlags();
    convert();
  });

  // --- INITIALIZATION ---
  populateCategories();
  populateUnits();
});
