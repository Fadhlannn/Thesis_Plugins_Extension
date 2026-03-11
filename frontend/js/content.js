// js/content.js
console.log("✅ CONTENT SCRIPT BERHASIL DI-INJECT!")
console.log("URL:", window.location.href)

// Fungsi untuk mengumpulkan data
function collectWebsiteData() {
  console.log("Mengumpulkan data website...")

  // Deteksi tracker sederhana
  const scripts = document.querySelectorAll("script[src]")
  const trackers = Array.from(scripts).filter((s) => {
    const src = s.src.toLowerCase()
    return (
      src.includes("google") ||
      src.includes("analytics") ||
      src.includes("facebook") ||
      src.includes("track")
    )
  }).length

  // Deteksi third-party domains
  const currentDomain = window.location.hostname
  const thirdParty = new Set()

  document
    .querySelectorAll("script[src], link[href], img[src], iframe[src]")
    .forEach((el) => {
      try {
        const url = new URL(el.src || el.href, window.location.href)
        if (url.hostname && url.hostname !== currentDomain) {
          thirdParty.add(url.hostname)
        }
      } catch (e) {}
    })

  const data = {
    url: window.location.href,
    is_https: window.location.protocol === "https:",
    tracker_count: trackers,
    permissions: [],
    cookies_count: document.cookie.split(";").filter((c) => c.trim()).length,
    third_party_domains: Array.from(thirdParty),
    iframe_count: document.querySelectorAll("iframe").length,
    redirect_count: 0,
    domain_age_days: 0,
    ip_address: window.location.hostname,
  }

  console.log("Data terkumpul:", data)
  return data
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Pesan diterima di content script:", message)

  if (message.action === "ping") {
    console.log("Mengirim pong...")
    sendResponse({ status: "alive", url: window.location.href })
    return true
  }

  if (message.action === "collectWebsiteData") {
    const data = collectWebsiteData()
    sendResponse(data)
    return true
  }
})

// Kirim sinyal bahwa content script sudah siap
setTimeout(() => {
  chrome.runtime
    .sendMessage({
      type: "CONTENT_SCRIPT_READY",
      url: window.location.href,
    })
    .catch(() => {})
}, 500)
