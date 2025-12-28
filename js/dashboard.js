"use strict";

// بيانات تجريبية (Front فقط)
window.AppData = window.AppData || {
  exchangeRate: 7.0,
  orders: [],
  batches: []
};

function formatMoney(v) {
  return (Number(v || 0)).toFixed(2) + " د.ل";
}

function renderStatusPill(status) {
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

function renderDashboard() {
  const { orders, batches } = window.AppData;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const totalProfit = deliveredOrders.reduce((s, o) => s + (o.profitLyd || 0), 0);

  const a = document.getElementById("stat-total-orders");
  const b = document.getElementById("stat-pending-orders");
  const c = document.getElementById("stat-total-profit");
  if (a) a.textContent = totalOrders;
  if (b) b.textContent = pendingOrders;
  if (c) c.textContent = formatMoney(totalProfit);

  // ===== Latest Orders =====
  const latestBody = document.getElementById("dashboard-latest-orders");
  if (latestBody) {
    latestBody.innerHTML = "";

    const latest = orders.slice(-5).reverse();
    if (!latest.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" class="muted">لا توجد طلبات بعد.</td>`;
      latestBody.appendChild(tr);
    } else {
      latest.forEach(o => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td data-label="المنتج">${o.product || "-"}</td>
          <td data-label="المستلم">${o.customer || "-"}</td>
          <td data-label="الربح (د.ل)">${formatMoney(o.profitLyd || 0)}</td>
          <td data-label="الحالة">${renderStatusPill(o.status)}</td>
        `;
        latestBody.appendChild(tr);
      });
    }
  }

  // ===== Batches Summary =====
  const batchesBody = document.getElementById("dashboard-batches");
  if (batchesBody) {
    batchesBody.innerHTML = "";

    if (!batches.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" class="muted">لا توجد شحنات بعد.</td>`;
      batchesBody.appendChild(tr);
    } else {
      batches.forEach(x => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td data-label="رقم الشحنة">${x.id || "-"}</td>
          <td data-label="عدد الطلبيات">${x.ordersCount || 0}</td>
          <td data-label="ربح الشحنة">${formatMoney(x.totalProfit || 0)}</td>
          <td data-label="الحالة">${renderBatchStatusPill(x.status)}</td>
        `;
        batchesBody.appendChild(tr);
      });
    }
  }

  // زر إضافة طلب
  const goAdd = document.getElementById("goAddOrder");
  if (goAdd) {
    goAdd.onclick = () => (location.hash = "#orders");
  }
}

window.addEventListener("page:loaded", (e) => {
  if (e.detail.route === "dashboard") renderDashboard();
});

// تحديث الداشبورد عند تغير البيانات (طلبات/شحنات)
window.addEventListener("data:changed", () => {
  // لو المستخدم واقف على الداشبورد، حدّث فوراً
  const hash = (location.hash || "#dashboard").replace("#", "");
  if (hash === "dashboard") renderDashboard();
});
