// js/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard loaded")

  // Listen for messages from parent
  window.addEventListener("message", (event) => {
    if (event.data.type === "UPDATE_DATA") {
      updateUI(event.data.data)
    }
  })

  // Notify parent that dashboard is loaded
  window.parent.postMessage({ type: "PAGE_LOADED", page: "dashboard" }, "*")

  // Try to get data from storage as fallback
  chrome.storage.local.get("websiteData", (result) => {
    if (
      result.websiteData &&
      document.getElementById("riskScore").textContent === "-"
    ) {
      analyzeWebsite(result.websiteData)
    }
  })
})

// Fallback: langsung panggil API dari dashboard
async function analyzeWebsite(data) {
  try {
    const res = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    const result = await res.json()
    updateUI(result)
  } catch (error) {
    console.error("Error analyzing:", error)
  }
}

function updateUI(data) {
  console.log("Updating UI with:", data)

  // Update risk score
  const scoreEl = document.getElementById("riskScore")
  if (scoreEl) scoreEl.textContent = data.final_score

  // Update risk level with color
  const levelEl = document.getElementById("riskLevel")
  if (levelEl) {
    levelEl.textContent = data.status

    let color = "bg-gray-500"
    const level = String(data.status).toLowerCase()

    if (level.includes("berisiko")) {
      color = "bg-red-500"
    } else if (level.includes("waspada")) {
      color = "bg-yellow-500"
    } else if (level.includes("aman")) {
      color = "bg-green-500"
    }

    levelEl.className = `px-3 py-1 rounded-full text-sm ${color}`
  }

  // Update message
  const msgEl = document.getElementById("message")
  if (msgEl) {
    // Generate message based on score and status
    if (data.final_score === "...") {
      msgEl.textContent = "Loading..."
    } else if (data.final_score === "Error") {
      msgEl.textContent = data.message || "Error"
    } else {
      const messages = {
        Berisiko: `⚠️ Website memiliki risiko TINGGI (Skor: ${data.final_score})`,
        Waspada: `⚠️ Website perlu diwaspadai (Skor: ${data.final_score})`,
        Aman: `✅ Website terlihat AMAN (Skor: ${data.final_score})`,
      }
      msgEl.textContent = messages[data.status] || `Skor: ${data.final_score}`
    }
  }

  // Update reasons
  const reasonsEl = document.getElementById("reasonsList")
  if (reasonsEl) {
    if (data.analysis_details?.length) {
      reasonsEl.innerHTML = data.analysis_details
        .map(
          (r) => `<li class="flex gap-2 text-sm border-b border-white/10 pb-2">
          <span class="text-red-500">🔴</span>
          <span>${r}</span>
        </li>`,
        )
        .join("")
    } else {
      reasonsEl.innerHTML =
        '<li class="opacity-50">Tidak ada alasan spesifik</li>'
    }
  }

  // Update URL
  const urlEl = document.getElementById("websiteUrl")
  if (urlEl && data.url) {
    urlEl.textContent = data.url
  }
}
