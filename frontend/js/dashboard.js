console.log("📊 Dashboard siap");

// =============================
// 🔄 UPDATE UI FUNCTION
// =============================
function updateUI(data) {
  if (!data) return;

  console.log("🔥 Update UI:", data);

  const scoreEl = document.getElementById("score");
  const riskEl = document.getElementById("riskLevel");
  const msgEl = document.getElementById("message");
  const reasonsEl = document.getElementById("reasonsList");
  const urlEl = document.getElementById("websiteUrl");

  // safety check
  if (!scoreEl || !riskEl || !msgEl || !reasonsEl || !urlEl) {
    console.error("❌ Ada element yang tidak ditemukan");
    return;
  }

  // =========================
  // UPDATE DATA
  // =========================
  scoreEl.innerText = data.final_score ?? "-";
  riskEl.innerText = data.status ?? "-";
  urlEl.innerText = data.url ?? "-";

  // =========================
  // STATUS MESSAGE + COLOR
  // =========================
  if (data.status === "Aman") {
    msgEl.innerText = "Website terlihat aman";
    riskEl.className = "px-3 py-1 rounded-full text-sm bg-green-500";
  } else if (data.status === "Waspada") {
    msgEl.innerText = "Perlu berhati-hati";
    riskEl.className = "px-3 py-1 rounded-full text-sm bg-yellow-500";
  } else if (data.status === "Berbahaya") {
    msgEl.innerText = "Website berpotensi berbahaya";
    riskEl.className = "px-3 py-1 rounded-full text-sm bg-red-500";
  } else {
    msgEl.innerText = data.message || "-";
    riskEl.className = "px-3 py-1 rounded-full text-sm bg-gray-500";
  }

  // =========================
  // REASONS
  // =========================
  reasonsEl.innerHTML = "";

  if (data.analysis_details?.length > 0) {
    data.analysis_details.forEach((reason) => {
      const li = document.createElement("li");
      li.textContent = "• " + reason;
      reasonsEl.appendChild(li);
    });
  } else {
    reasonsEl.innerHTML = "<li>Tidak ada indikasi masalah</li>";
  }
}

// =============================
// 📩 TERIMA DATA DARI NAVIGATION
// =============================
window.addEventListener("message", (event) => {
  let data = event.data;

  // 🔥 HANDLE 2 FORMAT (biar ga error lagi)
  if (data?.type === "UPDATE_DATA") {
    data = data.data;
  }

  updateUI(data);
});

// =============================
// 💾 LOAD DATA TERAKHIR (BIAR GA ILANG)
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("lastAnalysis");

  if (saved) {
    try {
      const data = JSON.parse(saved);
      console.log("♻️ Load dari localStorage:", data);
      updateUI(data);
    } catch (e) {
      console.error("❌ Gagal parse localStorage");
    }
  }
});