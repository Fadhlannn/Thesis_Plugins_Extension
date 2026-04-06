// js/navigation.js

import { analyzeWebsite } from "./api.js";

console.log("🚀 Navigation jalan");

const contentFrame = document.getElementById("contentFrame");

// ambil tab aktif
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab;
}

// inject content script
async function injectScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["js/content.js"],
  });
}

// =============================
// 🔥 MAIN FLOW
// =============================
async function init() {
  const tab = await getActiveTab();

  console.log("🌐 Tab:", tab.url);

  await injectScript(tab.id);
}

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


// =============================
// 📩 TERIMA DATA DARI CONTENT
// =============================
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type === "CONTENT_SCRIPT_READY") {
    console.log("📦 Data dari content:", msg.data);
    // 🔥 AMBIL COOKIES DULU
    const cookieData = await getCookies();

        const payload = {
    ...msg.data,
    ...cookieData,

    redirect_count: 0,    // wajib           
    };

    const result = await analyzeWebsite(payload);
    console.log("📥 Hasil dari backend:", result);
    const iframe = document.getElementById("contentFrame");

    // kirim ke dashboard
    contentFrame.contentWindow.postMessage(result, "*");
  }
});

// =============================
init();