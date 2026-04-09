// js/navigation.js

import { analyzeWebsite } from "./api.js";

console.log("🚀 Navigation jalan");

const contentFrame = document.getElementById("contentFrame");

// =============================
// 📌 GET ACTIVE TAB
// =============================
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab;
}

// =============================
// 📌 INJECT SCRIPT
// =============================
async function injectScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["js/content.js"],
  });
}

// =============================
// 🍪 GET COOKIES
// =============================
function getCookies() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_COOKIES" }, (res) => {
      if (res && res.status === "ok") {
        resolve({
          cookies: res.cookies,
          cookies_count: res.cookies_count,
        });
      } else {
        resolve({
          cookies: [],
          cookies_count: 0,
        });
      }
    });
  });
}

// =============================
// 🔥 MAIN INIT
// =============================
async function init() {
  const tab = await getActiveTab();

  console.log("🌐 Tab:", tab.url);

  await injectScript(tab.id);
}

// =============================
// 📩 TERIMA DATA DARI CONTENT
// =============================
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type === "CONTENT_SCRIPT_READY") {
    console.log("📦 Data dari content:", msg.data);

    const cookieData = await getCookies();

    const payload = {
      ...msg.data,
      ...cookieData,
      redirect_count: 0,
    };

    const result = await analyzeWebsite(payload);
    console.log("📥 Hasil dari backend:", result);

    // 🔥 FIX DI SINI
    contentFrame.contentWindow.postMessage(
      {
        type: "UPDATE_DATA",
        data: result,
      },
      "*"
    );

    // 💾 OPTIONAL (biar ga ilang pas pindah page)
    localStorage.setItem("lastAnalysis", JSON.stringify(result));
  }
});

// =============================
init();