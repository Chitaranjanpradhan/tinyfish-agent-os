// TinyFish Agent OS — Background Service Worker
const API_KEY = "sk-tinyfish-LJFi_npagr9hJ7zH_JIoCiTnO1cmDDWQ";

// Open sidebar when extension icon clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Set side panel for all URLs
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({ path: "sidepanel.html", enabled: true });
});

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_API_KEY") {
    sendResponse({ key: API_KEY });
    return true;
  }
  if (message.type === "OPEN_TAB") {
    chrome.tabs.create({ url: message.url });
    return true;
  }
});
