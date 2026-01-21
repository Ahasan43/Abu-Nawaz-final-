/* ============================
   STORAGE KE KEYS
============================ */
const STORAGE_KEY = "abuNawazEntries";
const ADMIN_KEY = "abuNawazAdmin";

let currentFilter = "all";

/* ============================
   GET / SAVE ENTRIES
============================ */
function getEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveEntries(entries, showIndicator = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  renderTable();
  updateDashboard();
  if (showIndicator) flashSaved("entrySaved");
}

/* ============================
   ADMIN SETTINGS
============================ */
function getAdmin() {
  const raw = localStorage.getItem(ADMIN_KEY);
  return raw ? JSON.parse(raw) : { whatsapp: "", pin: "" };
}

function saveAdminSettings() {
  const whatsapp = document.getElementById("adminWhatsapp").value.trim();
  const pin = document.getElementById("adminPin").value.trim();

  localStorage.setItem(ADMIN_KEY, JSON.stringify({ whatsapp, pin }));
  flashSaved("adminSaved");
}

function loadAdminSettings() {
  const admin = getAdmin();
  document.getElementById("adminWhatsapp").value = admin.whatsapp || "";
  document.getElementById("adminPin").value = admin.pin || "";
}

/* ============================
   NUMBER CLEANER (WhatsApp FIX)
============================ */
function cleanNumber(num) {
  if (!num) return "";
  let n = num.toString().replace(/[^0-9]/g, "");

  // UAE auto fix: 05xxxxxxxx → 9715xxxxxxxx
  if (n.startsWith("05") && n.length >= 9) {
    n = "971" + n.slice(1);
  }
  return n;
}

/* ============================
   ADD ENTRY
============================ */
function addEntry() {
  const name = document.getElementById("custName").value.trim();
  const phoneRaw = document.getElementById("custPhone").value.trim();
  const phone = cleanNumber(phoneRaw);

  const category = document.getElementById("itemCategory").value;
  const itemName = document.getElementById("itemName").value.trim();
  const price = parseFloat(document.getElementById("itemPrice").value || "0");
  const status = document.getElementById("itemStatus").value;
  const issue = document.getElementById("itemIssue").value.trim();
  const notes = document.getElementById("itemNotes").value.trim();

  if (!name || !phone || !itemName) {
    alert("Customer name, phone aur item name required hain.");
    return;
  }

  const entries = getEntries();
  const now = new Date();

  const entry = {
    id: Date.now(),
    date: now.toISOString(),
    name,
    phone,
    category,
    itemName,
    price,
    status,
    issue,
    notes
  };

  entries.unshift(entry);
  saveEntries(entries, true);

  // Clear item fields only (multiple items allowed)
  document.getElementById("itemCategory").value = "";
  document.getElementById("itemName").value = "";
  document.getElementById("itemPrice").value = "";
  document.getElementById("itemStatus").value = "in";
  document.getElementById("itemIssue").value = "";
  document.getElementById("itemNotes").value = "";
}

/* ============================
   STATUS LABELS
============================ */
function statusLabel(status) {
  if (status === "ready") return "Ready / Out";
  if (status === "returned") return "Returned";
  return "In repair";
}

function statusClass(status) {
  if (status === "ready") return "badge status-ready";
  if (status === "returned") return "badge status-returned";
  return "badge status-in";
}

/* ============================
   RENDER TABLE
============================ */
function renderTable() {
  const entries = getEntries();
  const tbody = document.querySelector("#entriesTable tbody");
  tbody.innerHTML = "";

  entries
    .filter(e => currentFilter === "all" || e.status === currentFilter)
    .forEach((e, index) => {
      const tr = document.createElement("tr");
      const d = new Date(e.date);
      const dateStr =
        d.toLocaleDateString() +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${dateStr}</td>
        <td>${e.name}</td>
        <td>${e.phone}</td>
        <td>${e.itemName}</td>
        <td>${e.category || "-"}</td>
        <td>${e.issue || "-"}</td>
        <td>${(e.price || 0).toFixed(2)}</td>
        <td><span class="${statusClass(e.status)}">${statusLabel(e.status)}</span></td>
        <td>
          <button class="btn-small btn-secondary" onclick="cycleStatus(${e.id})">Status</button>
          <button class="btn-small btn-secondary" onclick="waDirect(${e.id}, 'admin')">WA Admin</button>
          <button class="btn-small btn-secondary" onclick="waDirect(${e.id}, 'customer')">WA Cust</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

/* ============================
   STATUS CYCLE
============================ */
function cycleStatus(id) {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return;

  const current = entries[idx].status;
  let next = "in";

  if (current === "in") next = "ready";
  else if (current === "ready") next = "returned";
  else if (current === "returned") next = "in";

  entries[idx].status = next;
  saveEntries(entries, true);
}

/* ============================
   WHATSAPP MESSAGE BUILDER
============================ */
function buildMessages(entry) {
  const baseMsg =
    `Abu Nawaz Electronic\n` +
    `Customer: ${entry.name}\n` +
    `Phone: ${entry.phone}\n` +
    `Item: ${entry.itemName}\n` +
    `Category: ${entry.category}\n` +
    `Issue: ${entry.issue}\n` +
    `Price: ${entry.price}\n` +
    `Status: ${statusLabel(entry.status)}`;

  return {
    adminText: "Status update:\n" + baseMsg,
    custText: "Your item update:\n" + baseMsg
  };
}

/* ============================
   WHATSAPP DIRECT SEND
============================ */
function waDirect(id, who) {
  const entries = getEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  const admin = getAdmin();
  const { adminText, custText } = buildMessages(entry);

  let number = "";
  let message = "";

  if (who === "admin") {
    number = cleanNumber(admin.whatsapp);
    message = adminText;
  } else {
    number = cleanNumber(entry.phone);
    message = custText;
  }

  if (!number) {
    alert("WhatsApp number missing.");
    return;
  }

  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  window.location.href = url;
}

/* ============================
   SEARCH CUSTOMER (opens modal)
============================ */
function searchCustomer() {
  const phoneRaw = document.getElementById("searchPhone").value.trim();
  const phone = cleanNumber(phoneRaw);

  if (!phone) {
    alert("Phone number enter karein.");
    return;
  }

  const entries = getEntries().filter(e => e.phone.includes(phone));

  if (!entries.length) {
    alert("Is number ka koi record nahi mila.");
    return;
  }

  openCustomerModal(entries);
}

function clearSearch() {
  document.getElementById("searchPhone").value = "";
}

/* ============================
   DASHBOARD (Admin PIN Lock)
============================ */
function openDashboard() {
  const admin = getAdmin();

  if (!admin.pin) {
    alert("Admin PIN set nahi hai.");
    return;
  }

  const pin = prompt("Enter Admin PIN:");

  if (pin !== admin.pin) {
    alert("Wrong PIN.");
    return;
  }

  scrollToSection("entriesCard");
}

/* ============================
   DASHBOARD COUNTS
============================ */
function updateDashboard() {
  const entries = getEntries();
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let total = 0,
    amount = 0,
    inC = 0,
    readyC = 0,
    retC = 0;

  entries.forEach(e => {
    const d = new Date(e.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      total++;
      amount += e.price || 0;

      if (e.status === "in") inC++;
      else if (e.status === "ready") readyC++;
      else if (e.status === "returned") retC++;
    }
  });

  document.getElementById("statTotal") &&
    (document.getElementById("statTotal").textContent = total);
  document.getElementById("statAmount") &&
    (document.getElementById("statAmount").textContent = amount.toFixed(2));
  document.getElementById("statIn") &&
    (document.getElementById("statIn").textContent = inC);
  document.getElementById("statReady") &&
    (document.getElementById("statReady").textContent = readyC);
  document.getElementById("statReturned") &&
    (document.getElementById("statReturned").textContent = retC);
}

/* ============================
   BACKUP / IMPORT
============================ */
function exportData() {
  const data = {
    admin: getAdmin(),
    entries: getEntries()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "abu-nawaz-backup.json";
  a.click();

  URL.revokeObjectURL(url);
}

function importData() {
  const fileInput = document.getElementById("importFile");
  if (!fileInput.files.length) {
    alert("Please select a JSON file.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      if (data.admin) {
        localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
      }
      if (Array.isArray(data.entries)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.entries));
      }

      loadAdminSettings();
      renderTable();
      updateDashboard();

      alert("Data imported successfully.");
    } catch (err) {
      alert("Invalid JSON file.");
    }
  };

  reader.readAsText(file);
}

/* ============================
   RESET ALL DATA
============================ */
function resetAllData() {
  const admin = getAdmin();

  if (!admin.pin) {
    alert("Pehle Admin PIN set karein.");
    return;
  }

  const pin = prompt("Enter Admin PIN to reset:");

  if (pin !== admin.pin) {
    alert("Wrong PIN.");
    return;
  }

  if (!confirm("Kya aap waqai saara data delete karna chahte hain?")) return;

  localStorage.removeItem(STORAGE_KEY);
  renderTable();
  updateDashboard();
}

/* ============================
   FILTER
============================ */
function setFilter(filter, btn) {
  currentFilter = filter;

  document.querySelectorAll(".filter-btn").forEach(b =>
    b.classList.remove("active")
  );

  btn.classList.add("active");
  renderTable();
}

/* ============================
   SCROLL TO SECTION
============================ */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ============================
   INIT
============================ */
loadAdminSettings();
renderTable();
updateDashboard();
