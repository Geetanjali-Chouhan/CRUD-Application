/**
 * PulseCRUD - Clean & Modern Personnel Management System
 * Built with Vanilla JavaScript (ES6+), HTML5, and CSS3
 */

// ==========================================
// 1. Initial Mock Dataset & State Setup
// ==========================================

const INITIAL_DEMO_DATA = [];

const STORAGE_KEY = "pulsecrud_members_v1";
const THEME_KEY = "pulsecrud_theme_pref";

// Application State
const appState = {
  records: [],
  filters: {
    searchQuery: "",
    department: "all",
    status: "all",
    sortBy: "newest"
  },
  viewMode: "table", // "table" | "cards"
  selectedColor: "indigo",
  currentEditingId: null,
  deleteCandidateId: null
};

// ==========================================
// 2. DOM Elements Cache
// ==========================================
const DOM = {
  // Theme & Stats
  body: document.body,
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  statTotal: document.getElementById("statTotal"),
  statActive: document.getElementById("statActive"),
  statActivePct: document.getElementById("statActivePct"),
  statPending: document.getElementById("statPending"),
  statDepartments: document.getElementById("statDepartments"),

  // Controls
  searchInput: document.getElementById("searchInput"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  departmentFilter: document.getElementById("departmentFilter"),
  statusFilter: document.getElementById("statusFilter"),
  sortBySelect: document.getElementById("sortBySelect"),
  tableViewBtn: document.getElementById("tableViewBtn"),
  cardsViewBtn: document.getElementById("cardsViewBtn"),
  resultsCount: document.getElementById("resultsCount"),

  // Data Containers
  tableContainer: document.getElementById("tableContainer"),
  tableBody: document.getElementById("tableBody"),
  cardsContainer: document.getElementById("cardsContainer"),
  emptyState: document.getElementById("emptyState"),
  emptyClearFiltersBtn: document.getElementById("emptyClearFiltersBtn"),
  emptyAddBtn: document.getElementById("emptyAddBtn"),

  // Create / Edit Modal
  recordModal: document.getElementById("recordModal"),
  openCreateModalBtn: document.getElementById("openCreateModalBtn"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelModalBtn: document.getElementById("cancelModalBtn"),
  recordForm: document.getElementById("recordForm"),
  modalTitle: document.getElementById("modalTitle"),
  modalSubtitle: document.getElementById("modalSubtitle"),
  modalIcon: document.getElementById("modalIcon"),
  saveBtnText: document.getElementById("saveBtnText"),
  recordIdInput: document.getElementById("recordId"),
  fullNameInput: document.getElementById("fullName"),
  emailInput: document.getElementById("email"),
  countryCodeSelect: document.getElementById("countryCode"),
  phoneInput: document.getElementById("phone"),
  phoneCounter: document.getElementById("phoneCounter"),
  departmentInput: document.getElementById("department"),
  roleInput: document.getElementById("role"),
  statusInput: document.getElementById("status"),
  salaryInput: document.getElementById("salary"),
  skillsInput: document.getElementById("skillsInput"),
  avatarColorPicker: document.getElementById("avatarColorPicker"),

  // Form Errors
  nameError: document.getElementById("nameError"),
  emailError: document.getElementById("emailError"),
  phoneError: document.getElementById("phoneError"),
  departmentError: document.getElementById("departmentError"),
  roleError: document.getElementById("roleError"),
  salaryError: document.getElementById("salaryError"),

  // Delete Modal
  deleteModal: document.getElementById("deleteModal"),
  deleteTargetName: document.getElementById("deleteTargetName"),
  cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),

  // View Modal
  viewModal: document.getElementById("viewModal"),
  closeViewModalBtn: document.getElementById("closeViewModalBtn"),
  closeViewBtn: document.getElementById("closeViewBtn"),
  editFromViewBtn: document.getElementById("editFromViewBtn"),
  viewModalBody: document.getElementById("viewModalBody"),

  // Toast Container
  toastContainer: document.getElementById("toastContainer")
};

// ==========================================
// 3. Helper & Utility Functions
// ==========================================

/**
 * Generate a unique ID
 */
function generateId() {
  if (window.crypto && window.crypto.randomUUID) {
    return "rec_" + window.crypto.randomUUID().slice(0, 8);
  }
  return "rec_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Get Initials for Avatar (e.g. "Sarah Jenkins" -> "SJ")
 */
function getInitials(name) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format Currency (USD)
 */
function formatCurrency(amount) {
  if (isNaN(amount) || amount === null || amount === "") return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format Date into readable human format (e.g. "Mar 15, 2023")
 */
function formatDate(dateString) {
  if (!dateString) return "Recently";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Validate Email address format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Sanitize strings for safe HTML display
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// 4. Toast Notification Engine
// ==========================================

/**
 * Show animated toast notification
 * @param {string} message - Message text
 * @param {'success'|'info'|'danger'} type - Toast type
 */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let iconName = "ph-check-circle";
  if (type === "danger") iconName = "ph-warning-circle";
  if (type === "info") iconName = "ph-info";

  toast.innerHTML = `
    <i class="ph-bold ${iconName} toast-icon"></i>
    <span>${escapeHtml(message)}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  // Auto-dismiss after 3.2 seconds
  setTimeout(() => {
    toast.classList.add("toast-hiding");
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3200);
}

// ==========================================
// 5. Storage & State Persistence
// ==========================================

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out any pre-populated demo records (rec_1 to rec_6)
        appState.records = parsed.filter(item => !item.id.match(/^rec_[1-6]$/));
        saveRecords();
        return;
      }
    }
  } catch (err) {
    console.error("Error loading records from LocalStorage:", err);
  }

  // Start with empty clean records (no demo data)
  appState.records = [];
  saveRecords();
}

function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.records));
  } catch (err) {
    console.error("Error saving records to LocalStorage:", err);
    showToast("Storage quota exceeded or unavailable.", "danger");
  }
}

// ==========================================
// 6. Analytics & Statistics Calculation
// ==========================================

function updateStatistics() {
  const total = appState.records.length;
  const activeCount = appState.records.filter(r => r.status === "Active").length;
  const pendingCount = appState.records.filter(r => r.status === "On Leave").length;

  const departmentsSet = new Set(appState.records.map(r => r.department).filter(Boolean));
  const deptCount = departmentsSet.size;

  const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  DOM.statTotal.textContent = total;
  DOM.statActive.textContent = activeCount;
  DOM.statActivePct.textContent = `${activePct}% of team`;
  DOM.statPending.textContent = pendingCount;
  DOM.statDepartments.textContent = deptCount;
}

// ==========================================
// 7. Filtering, Searching, & Sorting Engine
// ==========================================

function getFilteredAndSortedRecords() {
  let list = [...appState.records];

  // 1. Text Search query (Name, Email, Department, Role, Skills)
  const query = appState.filters.searchQuery.trim().toLowerCase();
  if (query) {
    list = list.filter(item => {
      const matchName = item.fullName.toLowerCase().includes(query);
      const matchEmail = item.email.toLowerCase().includes(query);
      const matchDept = item.department.toLowerCase().includes(query);
      const matchRole = item.role.toLowerCase().includes(query);
      const matchSkills = Array.isArray(item.skills) && item.skills.some(s => s.toLowerCase().includes(query));
      return matchName || matchEmail || matchDept || matchRole || matchSkills;
    });
  }

  // 2. Department filter
  if (appState.filters.department !== "all") {
    list = list.filter(item => item.department.toLowerCase() === appState.filters.department.toLowerCase());
  }

  // 3. Status filter
  if (appState.filters.status !== "all") {
    list = list.filter(item => item.status.toLowerCase() === appState.filters.status.toLowerCase());
  }

  // 4. Sorting
  switch (appState.filters.sortBy) {
    case "newest":
      list.sort((a, b) => new Date(b.joinedDate || 0) - new Date(a.joinedDate || 0));
      break;
    case "oldest":
      list.sort((a, b) => new Date(a.joinedDate || 0) - new Date(b.joinedDate || 0));
      break;
    case "name-asc":
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
      break;
    case "name-desc":
      list.sort((a, b) => b.fullName.localeCompare(a.fullName));
      break;
    case "salary-desc":
      list.sort((a, b) => (Number(b.salary) || 0) - (Number(a.salary) || 0));
      break;
    default:
      break;
  }

  return list;
}

// ==========================================
// 8. View Rendering (Table & Cards)
// ==========================================

function getStatusBadgeHtml(status) {
  let badgeClass = "status-inactive";
  if (status === "Active") badgeClass = "status-active";
  if (status === "On Leave") badgeClass = "status-leave";

  return `
    <span class="status-pill ${badgeClass}">
      <span class="status-dot"></span>
      ${escapeHtml(status || "Unknown")}
    </span>
  `;
}

function renderTableRows(records) {
  DOM.tableBody.innerHTML = "";

  records.forEach(member => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", member.id);

    const initials = getInitials(member.fullName);
    const colorClass = `avatar-${member.avatarColor || "indigo"}`;

    tr.innerHTML = `
      <td>
        <div class="user-cell">
          <div class="avatar ${colorClass}">${initials}</div>
          <div>
            <div class="user-name">${escapeHtml(member.fullName)}</div>
            <div class="user-salary">${formatCurrency(member.salary)} / yr</div>
          </div>
        </div>
      </td>
      <td>
        <div class="role-title">${escapeHtml(member.role)}</div>
        <span class="dept-pill">${escapeHtml(member.department)}</span>
      </td>
      <td>
        <a href="mailto:${escapeHtml(member.email)}" class="contact-link" title="Send email">
          <i class="ph ph-envelope-simple"></i> ${escapeHtml(member.email)}
        </a>
        <span class="contact-phone">${escapeHtml(member.phone)}</span>
      </td>
      <td>
        ${getStatusBadgeHtml(member.status)}
      </td>
      <td>
        <span style="color: var(--text-muted); font-size: 0.82rem;">
          <i class="ph ph-calendar-blank"></i> ${formatDate(member.joinedDate)}
        </span>
      </td>
      <td class="text-right">
        <div class="row-actions">
          <button class="action-btn view-btn" data-action="view" data-id="${member.id}" title="View Details">
            <i class="ph ph-eye"></i>
          </button>
          <button class="action-btn edit-btn" data-action="edit" data-id="${member.id}" title="Edit Member">
            <i class="ph ph-pencil-simple"></i>
          </button>
          <button class="action-btn delete-btn" data-action="delete" data-id="${member.id}" title="Delete Member">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      </td>
    `;
    DOM.tableBody.appendChild(tr);
  });
}

function renderCards(records) {
  DOM.cardsContainer.innerHTML = "";

  records.forEach(member => {
    const card = document.createElement("div");
    card.className = "member-card";
    card.setAttribute("data-id", member.id);

    const initials = getInitials(member.fullName);
    const colorClass = `avatar-${member.avatarColor || "indigo"}`;

    const tagsHtml = Array.isArray(member.skills) && member.skills.length > 0
      ? member.skills.map(skill => `<span class="card-tag">${escapeHtml(skill)}</span>`).join("")
      : `<span class="card-tag" style="opacity: 0.6">No skills listed</span>`;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-profile">
          <div class="avatar ${colorClass}">${initials}</div>
          <div>
            <div class="card-name">${escapeHtml(member.fullName)}</div>
            <div class="card-role">${escapeHtml(member.role)}</div>
          </div>
        </div>
        ${getStatusBadgeHtml(member.status)}
      </div>

      <div class="card-meta-list">
        <div class="card-meta-item">
          <i class="ph ph-buildings"></i>
          <span>${escapeHtml(member.department)}</span>
        </div>
        <div class="card-meta-item">
          <i class="ph ph-envelope-simple"></i>
          <span>${escapeHtml(member.email)}</span>
        </div>
        <div class="card-meta-item">
          <i class="ph ph-phone"></i>
          <span>${escapeHtml(member.phone)}</span>
        </div>
        <div class="card-meta-item">
          <i class="ph ph-currency-dollar"></i>
          <span>${formatCurrency(member.salary)} / year</span>
        </div>
      </div>

      <div class="card-tags">
        ${tagsHtml}
      </div>

      <div class="card-footer">
        <span style="font-size: 0.75rem; color: var(--text-subtle);">Joined ${formatDate(member.joinedDate)}</span>
        <div class="row-actions">
          <button class="action-btn view-btn" data-action="view" data-id="${member.id}" title="View Details">
            <i class="ph ph-eye"></i>
          </button>
          <button class="action-btn edit-btn" data-action="edit" data-id="${member.id}" title="Edit Member">
            <i class="ph ph-pencil-simple"></i>
          </button>
          <button class="action-btn delete-btn" data-action="delete" data-id="${member.id}" title="Delete Member">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      </div>
    `;

    DOM.cardsContainer.appendChild(card);
  });
}

/**
 * Main Render function for the UI
 */
function render() {
  const filteredRecords = getFilteredAndSortedRecords();
  const totalCount = filteredRecords.length;

  DOM.resultsCount.innerHTML = `Showing <strong>${totalCount}</strong> of <strong>${appState.records.length}</strong> records`;

  if (totalCount === 0) {
    DOM.tableContainer.style.display = "none";
    DOM.cardsContainer.style.display = "none";
    DOM.emptyState.style.display = "flex";
  } else {
    DOM.emptyState.style.display = "none";
    if (appState.viewMode === "table") {
      DOM.tableContainer.style.display = "block";
      DOM.cardsContainer.style.display = "none";
      renderTableRows(filteredRecords);
    } else {
      DOM.tableContainer.style.display = "none";
      DOM.cardsContainer.style.display = "grid";
      renderCards(filteredRecords);
    }
  }

  updateStatistics();
}

// ==========================================
// 9. Modal Management & Form Handlers
// ==========================================

function updatePhoneCounter() {
  if (!DOM.phoneInput || !DOM.phoneCounter) return;
  const len = DOM.phoneInput.value.length;
  DOM.phoneCounter.textContent = `${len}/10 digits`;
  if (len === 10) {
    DOM.phoneCounter.classList.add("complete");
    if (DOM.phoneError) {
      DOM.phoneError.textContent = "";
    }
    DOM.phoneInput.classList.remove("has-error");
  } else {
    DOM.phoneCounter.classList.remove("complete");
  }
}

function clearErrors() {
  DOM.nameError.textContent = "";
  DOM.emailError.textContent = "";
  DOM.phoneError.textContent = "";
  DOM.departmentError.textContent = "";
  DOM.roleError.textContent = "";
  DOM.salaryError.textContent = "";

  [DOM.fullNameInput, DOM.emailInput, DOM.phoneInput, DOM.departmentInput, DOM.roleInput, DOM.salaryInput].forEach(el => {
    el.classList.remove("has-error");
  });
}

function openCreateModal() {
  clearErrors();
  DOM.recordForm.reset();
  appState.currentEditingId = null;
  DOM.recordIdInput.value = "";

  if (DOM.countryCodeSelect) {
    DOM.countryCodeSelect.value = "+91";
  }
  if (DOM.phoneInput) {
    DOM.phoneInput.value = "";
  }
  updatePhoneCounter();

  DOM.modalTitle.textContent = "Add New Member";
  DOM.modalSubtitle.textContent = "Fill out the member's profile details below.";
  DOM.modalIcon.innerHTML = `<i class="ph ph-user-plus"></i>`;
  DOM.saveBtnText.textContent = "Save Member";

  // Default color
  selectAvatarColor("indigo");

  DOM.recordModal.classList.add("active");
  DOM.fullNameInput.focus();
}

function openEditModal(id) {
  const record = appState.records.find(r => r.id === id);
  if (!record) return;

  clearErrors();
  appState.currentEditingId = id;
  DOM.recordIdInput.value = record.id;
  DOM.fullNameInput.value = record.fullName || "";
  DOM.emailInput.value = record.email || "";

  // Parse Country Code and 10-digit number
  const rawPhone = (record.phone || "").trim();
  let selectedCode = "+91";
  let digitsOnly = "";

  const match = rawPhone.match(/^(\+\d{1,4})\s*(\d+)$/);
  if (match) {
    selectedCode = match[1];
    digitsOnly = match[2].slice(-10);
  } else {
    // Extract all numeric digits
    const allDigits = rawPhone.replace(/\D/g, "");
    digitsOnly = allDigits.slice(-10);
    if (DOM.countryCodeSelect) {
      for (const opt of DOM.countryCodeSelect.options) {
        if (rawPhone.startsWith(opt.value)) {
          selectedCode = opt.value;
          break;
        }
      }
    }
  }

  if (DOM.countryCodeSelect) {
    DOM.countryCodeSelect.value = selectedCode;
    if (!DOM.countryCodeSelect.value) {
      DOM.countryCodeSelect.value = "+91";
    }
  }
  DOM.phoneInput.value = digitsOnly;
  updatePhoneCounter();

  DOM.departmentInput.value = record.department || "";
  DOM.roleInput.value = record.role || "";
  DOM.statusInput.value = record.status || "Active";
  DOM.salaryInput.value = record.salary || "";
  DOM.skillsInput.value = Array.isArray(record.skills) ? record.skills.join(", ") : "";

  selectAvatarColor(record.avatarColor || "indigo");

  DOM.modalTitle.textContent = "Edit Member Profile";
  DOM.modalSubtitle.textContent = "Update this member's details and roles.";
  DOM.modalIcon.innerHTML = `<i class="ph ph-pencil-simple"></i>`;
  DOM.saveBtnText.textContent = "Update Profile";

  DOM.recordModal.classList.add("active");
  DOM.fullNameInput.focus();
}

function closeRecordModal() {
  DOM.recordModal.classList.remove("active");
  clearErrors();
}

function selectAvatarColor(colorName) {
  appState.selectedColor = colorName;
  const chips = DOM.avatarColorPicker.querySelectorAll(".color-chip");
  chips.forEach(chip => {
    if (chip.getAttribute("data-color") === colorName) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });
}

function validateForm() {
  clearErrors();
  let isValid = true;

  const nameVal = DOM.fullNameInput.value.trim();
  const emailVal = DOM.emailInput.value.trim();
  const phoneVal = DOM.phoneInput.value.trim();
  const deptVal = DOM.departmentInput.value;
  const roleVal = DOM.roleInput.value.trim();
  const salaryVal = DOM.salaryInput.value.trim();

  // Validate Name
  if (!nameVal) {
    DOM.nameError.textContent = "Full name is required";
    DOM.fullNameInput.classList.add("has-error");
    isValid = false;
  } else if (nameVal.length < 2) {
    DOM.nameError.textContent = "Name must be at least 2 characters";
    DOM.fullNameInput.classList.add("has-error");
    isValid = false;
  }

  // Validate Email
  if (!emailVal) {
    DOM.emailError.textContent = "Email address is required";
    DOM.emailInput.classList.add("has-error");
    isValid = false;
  } else if (!isValidEmail(emailVal)) {
    DOM.emailError.textContent = "Please enter a valid email format";
    DOM.emailInput.classList.add("has-error");
    isValid = false;
  } else {
    // Check uniqueness (except current record if editing)
    const existing = appState.records.find(r => r.email.toLowerCase() === emailVal.toLowerCase() && r.id !== appState.currentEditingId);
    if (existing) {
      DOM.emailError.textContent = "This email is already in use by another member";
      DOM.emailInput.classList.add("has-error");
      isValid = false;
    }
  }

  // Validate Phone (Must be exactly 10 digits)
  const phoneDigits = phoneVal.replace(/\D/g, "");
  if (!phoneVal) {
    DOM.phoneError.textContent = "Phone number is required";
    DOM.phoneInput.classList.add("has-error");
    isValid = false;
  } else if (phoneDigits.length !== 10) {
    DOM.phoneError.textContent = `Phone number must be exactly 10 digits (currently ${phoneDigits.length}/10)`;
    DOM.phoneInput.classList.add("has-error");
    isValid = false;
  } else if (!/^\d{10}$/.test(phoneDigits)) {
    DOM.phoneError.textContent = "Only numbers (0-9) are allowed";
    DOM.phoneInput.classList.add("has-error");
    isValid = false;
  }

  // Validate Department
  if (!deptVal) {
    DOM.departmentError.textContent = "Please select a department";
    DOM.departmentInput.classList.add("has-error");
    isValid = false;
  }

  // Validate Role
  if (!roleVal) {
    DOM.roleError.textContent = "Job title / role is required";
    DOM.roleInput.classList.add("has-error");
    isValid = false;
  }

  // Validate Salary if entered
  if (salaryVal !== "" && (Number(salaryVal) < 0 || isNaN(Number(salaryVal)))) {
    DOM.salaryError.textContent = "Please enter a positive numeric salary";
    DOM.salaryInput.classList.add("has-error");
    isValid = false;
  }

  return isValid;
}

function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  const rawSkills = DOM.skillsInput.value.trim();
  const parsedSkills = rawSkills
    ? rawSkills.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  // Combine selected country code and 10 digits
  const cleanPhoneDigits = DOM.phoneInput.value.replace(/\D/g, "").slice(0, 10);
  const countryCode = DOM.countryCodeSelect ? DOM.countryCodeSelect.value : "+91";
  const formattedFullPhone = `${countryCode} ${cleanPhoneDigits}`;

  const recordData = {
    fullName: DOM.fullNameInput.value.trim(),
    email: DOM.emailInput.value.trim(),
    phone: formattedFullPhone,
    department: DOM.departmentInput.value,
    role: DOM.roleInput.value.trim(),
    status: DOM.statusInput.value,
    salary: DOM.salaryInput.value ? Number(DOM.salaryInput.value) : 0,
    avatarColor: appState.selectedColor || "indigo",
    skills: parsedSkills
  };

  if (appState.currentEditingId) {
    // UPDATE Operation
    const index = appState.records.findIndex(r => r.id === appState.currentEditingId);
    if (index !== -1) {
      appState.records[index] = {
        ...appState.records[index],
        ...recordData
      };
      saveRecords();
      render();
      closeRecordModal();
      showToast(`Updated profile for ${recordData.fullName}`, "success");
    }
  } else {
    // CREATE Operation
    const newRecord = {
      id: generateId(),
      ...recordData,
      joinedDate: new Date().toISOString().split("T")[0]
    };
    appState.records.unshift(newRecord);
    saveRecords();
    render();
    closeRecordModal();
    showToast(`Added new member: ${newRecord.fullName}`, "success");
  }
}

// ==========================================
// 10. Delete Confirmation Dialog
// ==========================================

function promptDelete(id) {
  const record = appState.records.find(r => r.id === id);
  if (!record) return;

  appState.deleteCandidateId = id;
  DOM.deleteTargetName.textContent = record.fullName;
  DOM.deleteModal.classList.add("active");
}

function closeDeleteModal() {
  DOM.deleteModal.classList.remove("active");
  appState.deleteCandidateId = null;
}

function executeDelete() {
  if (!appState.deleteCandidateId) return;

  const targetId = appState.deleteCandidateId;
  const record = appState.records.find(r => r.id === targetId);
  const deletedName = record ? record.fullName : "Member";

  // DELETE Operation
  appState.records = appState.records.filter(r => r.id !== targetId);
  saveRecords();
  render();
  closeDeleteModal();
  showToast(`Removed ${deletedName} from team directory`, "info");
}

// ==========================================
// 11. View Member Details Dialog
// ==========================================

function openViewModal(id) {
  const member = appState.records.find(r => r.id === id);
  if (!member) return;

  const initials = getInitials(member.fullName);
  const colorClass = `avatar-${member.avatarColor || "indigo"}`;

  const skillsChips = Array.isArray(member.skills) && member.skills.length > 0
    ? member.skills.map(s => `<span class="card-tag">${escapeHtml(s)}</span>`).join("")
    : `<span style="font-size: 0.8rem; color: var(--text-muted)">None listed</span>`;

  DOM.viewModalBody.innerHTML = `
    <div class="view-hero">
      <div class="avatar ${colorClass}">${initials}</div>
      <h3 class="view-name">${escapeHtml(member.fullName)}</h3>
      <p class="view-role">${escapeHtml(member.role)} &bull; ${escapeHtml(member.department)}</p>
      <div style="margin-top: 0.4rem;">
        ${getStatusBadgeHtml(member.status)}
      </div>
    </div>

    <div class="view-details-list">
      <div class="view-detail-row">
        <span class="view-label"><i class="ph ph-envelope-simple"></i> Work Email</span>
        <span class="view-val"><a href="mailto:${escapeHtml(member.email)}" style="color: var(--primary); text-decoration: none;">${escapeHtml(member.email)}</a></span>
      </div>

      <div class="view-detail-row">
        <span class="view-label"><i class="ph ph-phone"></i> Phone</span>
        <span class="view-val">${escapeHtml(member.phone)}</span>
      </div>

      <div class="view-detail-row">
        <span class="view-label"><i class="ph ph-currency-dollar"></i> Compensation</span>
        <span class="view-val">${formatCurrency(member.salary)} / year</span>
      </div>

      <div class="view-detail-row">
        <span class="view-label"><i class="ph ph-calendar-blank"></i> Join Date</span>
        <span class="view-val">${formatDate(member.joinedDate)}</span>
      </div>

      <div style="margin-top: 0.5rem;">
        <span class="view-label" style="margin-bottom: 0.4rem; display: block;"><i class="ph ph-tag"></i> Competencies & Skills</span>
        <div class="card-tags">${skillsChips}</div>
      </div>
    </div>
  `;

  DOM.editFromViewBtn.onclick = () => {
    closeViewModal();
    openEditModal(member.id);
  };

  DOM.viewModal.classList.add("active");
}

function closeViewModal() {
  DOM.viewModal.classList.remove("active");
}

// ==========================================
// 12. Theme Controller
// ==========================================

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  document.body.setAttribute("data-theme", savedTheme);
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  showToast(`Switched to ${newTheme} theme`, "info");
}

// ==========================================
// 14. Event Listeners Setup
// ==========================================

function setupEventListeners() {
  // Theme Toggle
  DOM.themeToggleBtn.addEventListener("click", toggleTheme);

  // Search input live handler
  DOM.searchInput.addEventListener("input", (e) => {
    appState.filters.searchQuery = e.target.value;
    DOM.clearSearchBtn.style.display = e.target.value ? "flex" : "none";
    render();
  });

  DOM.clearSearchBtn.addEventListener("click", () => {
    DOM.searchInput.value = "";
    appState.filters.searchQuery = "";
    DOM.clearSearchBtn.style.display = "none";
    render();
  });

  // Filter Dropdowns
  DOM.departmentFilter.addEventListener("change", (e) => {
    appState.filters.department = e.target.value;
    render();
  });

  DOM.statusFilter.addEventListener("change", (e) => {
    appState.filters.status = e.target.value;
    render();
  });

  DOM.sortBySelect.addEventListener("change", (e) => {
    appState.filters.sortBy = e.target.value;
    render();
  });

  // View Toggle (Table vs Cards)
  DOM.tableViewBtn.addEventListener("click", () => {
    appState.viewMode = "table";
    DOM.tableViewBtn.classList.add("active");
    DOM.cardsViewBtn.classList.remove("active");
    render();
  });

  DOM.cardsViewBtn.addEventListener("click", () => {
    appState.viewMode = "cards";
    DOM.cardsViewBtn.classList.add("active");
    DOM.tableViewBtn.classList.remove("active");
    render();
  });

  // Modal Open/Close
  DOM.openCreateModalBtn.addEventListener("click", openCreateModal);
  DOM.emptyAddBtn.addEventListener("click", openCreateModal);
  DOM.closeModalBtn.addEventListener("click", closeRecordModal);
  DOM.cancelModalBtn.addEventListener("click", closeRecordModal);

  // Clear filters from empty state
  DOM.emptyClearFiltersBtn.addEventListener("click", () => {
    DOM.searchInput.value = "";
    DOM.clearSearchBtn.style.display = "none";
    DOM.departmentFilter.value = "all";
    DOM.statusFilter.value = "all";
    appState.filters.searchQuery = "";
    appState.filters.department = "all";
    appState.filters.status = "all";
    render();
  });

  // Color chips click
  DOM.avatarColorPicker.addEventListener("click", (e) => {
    const chip = e.target.closest(".color-chip");
    if (chip) {
      selectAvatarColor(chip.getAttribute("data-color"));
    }
  });

  // Phone input restrictions: only digits, max 10, live counter
  DOM.phoneInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
    updatePhoneCounter();
  });

  DOM.phoneInput.addEventListener("keydown", (e) => {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter", "Home", "End"];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    // Block anything that is not a numeric digit 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  });

  DOM.phoneInput.addEventListener("paste", (e) => {
    setTimeout(() => {
      DOM.phoneInput.value = DOM.phoneInput.value.replace(/\D/g, "").slice(0, 10);
      updatePhoneCounter();
    }, 0);
  });

  // Form Submission
  DOM.recordForm.addEventListener("submit", handleFormSubmit);

  // Table & Card Action Buttons Delegation
  const handleActionClick = (e) => {
    const btn = e.target.closest(".action-btn");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");

    if (action === "edit") {
      openEditModal(id);
    } else if (action === "delete") {
      promptDelete(id);
    } else if (action === "view") {
      openViewModal(id);
    }
  };

  DOM.tableBody.addEventListener("click", handleActionClick);
  DOM.cardsContainer.addEventListener("click", handleActionClick);

  // Delete Modal Buttons
  DOM.cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  DOM.confirmDeleteBtn.addEventListener("click", executeDelete);

  // View Modal Close
  DOM.closeViewModalBtn.addEventListener("click", closeViewModal);
  DOM.closeViewBtn.addEventListener("click", closeViewModal);

  // Click outside modal backdrop to close
  [DOM.recordModal, DOM.deleteModal, DOM.viewModal].forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  });

  // Keyboard accessibility (ESC closes modals)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeRecordModal();
      closeDeleteModal();
      closeViewModal();
    }
  });
}

// ==========================================
// 15. Application Bootstrapper
// ==========================================

function initApp() {
  initTheme();
  loadRecords();
  setupEventListeners();
  render();
  console.log("PulseCRUD application initialized successfully.");
}

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);
