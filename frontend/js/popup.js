// frontend/popup.js

const dummyData = {
  risk_score: 75.5,
  risk_level: "High",
  message: "Website memiliki tingkat risiko High",
  reasons: [
    "URL menggunakan IP Address",
    "Menggunakan URL shortening service",
    "Mengandung simbol @ dalam URL",
    "Token HTTPS mencurigakan",
    "Menggunakan iframe tersembunyi",
  ],
}

function updateUI(data) {
  console.log("Updating UI dengan data:", data)

  const scoreElement = document.getElementById("riskScore")
  if (scoreElement) scoreElement.textContent = data.risk_score

  const levelElement = document.getElementById("riskLevel")
  if (levelElement) {
    levelElement.textContent = data.risk_level

    // Update warna berdasarkan level
    levelElement.className = `px-3 py-1 rounded-full text-sm ${
      data.risk_level.toLowerCase() === "high"
        ? "bg-red-500"
        : data.risk_level.toLowerCase() === "medium"
          ? "bg-yellow-500"
          : "bg-green-500"
    }`
  }

  const messageElement = document.getElementById("message")
  if (messageElement) messageElement.textContent = data.message

  const reasonsList = document.getElementById("reasonsList")
  if (reasonsList) {
    reasonsList.innerHTML = data.reasons
      .map((reason) => `<li>🔴 ${reason}</li>`)
      .join("")
  }
}

// =========================
// NAVIGATION HANDLER
// =========================
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll(".page-content").forEach((page) => {
    page.classList.add("hidden")
  })

  // Show selected page
  const selectedPage = document.getElementById(pageName + "Page")
  if (selectedPage) {
    selectedPage.classList.remove("hidden")
  }

  // Update UI berdasarkan halaman
  if (pageName === "dashboard") {
    updateUI(dummyData)
  }
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded")

  // Tampilkan dashboard default
  showPage("dashboard")

  // Listen for messages from iframe
  window.addEventListener("message", (event) => {
    if (event.data.type === "NAV_CLICK") {
      console.log("Navigation clicked:", event.data.page)
      showPage(event.data.page)
    }
  })

  // Alternative: langsung akses iframe content (kalau same-origin)
  /*
    const iframe = document.getElementById('navbarFrame')
    iframe.addEventListener('load', () => {
        const navItems = iframe.contentDocument.querySelectorAll('.nav-item')
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                showPage(item.dataset.page)
            })
        })
    })
    */
})

// Data dummy tetap sama untuk testing
