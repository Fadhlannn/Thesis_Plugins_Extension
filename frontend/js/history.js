// js/history.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("History loaded")
  loadHistory()
  setupFilters()
})

function loadHistory() {
  chrome.storage.local.get(["history"], (result) => {
    renderHistory(result.history || [])
  })
}

function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("bg-white/20"))
      btn.classList.add("bg-white/20")

      const filter = btn.textContent.toLowerCase()
      filterHistory(filter)
    })
  })
}

function filterHistory(filter) {
  chrome.storage.local.get(["history"], (result) => {
    let history = result.history || []

    if (filter === "safe") {
      history = history.filter((h) =>
        h.result?.risk_level?.toLowerCase().includes("aman"),
      )
    } else if (filter === "suspicious") {
      history = history.filter((h) =>
        h.result?.risk_level?.toLowerCase().includes("waspada"),
      )
    } else if (filter === "danger") {
      history = history.filter((h) =>
        h.result?.risk_level?.toLowerCase().includes("berisiko"),
      )
    }

    renderHistory(history)
  })
}

function renderHistory(history) {
  const el = document.getElementById("historyList")
  if (!el) return

  if (!history.length) {
    el.innerHTML =
      '<div class="text-center opacity-70 py-8">No history yet</div>'
    return
  }

  el.innerHTML = history
    .map((item) => {
      const date = new Date(item.timestamp).toLocaleString()
      const hostname = new URL(item.url).hostname

      let color = "bg-green-500"
      let text = "Safe"

      if (item.result?.risk_level?.toLowerCase().includes("berisiko")) {
        color = "bg-red-500"
        text = "High Risk"
      } else if (item.result?.risk_level?.toLowerCase().includes("waspada")) {
        color = "bg-yellow-500"
        text = "Suspicious"
      }

      return `
      <div class="bg-white/10 rounded-lg p-3 flex justify-between items-center">
        <div>
          <div class="font-medium">${hostname}</div>
          <div class="text-xs opacity-70">${date}</div>
        </div>
        <span class="px-2 py-1 ${color} rounded-full text-xs">${text}</span>
      </div>
    `
    })
    .join("")
}
