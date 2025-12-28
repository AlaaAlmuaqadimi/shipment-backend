// =============================
// QS System - settings.js
// =============================

// ========= SETTINGS =========
function updateRateFromSettings() {
  const newRate = parseFloat(document.getElementById("settings-rate").value) || 0;
  if (!newRate) {
    alert("سعر صرف غير صالح");
    return;
  }
  exchangeRate = newRate;
  document.getElementById("current-rate-badge").textContent = newRate.toFixed(2);
  document.getElementById("settings-last-update").value = new Date().toISOString().slice(0, 10);
  recalcOrderTotals();
  alert("تم تحديث سعر الصرف ✅");
}
