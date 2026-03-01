document.addEventListener("DOMContentLoaded", () => {
  loadAlerts()

  window.addEventListener("message", (event) => {
    if (event.data.type === "UPDATE_ALERTS") {
      renderAlerts(event.data.alerts)
    }
  })
})

function loadAlerts() {
  chrome.storage.local.get(["alerts"], (result) => {
    if (result.alerts) {
      renderAlerts(result.alerts)
    }
  })
}

function renderAlerts(alerts) {
  const container = document.getElementById("alertsList")
  if (!container) return

  if (!alerts || alerts.length === 0) {
    container.innerHTML =
      '<div class="text-center opacity-70 py-4">No alerts</div>'
    return
  }

  container.innerHTML = alerts
    .map(
      (alert) => `
        <div class="bg-${alert.color}/20 rounded-lg p-3">
            <div class="font-semibold">${alert.title}</div>
            <div class="text-sm">${alert.url}</div>
            <div class="text-xs mt-1">Detected: ${alert.time}</div>
        </div>
    `,
    )
    .join("")
}

document.getElementById("clearAlerts")?.addEventListener("click", () => {
  chrome.storage.local.set({ alerts: [] })
  renderAlerts([])
})
