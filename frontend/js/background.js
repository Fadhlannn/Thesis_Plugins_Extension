console.log("Background service worker running")

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_DATA") {
    sendResponse({
      status: "ok",
      data: {
        message: "Dummy data from background",
      },
    })
  }
  return true
})
