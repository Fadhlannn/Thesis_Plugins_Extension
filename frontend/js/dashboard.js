console.log("Dashboard siap")

// Fungsi untuk konversi score (0-100) ke warna RGB (Hijau -> Kuning -> Merah)
function getColorFromScore(score) {
  // Pastikan score antara 0-100
  let normalizedScore = Math.min(100, Math.max(0, score))

  let r, g, b

  if (normalizedScore <= 50) {
    // Hijau (0) -> Kuning (50)
    let progress = normalizedScore / 50
    r = Math.floor(255 * progress)
    g = 255
    b = 0
  } else {
    // Kuning (50) -> Merah (100)
    let progress = (normalizedScore - 50) / 50
    r = 255
    g = Math.floor(255 * (1 - progress))
    b = 0
  }

  return `rgb(${r}, ${g}, ${b})`
}

// Fungsi untuk update circular progress bar dengan warna dinamis
function updateProgressBar(score) {
  const circle = document.getElementById("progressCircle")
  const scoreLabel = document.getElementById("scoreLabel")

  if (!circle) return

  // Pastikan score antara 0-100
  let normalizedScore = Math.min(100, Math.max(0, score))

  // Hitung circumference (2 * pi * r) dengan r=58
  const circumference = 2 * Math.PI * 58
  const offset = circumference - (normalizedScore / 100) * circumference

  // Update stroke-dashoffset dengan animasi
  circle.style.strokeDashoffset = offset

  // Update warna progress bar berdasarkan score
  const color = getColorFromScore(normalizedScore)
  circle.style.stroke = color

  // Update label berdasarkan score
  if (normalizedScore <= 30) {
    scoreLabel.innerText = "Low Risk"
    scoreLabel.className = "mt-2 text-sm font-semibold"
    scoreLabel.style.color = "#10b981"
  } else if (normalizedScore <= 70) {
    scoreLabel.innerText = "Medium Risk"
    scoreLabel.className = "mt-2 text-sm font-semibold"
    scoreLabel.style.color = "#f59e0b"
  } else {
    scoreLabel.innerText = "High Risk"
    scoreLabel.className = "mt-2 text-sm font-semibold"
    scoreLabel.style.color = "#ef4444"
  }
}

// Fungsi utama update UI
function updateUI(data) {
  if (!data) return

  console.log("Update UI:", JSON.stringify(data, null, 2))

  // Ambil element
  const scoreEl = document.getElementById("score")
  const msgEl = document.getElementById("message")
  const reasonsEl = document.getElementById("reasonsList")
  const urlEl = document.getElementById("websiteUrl")

  // Safety check
  if (!scoreEl || !msgEl || !reasonsEl || !urlEl) {
    console.error("Ada element yang tidak ditemukan")
    return
  }

  // Pastikan score adalah number
  let finalScore = parseInt(data.final_score) || 0

  // Update data
  scoreEl.innerText = finalScore
  urlEl.innerText = data.url || "-"

  // Update progress bar dengan warna dinamis
  updateProgressBar(finalScore)

  // Message dari status (handle case sensitive)
  const status = data.status?.toLowerCase()

  if (status === "aman") {
    msgEl.innerText = "Website terlihat aman"
  } else if (status === "waspada") {
    msgEl.innerText = "Perlu berhati-hati"
  } else if (status === "berisiko") {
    msgEl.innerText = "Website berpotensi berbahaya"
  } else {
    msgEl.innerText = data.message || "Status tidak diketahui"
  }

  // Update reasons
  reasonsEl.innerHTML = ""

  if (data.analysis_details && data.analysis_details.length > 0) {
    data.analysis_details.forEach((reason) => {
      const li = document.createElement("li")
      li.textContent = "• " + reason
      li.className = "text-sm opacity-90"
      reasonsEl.appendChild(li)
    })
  } else {
    reasonsEl.innerHTML =
      "<li class='text-sm opacity-70'>Tidak ada indikasi masalah</li>"
  }

  // Simpan ke localStorage agar tidak hilang saat pindah halaman
  try {
    localStorage.setItem("lastAnalysis", JSON.stringify(data))
    console.log("Data tersimpan ke localStorage")
  } catch (e) {
    console.error("Gagal simpan ke localStorage:", e)
  }
}

// =============================
// TERIMA DATA DARI PARENT (NAVIGATION)
// =============================
window.addEventListener("message", (event) => {
  let data = event.data

  console.log("Raw data dari parent:", data)

  // Handle 2 format (biar ga error)
  if (data?.type === "UPDATE_DATA") {
    data = data.data
  }

  updateUI(data)
})

// =============================
// LOAD DATA TERAKHIR (BIAR GA ILANG SAAT PINDAH PAGE)
// =============================
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, cek localStorage...")

  const saved = localStorage.getItem("lastAnalysis")

  if (saved) {
    try {
      const data = JSON.parse(saved)
      console.log("Load dari localStorage:", data)
      updateUI(data)
    } catch (e) {
      console.error("Gagal parse localStorage:", e)
    }
  } else {
    console.log("Tidak ada data di localStorage")
  }

  // Beri tahu parent bahwa dashboard sudah siap
  if (window.parent) {
    window.parent.postMessage({ type: "DASHBOARD_READY" }, "*")
    console.log("Kirim DASHBOARD_READY ke parent")
  }
})

// Inisialisasi progress bar (default 0)
updateProgressBar(0)
