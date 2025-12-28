"use strict";

window.AppData = window.AppData || {
  exchangeRate: 7.0,
  orders: [],
  batches: []
};

function seedDemoDataIfEmpty() {
  const rate = Number(window.AppData.exchangeRate || 7);

  if (!Array.isArray(window.AppData.orders) || !window.AppData.orders.length) {
    window.AppData.orders = [
      {
        id: 1,
        product: "حذاء نايك",
        customer: "أحمد علي",
        phone: "0911111111",
        address: "طرابلس - زاوية الدهماني",
        batchId: "B-1001",
        delegate: "محمد المندوب",
        gbpBuy: 20,
        costLyd: 20 * rate,
        sellLyd: 175,                 // ✅ بيع يدوي بالـ LYD
        profitLyd: 175 - (20 * rate),  // ✅ الربح بالـ LYD فقط
        status: "delivered"
      },
      {
        id: 2,
        product: "شنطة يد",
        customer: "سارة محمد",
        phone: "0922222222",
        address: "بنغازي - الفويهات",
        batchId: "B-1001",
        delegate: "ليلى",
        gbpBuy: 15,
        costLyd: 15 * rate,
        sellLyd: 154,
        profitLyd: 154 - (15 * rate),
        status: "pending"
      },
      {
        id: 3,
        product: "ساعة يد",
        customer: "إبراهيم فتحي",
        phone: "0933333333",
        address: "مصراتة - وسط المدينة",
        batchId: "B-1002",
        delegate: "سالم",
        gbpBuy: 10,
        costLyd: 10 * rate,
        sellLyd: 126,
        profitLyd: 126 - (10 * rate),
        status: "pending"
      }
    ];
  }

  if (!Array.isArray(window.AppData.batches) || !window.AppData.batches.length) {
    window.AppData.batches = [
      {
        id: "B-1001",
        shippingCompanyCode: "ARX-TRP",
        shipDate: "2025-12-20",
        notes: "شحنة تجريبية",
        status: "open",
        batchExtraCostsLyd: 0
      },
      {
        id: "B-1002",
        shippingCompanyCode: "UPS-001",
        shipDate: "2025-12-22",
        notes: "-",
        status: "open",
        batchExtraCostsLyd: 0
      }
    ];
  }
}

seedDemoDataIfEmpty();

// بعد ما تتجهز البيانات، نبلغ النظام
window.dispatchEvent(new CustomEvent("data:changed", { detail: { source: "init" } }));
