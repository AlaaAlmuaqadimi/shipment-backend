"use strict";

/*
  =============================
  Analytics Module (Front Only)
  =============================
  يعتمد على:
    window.AppData = { exchangeRate, orders, batches }
  ويرسم:
    - جدول الربح حسب الشحنة: #analytics-by-batch
    - حقول ملخص الربح:
        #analytics-total-cost
        #analytics-total-sell
        #analytics-total-profit
        #analytics-avg-profit
        #analytics-total-batch-extra
        #analytics-net-profit-after-batch-extra
*/

window.AppData = window.AppData || {
  exchangeRate: 7.0,
  orders: [],
  batches: []
};

function formatMoney(v) {
  return (Number(v || 0)).toFixed(2) + " د.ل";
}

/* ========= Totals Helpers ========= */
function getBatchesWithTotalsForAnalytics() {
  const orders = window.AppData.orders || [];
  const batches = window.AppData.batches || [];

  return batches.map(b => {
    const batchOrders = orders.filter(o => String(o.batchId || "") === String(b.id || ""));

    const totalCost = batchOrders.reduce((sum, o) => sum + (Number(o.costLyd) || 0), 0);
    const totalSell = batchOrders.reduce((sum, o) => sum + (Number(o.sellLyd) || 0), 0);

    // الربح الخام للشحنة = مجموع أرباح الطلبات داخل الشحنة (كل الحالات)
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

/* ========= Render Analytics ========= */
function renderAnalytics() {
  const byBatchBody = document.getElementById("analytics-by-batch");
  if (byBatchBody) byBatchBody.innerHTML = "";

  const batchesTotals = getBatchesWithTotalsForAnalytics();

  // ===== جدول حسب الشحنة =====
  if (byBatchBody) {
    if (!batchesTotals.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" class="muted">لا توجد شحنات لعرضها.</td>`;
      byBatchBody.appendChild(tr);
    } else {
      batchesTotals.forEach(b => {
        const tr = document.createElement("tr");

        // ✅ data-label لكل td (مهم للموبايل)
        tr.innerHTML = `
          <td data-label="الشحنة">${b.id || "-"}</td>
          <td data-label="عدد الطلبات">${b.ordersCount || 0}</td>
          <td data-label="مصاريف خاصة">${formatMoney(b.extraCosts || 0)}</td>
          <td data-label="ربح بعد الخصم">${formatMoney(b.netProfit || 0)}</td>
        `;
        byBatchBody.appendChild(tr);
      });
    }
  }

  // ===== ملخص الربح (الطلبات المستلمة فقط) =====
  const orders = window.AppData.orders || [];
  const batches = window.AppData.batches || [];

  const deliveredOrders = orders.filter(o => o.status === "delivered");

  const totalCost = deliveredOrders.reduce((sum, o) => sum + (Number(o.costLyd) || 0), 0);
  const totalSell = deliveredOrders.reduce((sum, o) => sum + (Number(o.sellLyd) || 0), 0);
  const deliveredProfit = deliveredOrders.reduce((sum, o) => sum + (Number(o.profitLyd) || 0), 0);
  const avgProfit = deliveredOrders.length ? deliveredProfit / deliveredOrders.length : 0;

  // مجموع المصاريف الخاصة للشحنات (كلها)
  const totalBatchExtra = batches.reduce((sum, b) => sum + (Number(b.batchExtraCostsLyd) || 0), 0);

  // الربح بعد خصم مصاريف الشحنات
  const netAfterBatchExtra = deliveredProfit - totalBatchExtra;

  const elCost = document.getElementById("analytics-total-cost");
  const elSell = document.getElementById("analytics-total-sell");
  const elProfit = document.getElementById("analytics-total-profit");
  const elAvg = document.getElementById("analytics-avg-profit");
  const elExtra = document.getElementById("analytics-total-batch-extra");
  const elNet = document.getElementById("analytics-net-profit-after-batch-extra");

  if (elCost) elCost.value = formatMoney(totalCost || 0);
  if (elSell) elSell.value = formatMoney(totalSell || 0);
  if (elProfit) elProfit.value = formatMoney(deliveredProfit || 0);
  if (elAvg) elAvg.value = formatMoney(avgProfit || 0);
  if (elExtra) elExtra.value = formatMoney(totalBatchExtra || 0);
  if (elNet) elNet.value = formatMoney(netAfterBatchExtra || 0);
}

/* ========= Route Hook ========= */
window.addEventListener("page:loaded", (e) => {
  if (e.detail.route === "analytics") renderAnalytics();
});

/* ========= Auto refresh when data changes ========= */
window.addEventListener("data:changed", () => {
  const hash = (location.hash || "#dashboard").replace("#", "");
  if (hash === "analytics") renderAnalytics();
});

/* ========= Expose ========= */
window.renderAnalytics = renderAnalytics;
