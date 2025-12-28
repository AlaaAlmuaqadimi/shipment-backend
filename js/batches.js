"use strict";

/*
  =============================
  Batches Module (Front Only)
  =============================
  يعتمد على:
    window.AppData = { exchangeRate, orders, batches }
  ويرسم:
    - جدول الشحنات: #batches-table
    - تفاصيل الشحنة: #batch-details-table + #batch-details-sub
  ويدير:
    - modal create/edit: #batch-modal
*/

window.AppData = window.AppData || {
  exchangeRate: 7.0,
  orders: [],
  batches: []
};

/* ========= LocalStorage Key (Batches) ========= */
const BATCHES_LS_KEY = "qs_batches_v2";

/* ========= Helpers ========= */
function safeText(v) {
  return (v === null || v === undefined || v === "") ? "-" : String(v);
}

function formatMoney(v) {
  return (Number(v || 0)).toFixed(2) + " د.ل";
}

function renderOrderStatusPill(status) {
  if (status === "pending") return '<span class="status-pill status-pending">معلقة</span>';
  if (status === "delivered") return '<span class="status-pill status-done">مستلمة</span>';
  if (status === "cancelled") return '<span class="status-pill status-cancelled">ملغاة</span>';
  return status || "-";
}

function renderBatchStatusPill(status) {
  if (status === "open") return '<span class="status-pill status-pending">مفتوحة</span>';
  if (status === "closed") return '<span class="status-pill status-done">مغلقة</span>';
  return status || "-";
}

/* ========= Storage ========= */
function loadBatchesFromStorage() {
  try {
    const raw = localStorage.getItem(BATCHES_LS_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;

    // ضمان وجود الحقول الجديدة
    window.AppData.batches = parsed.map(b => ({
      id: safeText(b.id),
      shippingCompanyCode: safeText(b.shippingCompanyCode),
      shipDate: safeText(b.shipDate),
      notes: safeText(b.notes),
      status: (b.status === "closed") ? "closed" : "open",
      batchExtraCostsLyd: Number(b.batchExtraCostsLyd || 0)
    }));

    return true;
  } catch (e) {
    console.warn("Failed to load batches from localStorage:", e);
    return false;
  }
}

function saveBatchesToStorage() {
  try {
    localStorage.setItem(BATCHES_LS_KEY, JSON.stringify(window.AppData.batches || []));
  } catch (e) {
    console.warn("Failed to save batches to localStorage:", e);
  }
}

/* ========= Totals ========= */
function getBatchesWithTotals() {
  const orders = window.AppData.orders || [];
  const batches = window.AppData.batches || [];

  return batches.map(b => {
    const batchOrders = orders.filter(o => String(o.batchId || "") === String(b.id || ""));

    const totalCost = batchOrders.reduce((sum, o) => sum + (Number(o.costLyd) || 0), 0);
    const totalSell = batchOrders.reduce((sum, o) => sum + (Number(o.sellLyd) || 0), 0);

    // الربح الخام = مجموع أرباح الطلبات (كل الحالات أو فقط delivered؟ هنا نعرض كل الطلبات داخل الشحنة)
    const grossProfit = batchOrders.reduce((sum, o) => sum + (Number(o.profitLyd) || 0), 0);

    const extraCosts = Number(b.batchExtraCostsLyd || 0);
    const netProfit = grossProfit - extraCosts;

    return {
      ...b,
      ordersCount: batchOrders.length,
      totalCost,
      totalSell,
      grossProfit,
      extraCosts,
      netProfit
    };
  });
}

/* ========= UI Helpers ========= */
function updateBatchSelectIfExists() {
  const batchSelect = document.getElementById("batch-select");
  if (!batchSelect) return;

  const batches = window.AppData.batches || [];
  batchSelect.innerHTML = '<option value="">بدون شحنة</option>';

  batches.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.id;
    batchSelect.appendChild(opt);
  });
}

/* ========= Render Batches Table ========= */
function renderBatchesTable() {
  const body = document.getElementById("batches-table");
  if (!body) return;

  const totals = getBatchesWithTotals();
  body.innerHTML = "";

  totals.forEach(b => {
    const tr = document.createElement("tr");

    // ✅ data-label لكل td (مهم لتحويل الجدول إلى Cards على الموبايل)
    tr.innerHTML = `
      <td data-label="رقم الشحنة">${safeText(b.id)}</td>
      <td data-label="كود شركة الشحن">${safeText(b.shippingCompanyCode)}</td>
      <td data-label="تاريخ الشحنة">${safeText(b.shipDate)}</td>
      <td data-label="عدد الطلبات">${Number(b.ordersCount || 0)}</td>
      <td data-label="ت. الشراء">${formatMoney(b.totalCost || 0)}</td>
      <td data-label="قيمة البيع">${formatMoney(b.totalSell || 0)}</td>
      <td data-label="الربح">${formatMoney(b.grossProfit || 0)}</td>
      <td data-label="مصاريف خاصة">${formatMoney(b.extraCosts || 0)}</td>
      <td data-label="الربح بعد الخصم"><strong>${formatMoney(b.netProfit || 0)}</strong></td>
      <td data-label="الحالة">${renderBatchStatusPill(b.status)}</td>
      <td data-label="تحكم" class="table-actions">
        <button class="icon-btn" onclick="showBatchDetails('${String(b.id).replace(/'/g, "\\'")}')">عرض</button>
        <button class="icon-btn" onclick="openBatchModal('${String(b.id).replace(/'/g, "\\'")}')">تعديل</button>
      </td>
    `;

    body.appendChild(tr);
  });

  updateBatchSelectIfExists();
}

/* ========= Batch Details ========= */
function showBatchDetails(batchId) {
  const body = document.getElementById("batch-details-table");
  const sub = document.getElementById("batch-details-sub");
  if (!body) return;

  body.innerHTML = "";

  const batches = window.AppData.batches || [];
  const orders = window.AppData.orders || [];

  const batch = batches.find(b => String(b.id) === String(batchId));
  const totals = getBatchesWithTotals().find(x => String(x.id) === String(batchId));

  const header = batch
    ? `شحنة: ${safeText(batchId)} • كود: ${safeText(batch.shippingCompanyCode)} • تاريخ: ${safeText(batch.shipDate)} • مصاريف: ${formatMoney(batch.batchExtraCostsLyd || 0)} • ربح بعد الخصم: ${formatMoney((totals?.netProfit ?? 0))}`
    : `شحنة: ${safeText(batchId)}`;

  if (sub) sub.textContent = header;

  const batchOrders = orders.filter(o => String(o.batchId || "") === String(batchId));
  if (!batchOrders.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="muted">لا توجد طلبات داخل هذه الشحنة.</td>`;
    body.appendChild(tr);
    return;
  }

  batchOrders.forEach(o => {
    const tr = document.createElement("tr");

    // ✅ data-label لكل td
    tr.innerHTML = `
      <td data-label="المنتج">${safeText(o.product)}</td>
      <td data-label="المستلم">${safeText(o.customer)}</td>
      <td data-label="سعر البيع">${formatMoney(o.sellLyd || 0)}</td>
      <td data-label="الربح">${formatMoney(o.profitLyd || 0)}</td>
      <td data-label="الحالة">${renderOrderStatusPill(o.status)}</td>
    `;

    body.appendChild(tr);
  });
}

/* ========= Modal Create/Edit ========= */
let batchModalMode = "create"; // create | edit
let editingBatchId = null;

function openBatchModal(batchId = null) {
  batchModalMode = batchId ? "edit" : "create";
  editingBatchId = batchId || null;

  const overlay = document.getElementById("batch-modal");
  if (!overlay) return;

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");

  const idEl = document.getElementById("batch-id-input");
  const codeEl = document.getElementById("shipping-code-input");
  const dateEl = document.getElementById("ship-date-input");
  const notesEl = document.getElementById("batch-notes-input");
  const statusEl = document.getElementById("batch-status-input");
  const extraEl = document.getElementById("batch-extra-costs-input");

  if (!idEl || !codeEl || !dateEl || !notesEl || !statusEl || !extraEl) return;

  if (batchModalMode === "edit") {
    const b = (window.AppData.batches || []).find(x => String(x.id) === String(batchId));
    if (!b) return;

    idEl.value = b.id;
    idEl.disabled = true;

    codeEl.value = (b.shippingCompanyCode && b.shippingCompanyCode !== "-") ? b.shippingCompanyCode : "";
    dateEl.value = (b.shipDate && b.shipDate !== "-") ? b.shipDate : "";
    notesEl.value = (b.notes && b.notes !== "-") ? b.notes : "";
    statusEl.value = b.status || "open";
    extraEl.value = Number(b.batchExtraCostsLyd || 0);
  } else {
    idEl.value = "";
    idEl.disabled = false;

    codeEl.value = "";
    dateEl.value = new Date().toISOString().slice(0, 10);
    notesEl.value = "";
    statusEl.value = "open";
    extraEl.value = 0;
  }

  setTimeout(() => idEl.focus(), 50);
}

function closeBatchModal() {
  const overlay = document.getElementById("batch-modal");
  if (!overlay) return;

  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function createBatchFromModal() {
  const idEl = document.getElementById("batch-id-input");
  const batchId = (idEl?.value || "").trim();

  const shippingCompanyCode = (document.getElementById("shipping-code-input")?.value || "").trim();
  const shipDate = (document.getElementById("ship-date-input")?.value || "").trim();
  const notes = (document.getElementById("batch-notes-input")?.value || "").trim();
  const status = (document.getElementById("batch-status-input")?.value || "open").trim();

  const extraCostsRaw = document.getElementById("batch-extra-costs-input")?.value;
  const batchExtraCostsLyd = Number(parseFloat(extraCostsRaw) || 0);

  if (!batchId) {
    alert("رقم الشحنة (batchId) مطلوب ✅");
    return;
  }

  const batches = window.AppData.batches || [];

  if (batchModalMode === "create") {
    const exists = batches.some(b => String(b.id).toLowerCase() === batchId.toLowerCase());
    if (exists) {
      alert("رقم الشحنة موجود بالفعل ❌");
      return;
    }

    batches.push({
      id: batchId,
      shippingCompanyCode: shippingCompanyCode || "-",
      shipDate: shipDate || "-",
      notes: notes || "-",
      status: (status === "closed") ? "closed" : "open",
      batchExtraCostsLyd
    });

    window.AppData.batches = batches;
  } else {
    const b = batches.find(x => String(x.id) === String(editingBatchId));
    if (!b) return;

    b.shippingCompanyCode = shippingCompanyCode || "-";
    b.shipDate = shipDate || "-";
    b.notes = notes || "-";
    b.status = (status === "closed") ? "closed" : "open";
    b.batchExtraCostsLyd = batchExtraCostsLyd;
  }

  saveBatchesToStorage();
  renderBatchesTable();

  // لو عندك Dashboard/Analytics يعتمد على batches، نرسل حدث تحديث عام
  window.dispatchEvent(new CustomEvent("data:changed", { detail: { source: "batches" } }));

  closeBatchModal();
  alert(batchModalMode === "create" ? "تم إنشاء الشحنة ✅" : "تم تعديل الشحنة ✅");
}

/* ========= Modal close by outside click ========= */
document.addEventListener("click", (e) => {
  const overlay = document.getElementById("batch-modal");
  if (!overlay) return;
  if (!overlay.classList.contains("is-open")) return;
  if (e.target === overlay) closeBatchModal();
});

/* ========= Modal close by ESC ========= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const overlay = document.getElementById("batch-modal");
    if (overlay && overlay.classList.contains("is-open")) closeBatchModal();
  }
});

/* ========= Route Hook ========= */
function renderBatchesPage() {
  // قبل العرض حاول تحميل من التخزين
  loadBatchesFromStorage();
  renderBatchesTable();

  // إذا كان في تفاصيل مفتوحة مسبقًا (اختياري) ما ندير شيء هنا
}

window.addEventListener("page:loaded", (e) => {
  if (e.detail.route === "batches") renderBatchesPage();
});

/* ========= Expose to window for onclick ========= */
window.openBatchModal = openBatchModal;
window.closeBatchModal = closeBatchModal;
window.createBatchFromModal = createBatchFromModal;
window.showBatchDetails = showBatchDetails;
window.renderBatchesTable = renderBatchesTable;
window.getBatchesWithTotals = getBatchesWithTotals;
