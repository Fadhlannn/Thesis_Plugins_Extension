console.log("📊 Dashboard siap");

// Terima data dari parent (navigation)
window.addEventListener("message", (event) => {
  const data = event.data;

  console.log("🔥 Update UI:", data);

  if (!data) return;

  // Ambil element
  const scoreEl = document.getElementById("score");
  const riskEl = document.getElementById("riskLevel");
  const msgEl = document.getElementById("message");
  const reasonsEl = document.getElementById("reasonsList");
  const urlEl = document.getElementById("websiteUrl");

  // Safety check
  if (!scoreEl || !riskEl || !msgEl || !reasonsEl || !urlEl) {
    console.error("❌ Ada element yang tidak ditemukan");
    return;
  }

  // =========================
  // UPDATE DATA
  // =========================
  scoreEl.innerText = data.final_score;
  riskEl.innerText = data.status;
  urlEl.innerText = data.url;

  // Message simple dari status
  if (data.status === "Aman") {
    msgEl.innerText = "Website terlihat aman";
    riskEl.className = "px-3 py-1 rounded-full text-sm bg-green-500";
  } else if (data.status === "Waspada") {
    msgEl.innerText = "Perlu berhati-hati";
    riskEl.className = "px-3 py-1 rounded-full text-sm bg-yellow-500";
  } else {
    msgEl.innerText = "Website berpotensi berbahaya";
    riskEl.className = "px-3 py-1 rounded-full text-sm bg-red-500";
  }

  // =========================
  // UPDATE REASONS
  // =========================
  reasonsEl.innerHTML = "";

  if (data.analysis_details && data.analysis_details.length > 0) {
    data.analysis_details.forEach((reason) => {
      const li = document.createElement("li");
      li.textContent = "• " + reason;
      reasonsEl.appendChild(li);
    });
  } else {
    reasonsEl.innerHTML = "<li>Tidak ada indikasi masalah</li>";
  }
});