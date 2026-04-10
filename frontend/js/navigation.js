// js/navigation.js

import { analyzeWebsite } from "./api.js"

console.log("Navigation.js jalan - Parent window")

const contentFrame = document.getElementById("contentFrame")
const navbarFrame = document.getElementById("navbarFrame")

// Ambil tab aktif
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  return tab
}

// Inject content script
async function injectScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["js/content.js"],
    })
    console.log("Content script injected")
  } catch (error) {
    console.error("Gagal inject script:", error)
  }
}

// Ambil cookies
function getCookies() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_COOKIES" }, (res) => {
      if (res && res.status === "ok") {
        resolve({
          cookies: res.cookies,
          cookies_count: res.cookies_count,
        })
      } else {
        resolve({
          cookies: [],
          cookies_count: 0,
        })
      }
    })
  })
}

// Kirim data ke contentFrame (dashboard)
function sendToContentFrame(data, retryCount = 0) {
  if (!contentFrame) {
    console.error("contentFrame tidak ditemukan")
    return
  }

  if (!contentFrame.contentWindow) {
    if (retryCount < 10) {
      console.log(`Menunggu contentFrame siap... retry ${retryCount + 1}`)
      setTimeout(() => sendToContentFrame(data, retryCount + 1), 500)
    }
    return
  }

  try {
    contentFrame.contentWindow.postMessage(data, "*")
    console.log("Data terkirim ke contentFrame:", data)
  } catch (error) {
    console.error("Gagal kirim ke contentFrame:", error)
  }
}

// Kirim pesan ke navbarFrame untuk update active class
function sendToNavbar(page) {
  if (!navbarFrame || !navbarFrame.contentWindow) {
    console.log("navbarFrame belum siap")
    return
  }

  try {
    navbarFrame.contentWindow.postMessage(
      { type: "SET_ACTIVE", page: page },
      "*",
    )
    console.log("Pesan SET_ACTIVE terkirim ke navbar:", page)
  } catch (error) {
    console.error("Gagal kirim ke navbar:", error)
  }
}

// =============================
// FUNGSI SAVE TO HISTORY (SEMUA HASIL)
// =============================
function saveToHistory(analysisResult) {
  if (!analysisResult) return

  const historyItem = {
    url: analysisResult.url,
    score: analysisResult.final_score,
    status: analysisResult.status,
    reasons: analysisResult.analysis_details || [],
    time: Date.now(),
  }

  chrome.storage.local.get(["scanHistory"], (result) => {
    let history = result.scanHistory || []

    // Cek duplikat (hindari URL yang sama beruntun)
    const isDuplicate =
      history.length > 0 && history[0].url === analysisResult.url

    if (!isDuplicate) {
      history.unshift(historyItem)
      const limitedHistory = history.slice(0, 100) // Maksimal 100 history

      chrome.storage.local.set({ scanHistory: limitedHistory }, () => {
        console.log(
          "History saved:",
          analysisResult.url,
          "-",
          analysisResult.status,
        )
      })
    }
  })
}

// Fungsi untuk mengirim notifikasi (AMAN - dengan error handling)
function sendNotification(historyItem) {
  // Cek apakah chrome.notifications tersedia
  if (!chrome.notifications) {
    console.log("Notifikasi tidak tersedia")
    return
  }

  chrome.storage.local.get(["notificationsEnabled"], (result) => {
    if (result.notificationsEnabled !== false) {
      try {
        chrome.notifications.create(
          {
            type: "basic",
            iconUrl: "icon/icon128.png",
            title: "Website Berbahaya Terdeteksi",
            message: `${historyItem.url} - Score: ${historyItem.final_score}/100`,
            priority: 2,
          },
          (notificationId) => {
            if (chrome.runtime.lastError) {
              console.log("Error notifikasi:", chrome.runtime.lastError.message)
            }
          },
        )
      } catch (error) {
        console.log("Gagal membuat notifikasi:", error)
      }
    }
  })
}

// Inisialisasi
async function init() {
  const tab = await getActiveTab()
  console.log("Tab aktif:", tab.url)

  await injectScript(tab.id)
}

// =============================
// LISTENER PESAN DARI CHILD IFRAMES
// =============================
window.addEventListener("message", async (event) => {
  console.log("Parent terima pesan:", event.data)

  if (event.source === navbarFrame?.contentWindow) {
    if (event.data?.type === "NAV_CLICK") {
      const page = event.data.page
      console.log("Navigasi dari navbar ke:", page)

      if (contentFrame) {
        contentFrame.src = `pages/${page}.html`
      }
      sendToNavbar(page)
    }
  }

  if (event.source === contentFrame?.contentWindow) {
    if (event.data?.type === "DASHBOARD_READY") {
      console.log("Dashboard siap menerima data")
    }

    if (event.data?.type === "REQUEST_DATA") {
      console.log("Dashboard minta data terbaru")
      const tab = await getActiveTab()
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "REFRESH_DATA" })
      }
    }
  }

  if (event.data?.type === "NAVBAR_READY") {
    console.log("Navbar siap, kirim active page default")
    sendToNavbar("dashboard")
  }
})

// =============================
// TERIMA DATA DARI CONTENT SCRIPT
// =============================
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type === "CONTENT_SCRIPT_READY") {
    console.log("Data dari content script:", msg.data)

    const cookieData = await getCookies()

    const payload = {
      ...msg.data,
      ...cookieData,
      redirect_count: 0,
      domain_age_days: msg.data.domain_age_days || 0,
    }

    try {
      const result = await analyzeWebsite(payload)
      console.log("Hasil dari backend:", result)

      // SIMPAN KE HISTORY (SEMUA HASIL)
      saveToHistory(result)

      // Simpan ke localStorage untuk dashboard
      localStorage.setItem("lastAnalysis", JSON.stringify(result))

      // Kirim ke dashboard
      sendToContentFrame(result)
    } catch (error) {
      console.error("Error dari backend:", error)
    }
  }
})

// =============================
// EVENT LISTENER UNTUK IFRAME LOAD
// =============================
if (contentFrame) {
  contentFrame.addEventListener("load", () => {
    console.log("ContentFrame loaded:", contentFrame.src)
  })
}

if (navbarFrame) {
  navbarFrame.addEventListener("load", () => {
    console.log("NavbarFrame loaded")
  })
}

// Jalankan init
init()
