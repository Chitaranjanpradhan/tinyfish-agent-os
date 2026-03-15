// TinyFish Agent OS — Content Script
// Runs on every page, listens for agent commands

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_INFO") {
    sendResponse({
      url: window.location.href,
      title: document.title,
      text: document.body?.innerText?.slice(0, 2000) || "",
    });
    return true;
  }
});
