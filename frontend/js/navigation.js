// js/navigation.js

const API_URL = "http://localhost:8000"

document.addEventListener("DOMContentLoaded", () => {
  console.log("Navigation initialized")

  const navbarFrame = document.getElementById("navbarFrame")
  const contentFrame = document.getElementById("contentFrame")

  const lastPage = localStorage.getItem("lastPage") || "dashboard"
  contentFrame.src = `pages/${lastPage}.html`

  navbarFrame.addEventListener("load", () => {
    setTimeout(() => {
      if (navbarFrame.contentWindow) {
        navbarFrame.contentWindow.postMessage(
          { type: "SET_ACTIVE", page: lastPage },
          "*",
        )
      }
    }, 100)
  })

  window.addEventListener("message", (event) => {
    if (event.data.type === "NAV_CLICK") {
      const page = event.data.page
      contentFrame.src = `pages/${page}.html`
      localStorage.setItem("lastPage", page)

      if (page === "dashboard") {
        setTimeout(() => analyzeCurrentWebsite(), 500)
      }
    }

    if (event.data.type === "REQUEST_ANALYSIS") {
      analyzeCurrentWebsite()
    }
  })

  if (lastPage === "dashboard") {
    setTimeout(() => analyzeCurrentWebsite(), 1000)
  }
})

// Inject content script ke tab
async function injectContentScript(tabId) {
  try {
    console.log("Mencoba inject content script ke tab:", tabId)

    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["js/content.js"],
    })

    console.log("Content script berhasil di-inject!")

    // Tunggu sebentar agar content script siap
    await new Promise((resolve) => setTimeout(resolve, 500))
    return true
  } catch (error) {
    console.log("Gagal inject content script:", error.message)
    return false
  }
}

// Ambil data dari tab
async function getCurrentTabData() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || !tabs[0]) {
        resolve(null)
        return
      }

      const tab = tabs[0]
      console.log("Tab aktif:", tab.url)

      // Skip internal pages
      if (tab.url.startsWith("chrome://") || tab.url.startsWith("about:")) {
        resolve({
          url: tab.url,
          is_https: false,
          tracker_count: 0,
          permissions: [],
          cookies_count: 0,
          third_party_domains: [],
          iframe_count: 0,
          redirect_count: 0,
          domain_age_days: 0,
          ip_address: "internal",
        })
        return
      }

      // Inject content script dulu
      await injectContentScript(tab.id)

      // Coba ping content script
      try {
        const pingResult = await chrome.tabs.sendMessage(tab.id, {
          action: "ping",
        })
        console.log("Ping result:", pingResult)

        // Minta data
        const data = await chrome.tabs.sendMessage(tab.id, {
          action: "collectWebsiteData",
        })
        console.log("Data dari content script:", data)

        // Tambah redirect count dari background
        chrome.runtime.sendMessage({ type: "GET_REDIRECT_COUNT" }, (bgRes) => {
          if (data) {
            data.redirect_count = bgRes?.count || 0
          }
          resolve(data)
        })
      } catch (error) {
        console.log("Gagal komunikasi dengan content script:", error.message)

        // Fallback ke data dasar
        chrome.runtime.sendMessage({ type: "GET_REDIRECT_COUNT" }, (bgRes) => {
          resolve({
            url: tab.url,
            is_https: tab.url.startsWith("https"),
            tracker_count: 0,
            permissions: [],
            cookies_count: 0,
            third_party_domains: [],
            iframe_count: 0,
            redirect_count: bgRes?.count || 0,
            domain_age_days: 0,
            ip_address: new URL(tab.url).hostname,
          })
        })
      }
    })
  })
}

// Analisis website
async function analyzeCurrentWebsite() {
  try {
    sendToDashboard({
      final_score: "...",
      status: "Loading",
      message: "Mengambil data website...",
      analysis_details: ["Mengaktifkan content script..."],
      url: "Loading...",
    })

    const websiteData = await getCurrentTabData()
    if (!websiteData) throw new Error("No data")

    console.log("Final website data:", websiteData)

    if (
      websiteData.url.startsWith("chrome://") ||
      websiteData.url.startsWith("about:")
    ) {
      sendToDashboard({
        final_score: "N/A",
        status: "Info",
        message: "Halaman internal browser",
        analysis_details: ["Buka website regular untuk analisis"],
        url: websiteData.url,
      })
      return
    }

    sendToDashboard({
      final_score: "...",
      status: "Loading",
      message: "Menghubungi scoring engine...",
      analysis_details: ["Mengirim data ke backend..."],
      url: websiteData.url,
    })

    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(websiteData),
    })

    const result = await response.json()
    console.log("Hasil backend:", result)

    sendToDashboard(result)
  } catch (error) {
    console.error("Error:", error)
    sendToDashboard({
      final_score: "Error",
      status: "Error",
      message: error.message,
      analysis_details: ["Cek koneksi backend di port 8000"],
      url: "Error",
    })
  }
}

function sendToDashboard(data) {
  const contentFrame = document.getElementById("contentFrame")
  if (contentFrame?.contentWindow) {
    contentFrame.contentWindow.postMessage(
      { type: "UPDATE_DATA", data: data },
      "*",
    )
  }
}

// Expose for debugging
window.analyzeCurrentWebsite = analyzeCurrentWebsite
