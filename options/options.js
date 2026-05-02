const addNewBtn = document.getElementById("addNewBtn");
const templatesList = document.getElementById("templatesList");
const templateModal = document.getElementById("templateModal");
const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const templateForm = document.getElementById("templateForm");
const templateNameInput = document.getElementById("templateName");
const templateUrlInput = document.getElementById("templateUrl");
const modalTitle = document.getElementById("modalTitle");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const messageEl = document.getElementById("message");

let currentEditingId = null;
let currentDeletingId = null;

// Load templates on page load
document.addEventListener("DOMContentLoaded", loadTemplates);

function loadTemplates() {
  chrome.storage.local.get("templates", (result) => {
    const templates = result.templates || [];
    renderTemplates(templates);
  });
}

function renderTemplates(templates) {
  templatesList.innerHTML = "";

  if (templates.length === 0) {
    templatesList.innerHTML =
      '<div class="empty-state"><p>No templates yet. Add one to get started!</p></div>';
    return;
  }

  templates.forEach((template) => {
    const card = document.createElement("div");
    card.className = "template-card";

    const badge = template.editable
      ? ""
      : '<span class="badge">Built-in</span>';

    card.innerHTML = `
      <h3>${escapeHtml(template.name)}</h3>
      ${badge}
      <code>${escapeHtml(template.urlPattern)}</code>
      <div class="template-actions">
        ${
          template.editable
            ? `<button class="btn btn-secondary btn-small edit-btn" data-id="${template.id}">Edit</button>
               <button class="btn btn-danger btn-small delete-btn" data-id="${template.id}">Delete</button>`
            : `<button class="btn btn-secondary btn-small" onclick="return false" disabled>Built-in</button>`
        }
      </div>
    `;

    templatesList.appendChild(card);

    if (template.editable) {
      card
        .querySelector(".edit-btn")
        .addEventListener("click", () => openEditModal(template));
      card
        .querySelector(".delete-btn")
        .addEventListener("click", () => openDeleteConfirm(template));
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Modal handlers
addNewBtn.addEventListener("click", openAddModal);
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
cancelDeleteBtn.addEventListener("click", closeDeleteConfirm);
templateForm.addEventListener("submit", handleSaveTemplate);

function openAddModal() {
  currentEditingId = null;
  modalTitle.textContent = "Add New Template";
  templateNameInput.value = "";
  templateUrlInput.value = "";
  templateNameInput.disabled = false;
  templateModal.classList.remove("hidden");
  templateNameInput.focus();
}

function openEditModal(template) {
  currentEditingId = template.id;
  modalTitle.textContent = `Edit ${template.name}`;
  templateNameInput.value = template.name;
  templateUrlInput.value = template.urlPattern;
  templateNameInput.disabled = true; // Prevent changing ID
  templateModal.classList.remove("hidden");
  templateUrlInput.focus();
}

function closeModal() {
  templateModal.classList.add("hidden");
  currentEditingId = null;
}

function handleSaveTemplate(e) {
  e.preventDefault();

  const name = templateNameInput.value.trim();
  const urlPattern = templateUrlInput.value.trim();

  if (!name || !urlPattern) {
    showMessage("Please fill in all fields", "error");
    return;
  }

  if (!urlPattern.includes("{item}")) {
    showMessage("URL pattern must include {item} placeholder", "error");
    return;
  }

  chrome.storage.local.get("templates", (result) => {
    let templates = result.templates || [];

    if (currentEditingId) {
      // Edit existing
      const index = templates.findIndex((t) => t.id === currentEditingId);
      if (index !== -1) {
        templates[index].urlPattern = urlPattern;
      }
    } else {
      // Add new
      const newId = "custom-" + Date.now();
      templates.push({
        id: newId,
        name: name,
        urlPattern: urlPattern,
        editable: true
      });
    }

    chrome.storage.local.set({ templates: templates }, () => {
      loadTemplates();
      closeModal();
      showMessage(
        currentEditingId ? "Template updated" : "Template added",
        "success"
      );
    });
  });
}

function openDeleteConfirm(template) {
  currentDeletingId = template.id;
  document.getElementById("deleteTemplateName").textContent = template.name;
  deleteConfirmModal.classList.remove("hidden");
}

function closeDeleteConfirm() {
  deleteConfirmModal.classList.add("hidden");
  currentDeletingId = null;
}

confirmDeleteBtn.addEventListener("click", () => {
  if (!currentDeletingId) return;

  chrome.storage.local.get("templates", (result) => {
    let templates = result.templates || [];
    templates = templates.filter((t) => t.id !== currentDeletingId);

    chrome.storage.local.set({ templates: templates }, () => {
      loadTemplates();
      closeDeleteConfirm();
      showMessage("Template deleted", "success");
    });
  });
});

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;

  setTimeout(() => {
    messageEl.className = "message";
  }, 3000);
}
