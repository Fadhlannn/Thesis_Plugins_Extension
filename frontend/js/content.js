console.log("Content script injected")

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getPageData") {
    sendResponse({
      url: window.location.href,
      title: document.title,
      third_party_count: 5,
      has_fingerprinting: false,
      cookies: 3,
    })
  }
  return true
})

console.log("🔍 Privacy Guard content script loaded")
