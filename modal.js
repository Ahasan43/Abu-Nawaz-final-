/* ============================================================
   CUSTOMER PROFILE BOTTOM SHEET (HALF-SCREEN SLIDE-UP)
   - Opens when searching customer by phone
   - Drag down to close
   - White header + Rose-Gold border
   - Shows all items for that customer
============================================================ */

const modal = document.getElementById("customerModal");
const modalBody = document.getElementById("customerModalBody");

let startY = 0;
let currentY = 0;
let isDragging = false;

/* ============================
   OPEN MODAL WITH CUSTOMER DATA
============================ */
function openCustomerModal(entries) {
  const customerName = entries[0].name;
  const customerPhone = entries[0].phone;

  let html = `
    <div style="margin-bottom:10px;">
      <strong style="font-size:15px; color:#be123c;">${customerName}</strong><br>
      <span style="font-size:12px; color:#6b7280;">${customerPhone}</span>
    </div>
  `;

  entries.forEach(e => {
    const d = new Date(e.date);
    const dateStr =
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    html += `
      <div style="
        border:1px solid #e5e7eb;
        border-radius:14px;
        padding:10px;
        margin-bottom:10px;
        background:#fff;
        box-shadow:0 4px 12px rgba(0,0,0,0.05);
      ">
        <div style="font-size:13px; font-weight:600; color:#be123c;">
          ${e.itemName}
        </div>

        <div style="font-size:11px; color:#6b7280; margin-top:2px;">
          ${dateStr}
        </div>

        <div style="margin-top:6px; font-size:12px;">
          <strong>Category:</strong> ${e.category || "-"}<br>
          <strong>Issue:</strong> ${e.issue || "-"}<br>
          <strong>Price:</strong> ${(e.price || 0).toFixed(2)}<br>
          <strong>Status:</strong> 
          <span class="${statusClass(e.status)}">${statusLabel(e.status)}</span>
        </div>

        <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn-small btn-secondary" onclick="cycleStatus(${e.id})">Change Status</button>
          <button class="btn-small btn-secondary" onclick="waDirect(${e.id}, 'admin')">WA Admin</button>
          <button class="btn-small btn-secondary" onclick="waDirect(${e.id}, 'customer')">WA Customer</button>
        </div>
      </div>
    `;
  });

  modalBody.innerHTML = html;

  modal.classList.add("show");
}

/* ============================
   DRAG DOWN TO CLOSE
============================ */
modal.addEventListener("touchstart", e => {
  startY = e.touches[0].clientY;
  isDragging = true;
});

modal.addEventListener("touchmove", e => {
  if (!isDragging) return;

  currentY = e.touches[0].clientY;
  const diff = currentY - startY;

  if (diff > 0) {
    modal.style.transform = `translateY(${diff}px)`;
  }
});

modal.addEventListener("touchend", () => {
  isDragging = false;

  const diff = currentY - startY;

  if (diff > 120) {
    closeCustomerModal();
  } else {
    modal.style.transform = "translateY(0)";
  }
});

/* ============================
   CLOSE MODAL
============================ */
function closeCustomerModal() {
  modal.classList.remove("show");
  modal.style.transform = "translateY(0)";
}
