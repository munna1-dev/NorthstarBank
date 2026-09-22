/* Northstar Bank - customer portal behavior */
(function () {
  "use strict";

  function getApp() {
    return window.NorthstarApp;
  }

  function getMock() {
    return window.NorthstarMock;
  }

  async function renderAccounts() {
    const app = getApp();
    const target = document.querySelector("#account-list");
    const supabaseState = window.NorthstarSupabase;
    const supabase = supabaseState && supabaseState.client;

    if (!target || !app) return;

    if (!supabase) {
      target.innerHTML = `
        <article class="card">
          <span class="eyebrow">Account data</span>
          <p>Supabase is not configured.</p>
        </article>
      `;
      return;
    }

    target.innerHTML = `
      <article class="card">
        <span class="eyebrow">Loading</span>
        <p>Loading your accounts...</p>
      </article>
    `;

    try {
      const userResult = await supabase.auth.getUser();
      const user = userResult && userResult.data && userResult.data.user;

      if (userResult.error || !user) {
        throw userResult.error || new Error("No authenticated user.");
      }

      const result = await supabase
        .from("accounts")
        .select(
          "id, account_number, account_type, account_name, currency, balance, available_balance, status"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (result.error) {
        throw result.error;
      }

      const accounts = Array.isArray(result.data) ? result.data : [];

      if (!accounts.length) {
        target.innerHTML = `
          <article class="card">
            <span class="eyebrow">Accounts</span>
            <p>No accounts are currently associated with this customer.</p>
          </article>
        `;
      } else {
        target.innerHTML = accounts.map(function (account) {
          const type = String(account.account_type || "account");
          const number = String(account.account_number || "—");
          const balance = Number(account.balance || 0);
          const available = Number(account.available_balance || 0);
          const status = String(account.status || "active");

          return `
            <article class="card">
              <span class="eyebrow">${type}</span>
              <div class="account-number">${number}</div>
              <div class="balance">${app.formatCurrency(balance)}</div>
              <p>Available balance: ${app.formatCurrency(available)}</p>
              <span class="status status-success">${status}</span>
            </article>
          `;
        }).join("");
      }

      const totalBalance = accounts.reduce(function (total, account) {
        return total + Number(account.balance || 0);
      }, 0);

      const totalBalanceElement = document.querySelector(
        ".metric-grid .card:first-child .balance"
      );

      if (totalBalanceElement) {
        totalBalanceElement.textContent = app.formatCurrency(totalBalance);
      }

      const totalBalanceDescription = document.querySelector(
        ".metric-grid .card:first-child p"
      );

      if (totalBalanceDescription) {
        totalBalanceDescription.textContent =
          `Across ${accounts.length} account${accounts.length === 1 ? "" : "s"}`;
      }
    } catch (error) {
      console.error("[NorthstarBank] Failed to load accounts:", error);

      target.innerHTML = `
        <article class="card">
          <span class="eyebrow">Account data</span>
          <p>Unable to load your account information. Please refresh and try again.</p>
        </article>
      `;
    }
  }

  function renderTransactions(transactions) {
    const app = getApp();
    const target = document.querySelector("#transaction-list");

    if (!target || !app) return;

    target.innerHTML = transactions.map(function (txn) {
      const amount = txn.type === "Debit" ? "-" : "+";

      return `
        <tr>
          <td>${app.formatDate(txn.date)}</td>
          <td>${txn.description}</td>
          <td>${txn.category}</td>
          <td>${txn.type}</td>
          <td>${amount}${app.formatCurrency(txn.amount)}</td>
          <td>
            <span class="status status-success">${txn.status}</span>
          </td>
        </tr>
      `;
    }).join("");

    if (!transactions.length) {
      target.innerHTML = `
        <tr>
          <td colspan="6">No transactions match your filters.</td>
        </tr>
      `;
    }
  }

  function setupTransactionFilters() {
    const mock = getMock();

    const search = document.querySelector("#transaction-search");
    const dateFilter = document.querySelector("#transaction-date");
    const categoryFilter = document.querySelector("#transaction-category");
    const statusFilter = document.querySelector("#transaction-status");

    if (!mock || !search || !dateFilter || !categoryFilter || !statusFilter) {
      return;
    }

    function applyFilters() {
      let transactions = mock.transactions.slice();

      const searchValue = search.value.trim().toLowerCase();
      const dateValue = dateFilter.value;
      const categoryValue = categoryFilter.value;
      const statusValue = statusFilter.value;

      if (searchValue) {
        transactions = transactions.filter(function (txn) {
          return [
            txn.description,
            txn.category,
            txn.type,
            txn.status,
            txn.id
          ].some(function (value) {
            return String(value).toLowerCase().includes(searchValue);
          });
        });
      }

      if (dateValue && dateValue !== "all") {
        transactions = transactions.filter(function (txn) {
          const transactionDate = new Date(txn.date);
          const cutoff = new Date();

          if (dateValue === "recent") {
            cutoff.setDate(cutoff.getDate() - 30);
            return transactionDate >= cutoff;
          }

          if (dateValue === "older") {
            cutoff.setDate(cutoff.getDate() - 30);
            return transactionDate < cutoff;
          }

          return true;
        });
      }

      if (categoryValue && categoryValue !== "all") {
        transactions = transactions.filter(function (txn) {
          return txn.category === categoryValue;
        });
      }

      if (statusValue && statusValue !== "all") {
        transactions = transactions.filter(function (txn) {
          return txn.status === statusValue;
        });
      }

      renderTransactions(transactions);
    }

    search.addEventListener("input", applyFilters);
    dateFilter.addEventListener("change", applyFilters);
    categoryFilter.addEventListener("change", applyFilters);
    statusFilter.addEventListener("change", applyFilters);

    applyFilters();
  }

  function setupTransferForm() {
    const app = getApp();
    const form = document.querySelector("#transfer-form");

    if (!form || !app) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const amount = Number(
        document.querySelector("#transfer-amount")?.value || 0
      );

      if (!Number.isFinite(amount) || amount <= 0) {
        app.showToast("Enter a valid demo transfer amount.", "error");
        return;
      }

      const review = document.querySelector("#transfer-review");

      if (!review) return;

      review.hidden = false;

      review.innerHTML = `
        <div class="notice">
          <strong>Review transfer</strong>
          <p>Demo transfer amount: ${app.formatCurrency(amount)}</p>
          <button class="btn btn-primary" type="button" id="confirm-transfer">
            Confirm demo transfer
          </button>
        </div>
      `;

      const confirm = document.querySelector("#confirm-transfer");

      if (confirm) {
        confirm.addEventListener("click", function () {
          app.showToast(
            "Demo transfer confirmed. No money was moved.",
            "success"
          );

          form.reset();
          review.hidden = true;
          review.innerHTML = "";
        });
      }
    });
  }

  function setupBeneficiaryForm() {
    const app = getApp();
    const form = document.querySelector("#beneficiary-form");

    if (!form || !app) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      app.showToast(
        "Demo beneficiary added. No real beneficiary was created.",
        "info"
      );

      form.reset();
    });
  }

  function setupBillForm() {
    const app = getApp();
    const form = document.querySelector("#bill-form");

    if (!form || !app) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      app.showToast(
        "Demo bill payment submitted. No real payment was processed.",
        "info"
      );

      form.reset();
    });
  }

  function setupCardControls() {
    const app = getApp();
    const button = document.querySelector("#save-card-controls");

    if (!button || !app) return;

    button.addEventListener("click", function () {
      app.showToast(
        "Card controls saved in demo mode. No real card settings changed.",
        "success"
      );
    });
  }

  function setupLoanPaymentDemo() {
    const app = getApp();
    const button = document.querySelector("#loan-payment-demo");

    if (!button || !app) return;

    button.addEventListener("click", function () {
      app.showToast(
        "Demo loan payment selected. No real payment was processed.",
        "info"
      );
    });
  }

  function setupLoanCalculator() {
    const app = getApp();
    const form = document.querySelector("#loan-calculator");
    const result = document.querySelector("#loan-result");

    if (!form || !result || !app) return;

    form.addEventListener("input", calculate);

    function calculate() {
      const principal = Number(
        document.querySelector("#loan-principal")?.value || 0
      );

      const annualRate = Number(
        document.querySelector("#loan-rate")?.value || 0
      );

      const years = Number(
        document.querySelector("#loan-years")?.value || 0
      );

      if (
        !Number.isFinite(principal) ||
        principal <= 0 ||
        !Number.isFinite(years) ||
        years <= 0
      ) {
        result.textContent = "$0.00";
        return;
      }

      const monthlyRate = annualRate / 100 / 12;
      const months = years * 12;

      let payment;

      if (monthlyRate === 0) {
        payment = principal / months;
      } else {
        payment =
          principal *
          monthlyRate *
          Math.pow(1 + monthlyRate, months) /
          (Math.pow(1 + monthlyRate, months) - 1);
      }

      result.textContent =
        app.formatCurrency(payment) + " / month";
    }

    calculate();
  }

  function setupContactForm() {
    const app = getApp();
    const form = document.querySelector("#contact-form");

    if (!form || !app) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      app.showToast(
        "Demo message submitted successfully.",
        "success"
      );

      form.reset();
    });
  }

  function createCsv(rows) {
    return rows.map(function (row) {
      return row.map(function (value) {
        return '"' + String(value ?? "").replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\n");
  }

  function downloadCsv(filename, rows) {
    const app = getApp();

    if (!app) return;

    const csv = createCsv(rows);

    const blob = new Blob(
      [csv],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    app.showToast("CSV exported successfully.", "success");
  }

  function setupCsvExports() {
    const mock = getMock();

    if (!mock) return;

    const transactionRows = [
      ["Date", "Description", "Category", "Type", "Amount", "Status"]
    ];

    mock.transactions.forEach(function (txn) {
      transactionRows.push([
        txn.date,
        txn.description,
        txn.category,
        txn.type,
        txn.amount,
        txn.status
      ]);
    });

    const transactionButton = document.querySelector("#export-csv");

    if (transactionButton) {
      transactionButton.addEventListener("click", function () {
        downloadCsv(
          "northstar-demo-transactions.csv",
          transactionRows
        );
      });
    }

    const statementButton =
      document.querySelector("#export-statement-csv");

    if (statementButton) {
      statementButton.addEventListener("click", function () {
        downloadCsv(
          "northstar-demo-statement.csv",
          transactionRows
        );
      });
    }

    const savingsButton =
      document.querySelector("#export-savings-csv");

    if (savingsButton) {
      savingsButton.addEventListener("click", function () {
        const savings = mock.transactions.filter(function (txn) {
          return txn.category === "Interest" || txn.type === "Credit";
        });

        const rows = [
          ["Date", "Description", "Category", "Type", "Amount", "Status"]
        ];

        savings.forEach(function (txn) {
          rows.push([
            txn.date,
            txn.description,
            txn.category,
            txn.type,
            txn.amount,
            txn.status
          ]);
        });

        downloadCsv(
          "northstar-demo-savings.csv",
          rows
        );
      });
    }
  }

  function setupProfileForm() {
    const app = getApp();
    const form = document.querySelector("#profile-form");

    if (!form || !app) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      app.showToast(
        "Profile information saved in demo mode. No real account was changed.",
        "success"
      );
    });

    const preferences = document.querySelector("#save-preferences");

    if (preferences) {
      preferences.addEventListener("click", function () {
        app.showToast(
          "Communication preferences saved in demo mode.",
          "success"
        );
      });
    }
  }

  function setupSettings() {
    const app = getApp();

    if (!app) return;

    const controls = [
      [
        "#save-security-settings",
        "Security settings saved in demo mode."
      ],
      [
        "#save-notification-settings",
        "Notification settings saved in demo mode."
      ],
      [
        "#save-display-settings",
        "Display settings saved in demo mode."
      ]
    ];

    controls.forEach(function (item) {
      const button = document.querySelector(item[0]);

      if (!button) return;

      button.addEventListener("click", function () {
        app.showToast(item[1], "success");
      });
    });
  }

  function setupPrint() {
    document.querySelectorAll("[data-print]").forEach(function (button) {
      button.addEventListener("click", function () {
        window.print();
      });
    });
  }

  function setupInteractiveCustomerButtons() {
    /*
     * These handlers keep the current demo UI functional.
     * They are intentionally isolated so they can later be replaced
     * by repository/service calls backed by Supabase.
     */

    document.querySelectorAll("[data-beneficiary-action]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();

        const action = button.getAttribute("data-beneficiary-action");
        const name = button.getAttribute("data-beneficiary-name") || "beneficiary";

        if (action === "edit") {
          window.NorthstarApp.showToast(
            "Edit mode opened for " + name + ". Supabase beneficiary editing will be connected later.",
            "info"
          );
          return;
        }

        if (action === "remove") {
          const confirmed = window.confirm(
            "Remove the demo beneficiary for " + name + "?"
          );

          if (confirmed) {
            window.NorthstarApp.showToast(
              "Demo beneficiary " + name + " removed from the simulated view.",
              "success"
            );
          }
        }
      });
    });

    document.querySelectorAll("[data-card-action]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();

        const action = button.getAttribute("data-card-action");
        const cardName = button.getAttribute("data-card-name") || "card";

        if (action === "freeze") {
          const confirmed = window.confirm(
            "Freeze the demo " + cardName + "?"
          );

          if (confirmed) {
            window.NorthstarApp.showToast(
              cardName + " is now marked for freezing in the demo.",
              "success"
            );
          }

          return;
        }

        if (action === "details") {
          window.NorthstarApp.showToast(
            "Card details opened for " + cardName + ".",
            "info"
          );
        }
      });
    });

    document.querySelectorAll("[data-loan-action]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();

        const action = button.getAttribute("data-loan-action");

        if (action === "details") {
          window.NorthstarApp.showToast(
            "Loan details opened. Production loan data will come from Supabase.",
            "info"
          );
          return;
        }

        if (action === "learn") {
          const product = button.getAttribute("data-loan-product") || "loan";
          window.NorthstarApp.showToast(
            "More information about " + product + " is available in the demo.",
            "info"
          );
        }
      });
    });

    const previous = document.querySelector("[data-transaction-page='previous']");
    const current = document.querySelector("[data-transaction-page='current']");
    const next = document.querySelector("[data-transaction-page='next']");

    if (previous && current && next) {
      previous.addEventListener("click", function () {
        window.NorthstarApp.showToast("Already on the first transaction page.", "info");
      });

      current.addEventListener("click", function () {
        window.NorthstarApp.showToast("Transaction page 1 is currently displayed.", "info");
      });

      next.addEventListener("click", function () {
        window.NorthstarApp.showToast(
          "The demo currently contains one transaction page. Pagination will use database results when Supabase is connected.",
          "info"
        );
      });
    }
  }

  function setupLogout() {
    document.querySelectorAll("[data-logout]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();

        sessionStorage.removeItem("northstarRole");
        window.location.href = "../public/login.html";
      });
    });
  }

  function init() {
    renderAccounts();

    const mock = getMock();

    if (mock) {
      renderTransactions(mock.transactions);
    }

    setupTransactionFilters();
    setupTransferForm();
    setupBeneficiaryForm();
    setupBillForm();
    setupCardControls();
    setupLoanPaymentDemo();
    setupLoanCalculator();
    setupContactForm();
    setupCsvExports();
    setupProfileForm();
    setupSettings();
    setupPrint();
    setupInteractiveCustomerButtons();
    setupLogout();

    console.log("Northstar customer portal ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
