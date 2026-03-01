document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard loaded")

  window.addEventListener("message", (event) => {
    if (event.data.type === "UPDATE_DATA") {
      updateDashboardUI(event.data.data)
    }
  })

  window.parent.postMessage({ type: "PAGE_LOADED", page: "dashboard" }, "*")
})

function updateDashboardUI(data) {
  const scoreEl = document.getElementById("riskScore")
  if (scoreEl) scoreEl.textContent = data.risk_score

  const levelEl = document.getElementById("riskLevel")
  if (levelEl) {
    levelEl.textContent = data.risk_level
    levelEl.className = `px-3 py-1 rounded-full text-sm ${
      data.risk_level.toLowerCase() === "high"
        ? "bg-red-500"
        : data.risk_level.toLowerCase() === "medium"
          ? "bg-yellow-500"
          : "bg-green-500"
    }`
  }

  const msgEl = document.getElementById("message")
  if (msgEl) msgEl.textContent = data.message

  const reasonsEl = document.getElementById("reasonsList")
  if (reasonsEl) {
    reasonsEl.innerHTML = data.reasons
      .map((reason) => `<li>🔴 ${reason}</li>`)
      .join("")
  }
}
