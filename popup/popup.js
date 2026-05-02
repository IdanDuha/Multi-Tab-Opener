const itemsInput = document.getElementById("itemsInput");
const templateSelect = document.getElementById("templateSelect");
const openAllBtn = document.getElementById("openAllBtn");
const settingsBtn = document.getElementById("settingsBtn");
const messageEl = document.getElementById("message");

// Load templates when popup opens
document.addEventListener("DOMContentLoaded", loadTemplates);

function loadTemplates() {
  chrome.runtime.sendMessage({ action: "getTemplates" }, (response) => {
    const templates = response.templates || [];

    // Clear existing options
    templateSelect.innerHTML = '<option value="">-- Select a template --</option>';

    // Add templates to dropdown
    templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      templateSelect.appendChild(option);
    });
  });
}

// Handle "Open All" button click
openAllBtn.addEventListener("click", handleOpenAll);

function handleOpenAll() {
  const itemsText = itemsInput.value.trim();
  const templateId = templateSelect.value;

  // Validate input
  if (!itemsText) {
    showMessage("Please enter at least one item", "error");
    return;
  }

  if (!templateId) {
    showMessage("Please select a template", "error");
    return;
  }

  // Split items by comma and trim whitespace
  const items = itemsText
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (items.length === 0) {
    showMessage("Please enter valid items", "error");
    return;
  }

  // Send message to background script
  chrome.runtime.sendMessage(
    { action: "openTabs", items: items, templateId: templateId },
    (response) => {
      if (response.success) {
        showMessage(`Opened ${response.openedCount} tab(s)`, "success");
        itemsInput.value = ""; // Clear input after success
        setTimeout(() => {
          window.close(); // Close popup after 1 second
        }, 1000);
      } else {
        showMessage(`Error: ${response.error}`, "error");
      }
    }
  );
}

// Handle "Settings" button click
settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

// Show message helper
function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

// Clear message after 5 seconds if it's shown
function clearMessageAfterDelay() {
  setTimeout(() => {
    messageEl.className = "message";
  }, 5000);
}

// Override showMessage to auto-clear
const originalShowMessage = showMessage;
showMessage = function (text, type) {
  originalShowMessage(text, type);
  clearMessageAfterDelay();
};
