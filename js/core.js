"use strict";

/*
  =============================
  Core Router + Loader (Safe)
  =============================
  - لا يعتمد على nav.html إطلاقاً
  - يحمّل:
      components/header.html -> #header-slot
      components/modals.html -> #modals-slot
  - يحمّل الصفحات:
      pages/<route>.html -> #app-content
  - يطلق event:
      window.dispatchEvent(new CustomEvent("page:loaded",{detail:{route}}))
*/

(function () {
  const ROUTES = {
    dashboard: "dashboard.html",
    orders: "orders.html",
    batches: "batches.html",
    analytics: "analytics.html",
    blocked: "blocked.html",
    settings: "settings.html",
    users: "users.html"
  };

  const DEFAULT_ROUTE = "dashboard";

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
    return await res.text();
  }

  async function loadInto(slotId, url) {
    const slot = document.getElementById(slotId);
    if (!slot) return;

    try {
      const html = await fetchText(url);
      slot.innerHTML = html;
    } catch (err) {
      console.error(err);
      slot.innerHTML = `
        <div class="card">
          <div class="card-title">خطأ في تحميل الملف</div>
          <div class="muted">${url}</div>
        </div>
      `;
    }
  }

  function normalizeRouteFromHash() {
    let h = (location.hash || "").replace("#", "").trim();
    if (!h) return DEFAULT_ROUTE;
    if (h.startsWith("/")) h = h.slice(1);
    if (!ROUTES[h]) return "404";
    return h;
  }

  function setActiveNav(route) {
    // يدعم data-route أو data-page (لو موجود عندك)
    document.querySelectorAll(".nav-btn").forEach(btn => {
      const r = btn.getAttribute("data-route") || btn.getAttribute("data-page");
      if (!r) return;
      btn.classList.toggle("active", r === route);
    });
  }

  function closeMobileNavIfOpen() {
    const tabs = document.getElementById("navTabs") || document.querySelector(".nav-tabs");
    const overlay = document.getElementById("navOverlay") || document.querySelector(".nav-overlay");
    if (tabs) tabs.classList.remove("is-open");
    if (overlay) overlay.classList.remove("is-open");
  }

  let __navClicksBound = false;

function bindNavClicks() {
  if (__navClicksBound) return;
  __navClicksBound = true;

  // ربط واحد فقط على document (event delegation)
  document.addEventListener("click", (e) => {
    const navBtn = e.target.closest(".nav-btn");
    if (navBtn) {
      const r = navBtn.getAttribute("data-route") || navBtn.getAttribute("data-page");
      if (!r) return;
      location.hash = `#${r}`;
      closeMobileNavIfOpen();
      return;
    }

    const sideBtn = e.target.closest(".sidebar-btn[data-route]");
    if (sideBtn) {
      const r = sideBtn.getAttribute("data-route");
      if (!r) return;
      location.hash = `#${r}`;
      closeMobileNavIfOpen();
      return;
    }
  }, { passive: true });
}



  function bindMobileToggle() {
    const toggle = document.getElementById("navToggle");
    const tabs = document.getElementById("navTabs") || document.querySelector(".nav-tabs");
    const overlay = document.getElementById("navOverlay") || document.querySelector(".nav-overlay");

    if (!toggle || !tabs) return;

    toggle.addEventListener("click", () => {
      const open = tabs.classList.toggle("is-open");
      if (overlay) overlay.classList.toggle("is-open", open);
    });

    if (overlay) {
      overlay.addEventListener("click", () => {
        closeMobileNavIfOpen();
      });
    }
  }

  async function renderRoute() {
    const route = normalizeRouteFromHash();
    const app = document.getElementById("app-content");
    if (!app) return;

    if (route === "404") {
      try {
        app.innerHTML = await fetchText("pages/404.html");
      } catch {
        app.innerHTML = `<div class="card"><div class="card-title">404</div><div class="muted">الصفحة غير موجودة</div></div>`;
      }
      setActiveNav(""); // لا تفعيل
      window.dispatchEvent(new CustomEvent("page:loaded", { detail: { route: "404" } }));
      return;
    }

    const pageFile = ROUTES[route];

    try {
      app.innerHTML = await fetchText(`pages/${pageFile}`);
    } catch (err) {
      console.error(err);
      app.innerHTML = `
        <div class="card">
          <div class="card-title">تعذر تحميل الصفحة</div>
          <div class="muted">pages/${pageFile}</div>
        </div>
      `;
    }

    // بعد ما تنحقن الصفحة: فعل الـ nav وأعد الربط
    setActiveNav(route); 

    // أبلغ بقية الموديولات
    window.dispatchEvent(new CustomEvent("page:loaded", { detail: { route } }));
  }

  async function boot() {
    // حمّل الهيدر + المودالز
    await loadInto("header-slot", "components/header.html");
    await loadInto("modals-slot", "components/modals.html");

    // لو ما عندك overlay في header.html أنشئه تلقائياً (اختياري)
    if (!document.getElementById("navOverlay")) {
      const div = document.createElement("div");
      div.id = "navOverlay";
      div.className = "nav-overlay";
      document.body.appendChild(div);
    }
 
    bindNavClicks();
    bindMobileToggle();


    // لو ما فيش هاش: روح داشبورد
    if (!location.hash || location.hash === "#") {
      location.hash = `#${DEFAULT_ROUTE}`;
      return; // سيعاد استدعاء renderRoute عبر hashchange
    }

    await renderRoute();
  }

  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("DOMContentLoaded", boot);

  // إتاحة بسيطة (لو احتجتها)
  window.AppCore = {
    renderRoute,
    setActiveNav,
    closeMobileNavIfOpen
  };
})();
