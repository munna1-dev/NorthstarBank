/* Northstar Bank - shared application helpers */
(function () {
  "use strict";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || "");
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function showToast(message, type = "success") {
    let container = qs("#toast-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.textContent = message;
    container.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  async function setupRouteGuard() {
    const path = window.location.pathname.replace(/\\/g, "/");

    const isCustomerPage = /\/customer\//.test(path);
    const isManagementPage = /\/management\//.test(path);

    if (!isCustomerPage && !isManagementPage) return;

    const supabase = window.NorthstarSupabase?.client;

    if (!supabase) {
      window.location.replace("../public/login.html");
      return;
    }

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const session = sessionData?.session;

      if (!session?.user) {
        window.location.replace("../public/login.html");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, status")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile || profile.status !== "active") {
        await supabase.auth.signOut();
        window.location.replace("../public/login.html");
        return;
      }

      const role =
        profile.role === "management" ? "management" : "customer";

      /*
       * Compatibility for existing frontend code.
       * This is NOT the security boundary.
       */
      sessionStorage.setItem("northstarRole", role);
      sessionStorage.setItem("northstarUserId", session.user.id);

      if (isCustomerPage && role !== "customer") {
        window.location.replace("../public/login.html");
        return;
      }

      if (isManagementPage && role !== "management") {
        window.location.replace("../public/login.html");
      }
    } catch (error) {
      console.error("[NorthstarBank] Route guard failed:", error);
      window.location.replace("../public/login.html");
    }
  }

  function setupPasswordToggles() {
    qsa("[data-toggle-password]").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-toggle-password");
        const input = document.getElementById(targetId);

        if (!input) return;

        const visible = input.type === "text";
        input.type = visible ? "password" : "text";
        button.textContent = visible ? "Show" : "Hide";
        button.setAttribute("aria-label", visible ? "Show password" : "Hide password");
      });
    });
  }

  function setupMobileNavigation() {
    const toggle = qs("[data-menu-toggle]");
    const nav = qs("[data-mobile-nav]");

    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("is-open", !expanded);
    });
  }

  function setupDismissibleAlerts() {
    qsa("[data-dismiss]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.closest(".alert, .notice, .toast");
        if (target) target.remove();
      });
    });
  }

  function setupModalTriggers() {
    qsa("[data-modal-open]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-modal-open");
        const modal = document.getElementById(id);

        if (!modal) return;

        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
      });
    });

    qsa("[data-modal-close]").forEach((button) => {
      button.addEventListener("click", () => {
        const modal = button.closest(".modal");

        if (!modal) return;

        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      });
    });

    qsa(".modal").forEach((modal) => {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          modal.classList.remove("is-open");
          modal.setAttribute("aria-hidden", "true");
        }
      });
    });
  }

  function setupTabs() {
    qsa("[data-tab-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.getAttribute("data-tab-target");

        qsa("[data-tab-target]").forEach((item) => {
          item.classList.toggle("active", item === button);
          item.setAttribute("aria-selected", item === button ? "true" : "false");
        });

        qsa("[data-tab-panel]").forEach((panel) => {
          panel.hidden = panel.getAttribute("data-tab-panel") !== target;
        });
      });
    });
  }

  function setupDemoLinks() {
    qsa("[data-demo-action]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        showToast(
          element.getAttribute("data-demo-action") || "This feature is simulated in the demo.",
          "info"
        );
      });
    });
  }

  function init() {
    setupRouteGuard();
    setupPasswordToggles();
    setupMobileNavigation();
    setupDismissibleAlerts();
    setupModalTriggers();
    setupTabs();
    setupDemoLinks();

    window.NorthstarApp = {
      qs,
      qsa,
      formatCurrency,
      formatDate,
      showToast
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
