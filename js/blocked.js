"use strict";

/*
  =============================
  Blocked Customers Module (Front Only)
  =============================
  يعتمد على عناصر الصفحة:
    - #blocked-name
    - #blocked-phone
    - #blocked-reason
    - #blocked-search
    - #blocked-count
    - #blocked-table
*/

window.BlockedData = window.BlockedData || {
  blockedCustomers: [] // in-memory only
};

/* ========= Helpers ========= */
function normalizePhone(p) {
  return String(p || "").replace(/\s+/g, "").trim();
}

/* ========= Reset Form ========= */
function resetBlockedForm() {
  const nameEl = document.getElementById("blocked-name");
  const phoneEl = document.getElementById("blocked-phone");
  const reasonEl = document.getElementById("blocked-reason");

  if (nameEl) nameEl.value = "";
  if (phoneEl) phoneEl.value = "";
  if (reasonEl) reasonEl.value = "";
}

/* ========= Add Blocked Customer ========= */
function addBlockedCustomer() {
  const name = (document.getElementById("blocked-name")?.value || "").trim();
  const phone = normalizePhone(document.getElementById("blocked-phone")?.value || "");
  const reason = (document.getElementById("blocked-reason")?.value || "").trim();

  if (!name && !phone) {
    alert("لازم تدخل على الأقل الاسم أو رقم الهاتف ✅");
    return;
  }

  const arr = window.BlockedData.blockedCustomers || [];
  const id = arr.length ? (arr[arr.length - 1].id + 1) : 1;

  arr.push({
    id,
    name: name || "(بدون اسم)",
    phone: phone || "-",
    reason: reason || "-",
    isBlocked: true,
    createdAt: new Date()
  });

  window.BlockedData.blockedCustomers = arr;

  resetBlockedForm();
  renderBlockedTable();
  alert("تم إضافة الزبون إلى قائمة المحظورين 🚫");
}

/* ========= Toggle Status ========= */
function toggleBlockedStatus(id) {
  const arr = window.BlockedData.blockedCustomers || [];
  const item = arr.find(b => b.id === id);
  if (!item) return;

  item.isBlocked = !item.isBlocked;
  renderBlockedTable();
}

/* ========= Delete Record ========= */
function deleteBlockedCustomer(id) {
  const arr = window.BlockedData.blockedCustomers || [];
  const idx = arr.findIndex(b => b.id === id);
  if (idx === -1) return;

  if (!confirm("تأكيد حذف السجل من القائمة؟")) return;

  arr.splice(idx, 1);
  window.BlockedData.blockedCustomers = arr;
  renderBlockedTable();
}

/* ========= Render Table ========= */
function renderBlockedTable() {
  const body = document.getElementById("blocked-table");
  const countEl = document.getElementById("blocked-count");
  const searchTerm = (document.getElementById("blocked-search")?.value || "")
    .toLowerCase()
    .trim();

  if (!body) return;

  const arr = window.BlockedData.blockedCustomers || [];
  body.innerHTML = "";

  // عدد المحظورين الحقيقي
  if (countEl) {
    countEl.textContent = arr.filter(b => b.isBlocked).length;
  }

  // فلترة بحث
  let filtered = arr;
  if (searchTerm) {
    filtered = arr.filter(b => {
      const n = (b.name || "").toLowerCase();
      const p = normalizePhone(b.phone).toLowerCase();
      return n.includes(searchTerm) || p.includes(searchTerm);
    });
  }

  if (!filtered.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="muted">لا توجد بيانات مطابقة.</td>`;
    body.appendChild(tr);
    return;
  }

  filtered.forEach(b => {
    const tr = document.createElement("tr");

    // ✅ data-label لكل td (مهم للموبايل)
    tr.innerHTML = `
      <td data-label="الاسم">${b.name}</td>
      <td data-label="الهاتف">${b.phone}</td>
      <td data-label="السبب">${b.reason}</td>
      <td data-label="الحالة">${
        b.isBlocked
          ? '<span class="status-pill status-blocked">محظور</span>'
          : '<span class="status-pill status-done">مسموح</span>'
      }</td>
      <td data-label="تحكم" class="table-actions">
        <button class="icon-btn" onclick="toggleBlockedStatus(${b.id})">${b.isBlocked ? "إزالة الحظر" : "إعادة الحظر"}</button>
        <button class="icon-btn danger" onclick="deleteBlockedCustomer(${b.id})">حذف</button>
      </td>
    `;

    body.appendChild(tr);
  });
}

/* ========= Route Hook ========= */
window.addEventListener("page:loaded", (e) => {
  if (e.detail.route === "blocked") renderBlockedTable();
});

/* ========= Expose ========= */
window.resetBlockedForm = resetBlockedForm;
window.addBlockedCustomer = addBlockedCustomer;
window.toggleBlockedStatus = toggleBlockedStatus;
window.deleteBlockedCustomer = deleteBlockedCustomer;
window.renderBlockedTable = renderBlockedTable;
