document.addEventListener("DOMContentLoaded", () => {
  // =================================================================
  // 1. LẤY THAM CHIẾU DOM
  // =================================================================
  const tabButtons = document.querySelectorAll(".tab-btn");
  const subnetInput = document.getElementById("subnet-input");
  const calculateSubnetBtn = document.getElementById("calculate-subnet-btn");
  const subnetMainResultsEl = document.getElementById("subnet-main-results");
  const subnetBinaryResultsEl = document.getElementById(
    "subnet-binary-results"
  );
  const subnetListContainerEl = document.getElementById(
    "subnet-list-container"
  );
  const ipLookupInput = document.getElementById("ip-lookup-input");
  const lookupIpBtn = document.getElementById("lookup-ip-btn");
  const ipLookupResultsEl = document.getElementById("ip-lookup-results");
  const dnsLookupInput = document.getElementById("dns-lookup-input");
  const lookupDnsBtn = document.getElementById("lookup-dns-btn");
  const dnsLookupResultsEl = document.getElementById("dns-lookup-results");
  const findMyIpBtn = document.getElementById("find-my-ip-btn");
  const myIpDisplayEl = document.getElementById("my-ip-display");

  // =================================================================
  // 2. HÀM HỖ TRỢ & TÍNH TOÁN IP BẰNG TAY
  // =================================================================
  const ipToInt = (ip) =>
    ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  const intToIp = (int) =>
    [int >>> 24, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join(".");
  const cidrToMask = (cidr) => intToIp(-1 << (32 - cidr));
  const toBinary = (ip) =>
    ip
      .split(".")
      .map((octet) => parseInt(octet).toString(2).padStart(8, "0"))
      .join(".");

  function renderTable(data, container) {
    let t = '<table class="results-table">';
    for (const [k, v] of Object.entries(data)) {
      t += `<tr><td>${k}</td><td>${v || "N/A"}</td></tr>`;
    }
    t += "</table>";
    container.innerHTML = t;
  }
  function renderStatus(message, container, type = "loading") {
    container.innerHTML = `<p class="status-text ${type}">${message}</p>`;
  }
  function getIpClass(firstOctet) {
    if (firstOctet >= 1 && firstOctet <= 126) return "A";
    if (firstOctet >= 128 && firstOctet <= 191) return "B";
    if (firstOctet >= 192 && firstOctet <= 223) return "C";
    if (firstOctet >= 224 && firstOctet <= 239) return "D (Multicast)";
    if (firstOctet >= 240 && firstOctet <= 255) return "E (Experimental)";
    if (firstOctet === 127) return "Loopback";
    return "Không xác định";
  }

  // =================================================================
  // 3. LOGIC XỬ LÝ CHÍNH
  // =================================================================

  // [Công cụ 1] Subnet Calculator (Bằng JavaScript thuần)
  function calculateSubnet() {
    subnetMainResultsEl.innerHTML = "";
    subnetBinaryResultsEl.innerHTML = "";
    subnetListContainerEl.innerHTML = "";
    try {
      const [ipStr, cidrStr] = subnetInput.value.trim().split("/");
      const cidr = parseInt(cidrStr);
      if (!ipStr || isNaN(cidr) || cidr < 0 || cidr > 32)
        throw new Error("Định dạng không hợp lệ.");

      const ipInt = ipToInt(ipStr);
      const maskInt = ipToInt(cidrToMask(cidr));

      const networkInt = ipInt & maskInt;
      const broadcastInt = networkInt | (~maskInt >>> 0);

      const totalHosts = Math.pow(2, 32 - cidr);
      const usableHosts = totalHosts > 2 ? totalHosts - 2 : 0;

      const firstOctet = parseInt(ipStr.split(".")[0]);

      const mainResults = {
        "Địa chỉ IP": ipStr,
        "Lớp mạng": getIpClass(firstOctet),
        "Địa chỉ Mạng": `<span class="highlight">${intToIp(networkInt)}</span>`,
        "Địa chỉ Broadcast": `<span class="highlight">${intToIp(
          broadcastInt
        )}</span>`,
        "Dải Host hợp lệ":
          usableHosts > 0
            ? `${intToIp(networkInt + 1)} - ${intToIp(broadcastInt - 1)}`
            : "Không có",
        "Subnet Mask": intToIp(maskInt),
        "Wildcard Mask": intToIp(~maskInt >>> 0),
        "Tổng số Host": totalHosts.toLocaleString(),
        "Host có thể sử dụng": usableHosts.toLocaleString(),
      };
      renderTable(mainResults, subnetMainResultsEl);

      const binaryResults = {
        "Địa chỉ IP (Binary)": `<code class="binary-ip">${toBinary(
          ipStr
        )}</code>`,
        "Subnet Mask (Binary)": `<code class="binary-ip">${toBinary(
          intToIp(maskInt)
        )}</code>`,
      };
      renderTable(binaryResults, subnetBinaryResultsEl);

      const defaultCidr = firstOctet < 128 ? 8 : firstOctet < 192 ? 16 : 24;
      const subnetBits = cidr - defaultCidr;
      if (subnetBits >= 0 && cidr < 31) {
        // Chỉ hiển thị nếu có subnet con hợp lý
        const numSubnets = Math.pow(2, subnetBits);
        const startOfSupernet = ipInt & ipToInt(cidrToMask(defaultCidr));

        let subnetListHTML = `<details open><summary>Danh sách ${numSubnets.toLocaleString()} mạng con</summary><table class="results-table subnet-list-table"><thead><tr><th>#</th><th>Subnet ID</th><th>Host Adresses</th><th>Broadcast</th></tr></thead><tbody>`;

        for (let i = 0; i < numSubnets; i++) {
          if (i >= 1024) {
            subnetListHTML += `<tr><td colspan="4" style="text-align:center;">... và còn nhiều mạng con khác ...</td></tr>`;
            break;
          }
          const currentNetworkInt = startOfSupernet + i * totalHosts;
          const currentBroadcastInt = currentNetworkInt + totalHosts - 1;
          const currentUsableStart =
            totalHosts > 2 ? intToIp(currentNetworkInt + 1) : "N/A";
          const currentUsableEnd =
            totalHosts > 2 ? intToIp(currentBroadcastInt - 1) : "N/A";

          subnetListHTML += `<tr><td>${
            i + 1
          }</td><td><span class="highlight">${intToIp(
            currentNetworkInt
          )}</span></td><td>${currentUsableStart} - ${currentUsableEnd}</td><td>${intToIp(
            currentBroadcastInt
          )}</td></tr>`;
        }
        subnetListHTML += `</tbody></table></details>`;
        subnetListContainerEl.innerHTML = subnetListHTML;
      }
    } catch (error) {
      renderStatus(
        `Lỗi: ${error.message}. Hãy chắc chắn định dạng là IP/CIDR (ví dụ: 192.168.1.0/24).`,
        subnetMainResultsEl,
        "error"
      );
    }
  }

  // [Công cụ 2] IP Geolocation (Sử dụng API ip-api.com)
  async function lookupIp() {
    const ip = ipLookupInput.value.trim();
    if (!ip) {
      renderStatus("Vui lòng nhập địa chỉ IP.", ipLookupResultsEl, "error");
      return;
    }

    renderStatus("Đang tra cứu...", ipLookupResultsEl, "loading");

    try {
      const response = await fetch(
        `https://ipwho.is/${encodeURIComponent(ip)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Không thể tra cứu IP.");
      }

      const results = {
        "Địa chỉ IP": data.ip,
        "Quốc gia": `${data.country} (${data.country_code})`,
        "Thành phố": data.city,
        "Khu vực": data.region,
        "Mã Zip": data.postal,
        "Vĩ độ, Kinh độ": `${data.latitude}, ${data.longitude}`,
        "Múi giờ": data.timezone?.id || "",
        "Nhà cung cấp (ISP)": data.connection?.isp || "",
        "Tổ chức (Org)": data.connection?.org || "",
      };

      renderTable(results, ipLookupResultsEl);
    } catch (error) {
      renderStatus(`Lỗi: ${error.message}`, ipLookupResultsEl, "error");
    }
  }

  // [Công cụ 3] DNS Lookup
  async function lookupDns() {
    const domain = dnsLookupInput.value.trim();
    if (!domain) {
      renderStatus("Vui lòng nhập tên miền.", dnsLookupResultsEl, "error");
      return;
    }

    renderStatus("Đang tra cứu DNS...", dnsLookupResultsEl, "loading");

    try {
      const response = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
          domain
        )}`,
        {
          headers: { Accept: "application/dns-json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (!data.Answer) {
        throw new Error("Không tìm thấy bản ghi nào.");
      }

      let html = "<h4>Các bản ghi DNS:</h4>";
      data.Answer.forEach((record) => {
        let type = "Khác";
        if (record.type === 1) type = "A";
        else if (record.type === 28) type = "AAAA";
        else if (record.type === 5) type = "CNAME";

        html += `<div class="dns-record">
        <span class="dns-type">${type}</span>
        <span class="dns-data">${record.data}</span>
        <span class="dns-ttl">TTL: ${record.TTL}s</span>
      </div>`;
      });

      dnsLookupResultsEl.innerHTML = html;
    } catch (error) {
      renderStatus(`Lỗi: ${error.message}`, dnsLookupResultsEl, "error");
    }
  }

  // [Công cụ 4] What's My IP?
  async function findMyIp() {
    renderStatus("Đang tìm IP...", myIpDisplayEl, "loading");

    try {
      // Bước 1: Lấy public IP
      const ipRes = await fetch("https://api.ipify.org?format=json");
      if (!ipRes.ok) throw new Error("Không thể lấy IP.");
      const ipData = await ipRes.json();
      const ip = ipData.ip;

      // Bước 2: Tra cứu chi tiết IP qua ipwho.is
      const detailRes = await fetch(
        `https://ipwho.is/${encodeURIComponent(ip)}`
      );
      if (!detailRes.ok) throw new Error("Không thể tra cứu IP.");
      const detailData = await detailRes.json();

      if (!detailData.success) {
        throw new Error(detailData.message || "Không thể lấy chi tiết IP.");
      }

      // Bước 3: Hiển thị kết quả
      const results = {
        "Địa chỉ IP": detailData.ip,
        "Quốc gia": `${detailData.country} (${detailData.country_code})`,
        "Khu vực": detailData.region,
        "Thành phố": detailData.city,
        "Mã Zip": detailData.postal,
        "Vĩ độ, Kinh độ": `${detailData.latitude}, ${detailData.longitude}`,
        "Múi giờ": detailData.timezone?.id || "",
        "Nhà cung cấp (ISP)": detailData.connection?.isp || "",
        "Tổ chức (Org)": detailData.connection?.org || "",
        "Loại kết nối": detailData.connection?.type || "",
        "Proxy/VPN": detailData.security?.is_proxy ? "Có" : "Không",
        Tor: detailData.security?.is_tor ? "Có" : "Không",
      };

      let html = "<h4>Thông tin IP của bạn:</h4>";
      html += "<div class='ip-details'>";
      for (const [key, value] of Object.entries(results)) {
        if (value !== undefined && value !== "") {
          html += `<div class="ip-row"><span class="ip-label">${key}:</span> <span class="ip-value">${value}</span></div>`;
        }
      }
      html += "</div>";

      myIpDisplayEl.innerHTML = html;
    } catch (error) {
      renderStatus(`Lỗi: ${error.message}`, myIpDisplayEl, "error");
    }
  }

  // --- GẮN SỰ KIỆN ---
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(".tab-btn.active").classList.remove("active");
      button.classList.add("active");
      document.querySelector(".tab-content.active").classList.remove("active");
      document
        .getElementById(`tab-${button.dataset.tab}`)
        .classList.add("active");
    });
  });
  calculateSubnetBtn.addEventListener("click", calculateSubnet);
  subnetInput.addEventListener(
    "keydown",
    (e) => e.key === "Enter" && calculateSubnet()
  );
  lookupIpBtn.addEventListener("click", lookupIp);
  ipLookupInput.addEventListener(
    "keydown",
    (e) => e.key === "Enter" && lookupIp()
  );
  lookupDnsBtn.addEventListener("click", lookupDns);
  dnsLookupInput.addEventListener(
    "keydown",
    (e) => e.key === "Enter" && lookupDns()
  );
  findMyIpBtn.addEventListener("click", findMyIp);

  // --- KHỞI CHẠY LẦN ĐẦU ---
  calculateSubnet();
});
