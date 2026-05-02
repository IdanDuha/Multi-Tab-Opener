const DEFAULT_TEMPLATES = [
  {
    id: "playstore",
    name: "Playstore",
    urlPattern: "https://play.google.com/store/apps/details?id={item}",
    editable: false
  },
  {
    id: "websites",
    name: "Websites",
    urlPattern: "{item}",
    editable: true
  },
  {
    id: "looker",
    name: "Looker",
    urlPattern: "[Paste your Looker dashboard URL pattern here]",
    editable: true
  }
];

// Initialize storage on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("templates", (result) => {
    if (!result.templates) {
      chrome.storage.local.set({ templates: DEFAULT_TEMPLATES });
    }
  });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openTabs") {
    handleOpenTabs(request.items, request.templateId, sendResponse);
  } else if (request.action === "getTemplates") {
    chrome.storage.local.get("templates", (result) => {
      sendResponse({ templates: result.templates || DEFAULT_TEMPLATES });
    });
  }
});

// Handle opening tabs
function handleOpenTabs(items, templateId, sendResponse) {
  chrome.storage.local.get("templates", (result) => {
    const templates = result.templates || DEFAULT_TEMPLATES;
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      sendResponse({ success: false, error: "Template not found" });
      return;
    }

    let openedCount = 0;
    items.forEach((item) => {
      let url = template.urlPattern.replace("{item}", item);

      // Special handling for websites: add https:// if no protocol
      if (templateId === "websites" && !url.match(/^https?:\/\//)) {
        url = "https://" + url;
      }

      chrome.tabs.create({ url: url });
      openedCount++;
    });

    sendResponse({ success: true, openedCount: openedCount });
  });

  return true; // Keep the message channel open for async response
}
