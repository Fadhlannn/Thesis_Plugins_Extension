const navbarFrame = document.getElementById("navbarFrame")
const contentFrame = document.getElementById("contentFrame")

function navigateTo(page) {
  console.log("Navigating to:", page)

  contentFrame.src = `pages/${page}.html`

  localStorage.setItem("lastPage", page)
}

window.addEventListener("message", (event) => {
  if (event.data.type === "NAV_CLICK") {
    navigateTo(event.data.page)
  }
})

document.addEventListener("DOMContentLoaded", () => {
  const lastPage = localStorage.getItem("lastPage") || "dashboard"
  contentFrame.src = `pages/${lastPage}.html`

  setTimeout(() => {
    navbarFrame.contentWindow.postMessage(
      {
        type: "SET_ACTIVE",
        page: lastPage,
      },
      "*",
    )
  }, 100)
})

function sendDataToCurrentPage(data) {
  contentFrame.contentWindow.postMessage(
    {
      type: "UPDATE_DATA",
      data: data,
    },
    "*",
  )
}

setTimeout(() => {
  const dummyData = {
    risk_score: 75.5,
    risk_level: "High",
    message: "Website memiliki tingkat risiko High",
    reasons: [
      "URL menggunakan IP Address",
      "Menggunakan URL shortening service",
      "Mengandung simbol @ dalam URL",
    ],
  }

  sendDataToCurrentPage(dummyData)
}, 500)
