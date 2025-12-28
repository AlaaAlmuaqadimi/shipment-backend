"use strict";

window.AppData = window.AppData || {
  exchangeRate: 7.0,
  orders: [],
  batches: []
};

let currentOrderFilter = "all";
let ordersMounted = false;

/* ========= Helpers (use global if exists) ========= */
function formatMoney(v) {
  if (typeof window.formatMoney === "function" && window.formatMoney !== formatMoney) {
    return window.formatMoney(v);
  }
  return (Number(v || 0)).toFixed(2) + " د.ل";
}

function renderStatusPill(status) {
  if (typeof window.renderStatusPill === "function" && window.renderStatusPill !== renderStatusPill) {
    return window.renderStatusPill(status);
  }
  if (status === "pending") return '<span class="status-pill status-pending">معلقة</span>';
  if (status === "delivered") return '<span class="status-pill status-done">مستلمة</span>';
  if (status === "cancelled") return '<span class="status-pill status-cancelled">ملغاة</span>';
  return status || "-";
}

/* ========= Filters ========= */
function filterOrders(status) {
  currentOrderFilter = status;

  const chipsWrap = document.querySelector(".filter-chips");
  if (chipsWrap) {
    chipsWrap.querySelectorAll(".chip").forEach(chip => chip.classList.remove("active"));

    const byData = chipsWrap.querySelector(`.chip[data-filter="${status}"]`);
    if (byData) byData.classList.add("active");
    else {
      const map = { all: 0, pending: 1, delivered: 2, cancelled: 3 };
      const chips = chipsWrap.querySelectorAll(".chip");
      if (chips[map[status]]) chips[map[status]].classList.add("active");
    }
  }

  renderOrdersTable();
}

/* ========= Render Orders Table ========= */
function renderOrdersTable() {
  const body = document.getElementById("orders-table");
  if (!body) return;

  body.innerHTML = "";

  const searchTerm = (document.getElementById("orders-search")?.value || "")
    .toLowerCase()
    .trim();

  let list = window.AppData.orders || [];

  if (currentOrderFilter !== "all") {
    list = list.filter(o => o.status === currentOrderFilter);
  }

  if (searchTerm) {
    list = list.filter(
      o =>
        (o.product || "").toLowerCase().includes(searchTerm) ||
        (o.customer || "").toLowerCase().includes(searchTerm)
    );
  }

  if (!list.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="9" class="muted">لا توجد طلبات.</td>`;
    body.appendChild(tr);
    return;
  }

  list.forEach(o => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td data-label="المنتج">${o.product || "-"}</td>
      <td data-label="المستلم">${o.customer || "-"}</td>
      <td data-label="الهاتف">${o.phone || "-"}</td>
      <td data-label="الشحنة">${o.batchId || "-"}</td>
      <td data-label="سعر الشراء (د.ل)">${formatMoney(o.costLyd || 0)}</td>
      <td data-label="سعر البيع (د.ل)">${formatMoney(o.sellLyd || 0)}</td>
      <td data-label="الربح (د.ل)">${formatMoney(o.profitLyd || 0)}</td>
      <td data-label="الحالة">${renderStatusPill(o.status)}</td>
      <td data-label="تحكم" class="table-actions">
        <button class="icon-btn" onclick="showOrderDetails(${o.id})">تفاصيل</button>
        <button class="icon-btn" onclick="toggleOrderStatus(${o.id})">تغيير الحالة</button>
        <button class="icon-btn danger" onclick="deleteOrder(${o.id})">حذف</button>
      </td>
    `;

    body.appendChild(tr);
  });
}

/* ========= Order Actions ========= */
function showOrderDetails(id) {
  const order = (window.AppData.orders || []).find(o => o.id === id);
  if (!order) return;

  alert(
    "تفاصيل الطلب:\n" +
      "المنتج: " + (order.product || "-") + "\n" +
      "المستلم: " + (order.customer || "-") + "\n" +
      "الهاتف: " + (order.phone || "-") + "\n" +
      "الشحنة: " + (order.batchId || "-") + "\n" +
      "تكلفة الشراء: " + formatMoney(order.costLyd || 0) + "\n" +
      "سعر البيع: " + formatMoney(order.sellLyd || 0) + "\n" +
      "الربح: " + formatMoney(order.profitLyd || 0) + "\n" +
      "الحالة: " + (order.status || "-")
  );
}

function toggleOrderStatus(id) {
  const order = (window.AppData.orders || []).find(o => o.id === id);
  if (!order) return;

  if (order.status === "pending") order.status = "delivered";
  else if (order.status === "delivered") order.status = "cancelled";
  else order.status = "pending";

  renderOrdersTable();
  window.dispatchEvent(new CustomEvent("data:changed", { detail: { source: "orders" } }));
}

function deleteOrder(id) {
  const list = window.AppData.orders || [];
  const idx = list.findIndex(o => o.id === id);
  if (idx === -1) return;

  if (!confirm("تأكيد حذف الطلب؟")) return;

  list.splice(idx, 1);
  renderOrdersTable();
  window.dispatchEvent(new CustomEvent("data:changed", { detail: { source: "orders" } }));
}

/* ========= Scroll ========= */
function scrollToAddOrder() {
  const el = document.getElementById("add-order-card");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ========= Mount (bind events after page injected) ========= */
function mountOrdersPage() {
  if (ordersMounted) return;
  ordersMounted = true;

  const search = document.getElementById("orders-search");
  if (search) search.addEventListener("input", renderOrdersTable);

  document.querySelectorAll(".filter-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const v = chip.getAttribute("data-filter");
      if (v) filterOrders(v);
    });
  });
}

/* ========= Route Hook ========= */
window.addEventListener("page:loaded", (e) => {
  if (!e || !e.detail || e.detail.route !== "orders") return;

  ordersMounted = false;
  mountOrdersPage();
  renderOrdersTable();
});

/* ========= Expose ========= */
window.filterOrders = filterOrders;
window.renderOrdersTable = renderOrdersTable;
window.showOrderDetails = showOrderDetails;
window.toggleOrderStatus = toggleOrderStatus;
window.deleteOrder = deleteOrder;
window.scrollToAddOrder = scrollToAddOrder;

/* ==============================
   Order Form Calculations (FINAL)
   ============================== */

// هل المستخدم عدّل cost-lyd-1 يدويًا؟
let costLydManuallyEdited = false;

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

// ✅ تنسيق أرقام إنجليزي دائمًا
function toEn2(num) {
  const x = Number(num);
  const v = Number.isFinite(x) ? x : 0;
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function f2(v) {
  return toEn2(v);
}

function getExchangeRate() {
  const r = n(window.AppData?.exchangeRate);
  return r > 0 ? r : 7.0;
}

function setRateBadge() {
  const badge = document.getElementById("current-rate-badge");
  if (badge) badge.textContent = f2(getExchangeRate());
}

function syncSummaryFields() {
  const cost1 = document.getElementById("cost-lyd-1");
  const sell1 = document.getElementById("sell-lyd-1");
  const cost2 = document.getElementById("cost-lyd-2");
  const sell2 = document.getElementById("sell-lyd-2");

  if (cost1 && cost2) cost2.value = f2(cost1.value);
  if (sell1 && sell2) sell2.value = f2(sell1.value);
}

/*
  ✅ حسب طلبك:
  - الربح لا يطلع بالسالب: أي سالب يتحول 0
*/
function updateProfits() {
  const gbpBuy = n(document.getElementById("gbp-buy-input")?.value);
  const gbpSell = n(document.getElementById("gbp-sell-input")?.value);

  const costLyd = n(document.getElementById("cost-lyd-1")?.value);
  const sellLyd = n(document.getElementById("sell-lyd-1")?.value);

  let profitGbp = gbpSell - gbpBuy;
  let profitLyd = sellLyd - costLyd;

  if (profitGbp < 0) profitGbp = 0;
  if (profitLyd < 0) profitLyd = 0;

  const pG1 = document.getElementById("profit-gbp-1");
  const pG2 = document.getElementById("profit-gbp-2");
  const pL1 = document.getElementById("profit-lyd-1");
  const pL2 = document.getElementById("profit-lyd-2");

  if (pG1) pG1.value = f2(profitGbp);
  if (pG2) pG2.value = f2(profitGbp);

  if (pL1) pL1.value = f2(profitLyd);
  if (pL2) pL2.value = f2(profitLyd);
}

function autoFillCostLydIfAllowed() {
  const gbpBuyRaw = document.getElementById("gbp-buy-input")?.value || "";
  const cost1 = document.getElementById("cost-lyd-1");
  if (!cost1) return;

  const rate = getExchangeRate();

  if (!costLydManuallyEdited) {
    const gbpBuy = n(gbpBuyRaw);
    cost1.value = f2(gbpBuy * rate);
  }
}

function updateOrderFormCalculations() {
  setRateBadge();
  autoFillCostLydIfAllowed();
  syncSummaryFields();
  updateProfits();
}

function bindOrderFormEvents() {
  const gbpBuyEl = document.getElementById("gbp-buy-input");
  const gbpSellEl = document.getElementById("gbp-sell-input");
  const cost1El = document.getElementById("cost-lyd-1");
  const sell1El = document.getElementById("sell-lyd-1");

  if (gbpBuyEl) gbpBuyEl.addEventListener("input", updateOrderFormCalculations);
  if (gbpSellEl) gbpSellEl.addEventListener("input", updateOrderFormCalculations);

  if (cost1El) {
    cost1El.addEventListener("input", () => {
      costLydManuallyEdited = true;
      updateOrderFormCalculations();
    });
  }

  if (sell1El) sell1El.addEventListener("input", updateOrderFormCalculations);
}

function populateBatchSelect() {
  const sel = document.getElementById("batch-select");
  if (!sel) return;

  const first = sel.querySelector('option[value=""]');
  sel.innerHTML = "";
  if (first) sel.appendChild(first);
  else {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "بدون شحنة";
    sel.appendChild(opt);
  }

  (window.AppData.batches || []).forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.id || b.batchId || b.batch_id || "";
    opt.textContent = opt.value || "Batch";
    sel.appendChild(opt);
  });
}

function getNextOrderId() {
  try {
    const key = "orderSequence";
    const cur = n(localStorage.getItem(key));
    const next = cur > 0 ? cur + 1 : 1;
    localStorage.setItem(key, String(next));
    return next;
  } catch (e) {
    const list = window.AppData.orders || [];
    const maxId = list.reduce((m, o) => Math.max(m, n(o.id)), 0);
    return maxId + 1;
  }
}

function resetOrderForm() {
  const ids = [
    "product-name-input",
    "gbp-buy-input",
    "gbp-sell-input",
    "cost-lyd-1",
    "sell-lyd-1",
    "profit-gbp-1",
    "profit-lyd-1",
    "customer-name-input",
    "phone-input",
    "address-input",
    "delegate-input"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const batchSel = document.getElementById("batch-select");
  if (batchSel) batchSel.value = "";

  costLydManuallyEdited = false;
  updateOrderFormCalculations();
}

function saveOrder() {
  const product = document.getElementById("product-name-input")?.value?.trim() || "";
  const customer = document.getElementById("customer-name-input")?.value?.trim() || "";
  const phone = document.getElementById("phone-input")?.value?.trim() || "";
  const address = document.getElementById("address-input")?.value?.trim() || "";
  const delegate = document.getElementById("delegate-input")?.value?.trim() || "";
  const batchId = document.getElementById("batch-select")?.value || "";

  const gbpBuy = n(document.getElementById("gbp-buy-input")?.value);
  const gbpSell = n(document.getElementById("gbp-sell-input")?.value);
  const exchangeRate = getExchangeRate();

  const costLyd = n(document.getElementById("cost-lyd-1")?.value);
  const sellLyd = n(document.getElementById("sell-lyd-1")?.value);

  if (!product && !customer) {
    alert("اكتب اسم المنتج أو اسم المستلم على الأقل.");
    return;
  }
  if (gbpBuy <= 0) {
    alert("سعر الشراء بالـGBP لازم يكون أكبر من 0.");
    return;
  }
  if (gbpSell <= 0) {
    alert("سعر البيع بالـGBP لازم يكون أكبر من 0.");
    return;
  }
  if (sellLyd <= 0) {
    alert("اكتب سعر البيع بالليبي (LYD).");
    return;
  }

  let profitGbp = gbpSell - gbpBuy;
  let profitLyd = sellLyd - costLyd;

  // ✅ لا سالب
  if (profitGbp < 0) profitGbp = 0;
  if (profitLyd < 0) profitLyd = 0;

  const order = {
    id: getNextOrderId(),
    product,
    customer,
    phone,
    address,
    batchId: batchId || "",
    delegate,

    gbpBuy,
    gbpSell,
    exchangeRate,

    costLyd,
    sellLyd,
    profitLyd,
    profitGbp,

    status: "pending"
  };

  window.AppData.orders = window.AppData.orders || [];
  window.AppData.orders.unshift(order);

  renderOrdersTable();
  window.dispatchEvent(new CustomEvent("data:changed", { detail: { source: "orders" } }));

  resetOrderForm();
}

/* ========= Hook: عند دخول صفحة orders ========= */
window.addEventListener("page:loaded", (e) => {
  if (!e?.detail || e.detail.route !== "orders") return;

  populateBatchSelect();
  setRateBadge();
  bindOrderFormEvents();
  costLydManuallyEdited = false;

  // يبدأ فورم الحسابات
  updateOrderFormCalculations();
});

// expose for HTML buttons
window.saveOrder = saveOrder;
window.resetOrderForm = resetOrderForm;
