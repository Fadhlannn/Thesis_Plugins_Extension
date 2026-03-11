// js/alerts.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("Alerts loaded")
  loadAlerts()

  document.getElementById("clearAlerts")?.addEventListener("click", clearAlerts)
})

function loadAlerts() {
  chrome.storage.local.get(["alerts"], (result) => {
    renderAlerts(result.alerts || [])
  })
}

function renderAlerts(alerts) {
  const el = document.getElementById("alertsList")
  if (!el) return

  if (!alerts.length) {
    el.innerHTML = '<div class="text-center opacity-70 py-8">No alerts</div>'
    return
  }

  el.innerHTML = alerts
    .map((alert) => {
      const color =
        alert.severity === "high"
          ? "bg-red-500/20 border-red-500"
          : alert.severity === "medium"
            ? "bg-yellow-500/20 border-yellow-500"
            : "bg-blue-500/20 border-blue-500"

      return `
      <div class="${color} rounded-lg p-3 border-l-4">
        <div class="font-semibold">${alert.title}</div>
        <div class="text-sm mt-1">${alert.message}</div>
        <div class="text-xs mt-2 opacity-70">${new Date(alert.time).toLocaleString()}</div>
      </div>
    `
    })
    .join("")
}

function clearAlerts() {
  if (confirm("Clear all alerts?")) {
    chrome.storage.local.set({ alerts: [] }, () => {
      renderAlerts([])
    })
  }
}
