/* Northstar Bank - management portal behavior */
(function () {
  "use strict";

  function getApp() {
    return window.NorthstarApp;
  }

  function getMock() {
    return window.NorthstarMock;
  }

  function show(message, type) {
    const app = getApp();

    if (app && typeof app.showToast === "function") {
      app.showToast(message, type || "info");
    }
  }

  function renderDashboardMetrics() {
    const app = getApp();
    const mock = getMock();

    if (!app || !mock || !mock.management) return;

    const management = mock.management;

    const metrics = {
      "#metric-customers": management.customers.toLocaleString(),
      "#metric-accounts": management.activeAccounts.toLocaleString(),
      "#metric-transfers": management.pendingTransfers.toLocaleString(),
      "#metric-support": management.openSupportCases.toLocaleString()
    };

    Object.keys(metrics).forEach(function (selector) {
      const element = document.querySelector(selector);

      if (element) {
        element.textContent = metrics[selector];
      }
    });

    const deposits = document.querySelector("#total-deposits");
    const loans = document.querySelector("#total-loans");

    if (deposits) {
      deposits.textContent = app.formatCurrency(
        management.totalDeposits
      );
    }

    if (loans) {
      loans.textContent = app.formatCurrency(
        management.totalLoans
      );
    }
  }

  function setupRefresh() {
    document.querySelectorAll("[data-refresh]").forEach(function (button) {
      button.addEventListener("click", function () {
        renderDashboardMetrics();

        show(
          "Management dashboard refreshed in demo mode.",
          "success"
        );
      });
    });
  }

  function setupDemoActions() {
    document.querySelectorAll("[data-demo-action]").forEach(function (element) {
      element.addEventListener("click", function (event) {
        event.preventDefault();

        const message =
          element.getAttribute("data-demo-action") ||
          "This feature is simulated in demo mode.";

        show(message, "info");
      });
    });
  }

  function renderManagementTransactions() {
    const mock = getMock();

    const list = document.querySelector("#management-transaction-list");
    const empty = document.querySelector("#management-transaction-empty");

    if (!list || !mock) return;

    const transactions = Array.isArray(mock.transactions)
      ? mock.transactions.map(function (transaction) {
          return {
            id: transaction.id,
            date: transaction.date,
            description: transaction.description,
            customer: mock.customer ? mock.customer.name : "Demo Customer",
            account: transaction.account || "****4821",
            type: transaction.type,
            amount: Number(transaction.amount) || 0,
            status: transaction.status
          };
        })
      : [];

    const searchInput =
      document.querySelector("#management-transaction-search");

    const statusSelect =
      document.querySelector("#management-transaction-status");

    const typeSelect =
      document.querySelector("#management-transaction-type");

    const sortSelect =
      document.querySelector("#management-transaction-sort");

    const query = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const status = statusSelect ? statusSelect.value : "";
    const type = typeSelect ? typeSelect.value : "";
    const sort = sortSelect ? sortSelect.value : "date-desc";

    let filtered = transactions.filter(function (transaction) {
      const searchable = [
        transaction.id,
        transaction.description,
        transaction.customer,
        transaction.account,
        transaction.type,
        transaction.status
      ].join(" ").toLowerCase();

      if (query && !searchable.includes(query)) {
        return false;
      }

      if (status && transaction.status !== status) {
        return false;
      }

      if (type && transaction.type !== type) {
        return false;
      }

      return true;
    });

    filtered.sort(function (a, b) {
      if (sort === "date-asc") {
        return new Date(a.date) - new Date(b.date);
      }

      if (sort === "amount-desc") {
        return b.amount - a.amount;
      }

      if (sort === "amount-asc") {
        return a.amount - b.amount;
      }

      return new Date(b.date) - new Date(a.date);
    });

    list.innerHTML = "";

    filtered.forEach(function (transaction) {
      const row = document.createElement("tr");

      const amountClass =
        transaction.type === "Credit"
          ? "transaction-credit"
          : "transaction-debit";

      row.innerHTML = `
        <td>${formatManagementDate(transaction.date)}</td>
        <td>
          <strong>${escapeManagementHtml(transaction.description)}</strong>
          <small>${escapeManagementHtml(transaction.id)}</small>
        </td>
        <td>${escapeManagementHtml(transaction.customer)}</td>
        <td>${escapeManagementHtml(transaction.account)}</td>
        <td>${escapeManagementHtml(transaction.type)}</td>
        <td class="${amountClass}">
          ${formatManagementCurrency(transaction.amount)}
        </td>
        <td>${escapeManagementHtml(transaction.status)}</td>
        <td>
          <button
            class="btn btn-outline"
            type="button"
            data-management-view-transaction="${escapeManagementHtml(transaction.id)}"
          >
            View
          </button>
        </td>
      `;

      list.appendChild(row);
    });

    if (empty) {
      empty.hidden = filtered.length !== 0;
    }
  }

  function formatManagementCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(Number(value) || 0);
  }

  function formatManagementDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value || "");
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function createManagementCsv(rows, additionalRows) {
    const data = Array.isArray(additionalRows)
      ? [rows].concat(additionalRows)
      : rows;

    return data
      .map(function (row) {
        return row
          .map(function (value) {
            const text =
              value === null || value === undefined
                ? ""
                : String(value);

            return '"' +
              text.replace(/"/g, '""') +
              '"';
          })
          .join(",");
      })
      .join("\r\n");
  }

  function downloadManagementCsv(filename, rows) {
    const csv = createManagementCsv(rows);

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function escapeManagementHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setupTransactionControls() {
    const controls = [
      "#management-transaction-search",
      "#management-transaction-status",
      "#management-transaction-type",
      "#management-transaction-sort"
    ];

    controls.forEach(function (selector) {
      const element = document.querySelector(selector);

      if (!element) return;

      element.addEventListener("input", renderManagementTransactions);
      element.addEventListener("change", renderManagementTransactions);
    });

    renderManagementTransactions();
  }

  function setupTransactionActions() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest(
        "[data-management-view-transaction]"
      );

      if (!button) return;

      const transactionId =
        button.getAttribute("data-management-view-transaction");

      show(
        "Transaction " + transactionId + " opened in demo mode.",
        "info"
      );
    });

    const exportButton =
      document.querySelector("[data-export-management='transactions']");

    if (!exportButton) return;

    exportButton.addEventListener("click", function () {
      const mock = getMock();

      if (!mock || !Array.isArray(mock.transactions)) {
        show("No transaction data is available.", "error");
        return;
      }

      const rows = [
        [
          "ID",
          "Date",
          "Description",
          "Type",
          "Amount",
          "Status"
        ]
      ];

      mock.transactions.forEach(function (transaction) {
        rows.push([
          transaction.id,
          transaction.date,
          transaction.description,
          transaction.type,
          transaction.amount,
          transaction.status
        ]);
      });

      const csv = rows.map(function (row) {
        return row.map(function (value) {
          return '"' + String(value == null ? "" : value)
            .replace(/"/g, '""') + '"';
        }).join(",");
      }).join("\n");

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "northstar-management-transactions.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      show("Transaction CSV exported.", "success");
    });
  }


  function renderManagementTransfers() {
    const mock = getMock();

    const list = document.querySelector("#management-transfer-list");
    const empty = document.querySelector("#management-transfer-empty");

    if (!list || !mock) return;

    const source = Array.isArray(mock.transfers)
      ? mock.transfers
      : [];

    const transfers = source.map(function (transfer) {
      return {
        id: transfer.id || "",
        date: transfer.date || "",
        customer: transfer.customer || (
          mock.customer
            ? mock.customer.name
            : "Demo Customer"
        ),
        from: transfer.from || "****4821",
        to: transfer.to || transfer.beneficiary || "****7712",
        type: transfer.type || "External",
        amount: Number(transfer.amount) || 0,
        status: transfer.status || "Pending"
      };
    });

    const searchInput =
      document.querySelector("#management-transfer-search");

    const statusSelect =
      document.querySelector("#management-transfer-status");

    const typeSelect =
      document.querySelector("#management-transfer-type");

    const sortSelect =
      document.querySelector("#management-transfer-sort");

    const query = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const status = statusSelect ? statusSelect.value : "";
    const type = typeSelect ? typeSelect.value : "";
    const sort = sortSelect
      ? sortSelect.value
      : "date-desc";

    let filtered = transfers.filter(function (transfer) {
      const searchable = [
        transfer.id,
        transfer.customer,
        transfer.from,
        transfer.to,
        transfer.type,
        transfer.status
      ].join(" ").toLowerCase();

      if (query && !searchable.includes(query)) {
        return false;
      }

      if (status && transfer.status !== status) {
        return false;
      }

      if (type && transfer.type !== type) {
        return false;
      }

      return true;
    });

    filtered.sort(function (a, b) {
      if (sort === "date-asc") {
        return new Date(a.date) - new Date(b.date);
      }

      if (sort === "amount-desc") {
        return b.amount - a.amount;
      }

      if (sort === "amount-asc") {
        return a.amount - b.amount;
      }

      return new Date(b.date) - new Date(a.date);
    });

    list.innerHTML = "";

    filtered.forEach(function (transfer) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${formatManagementDate(transfer.date)}</td>
        <td>
          <strong>${escapeManagementHtml(transfer.id)}</strong>
        </td>
        <td>${escapeManagementHtml(transfer.customer)}</td>
        <td>${escapeManagementHtml(transfer.from)}</td>
        <td>${escapeManagementHtml(transfer.to)}</td>
        <td>${escapeManagementHtml(transfer.type)}</td>
        <td>${formatManagementCurrency(transfer.amount)}</td>
        <td>${escapeManagementHtml(transfer.status)}</td>
        <td>
          <button
            class="btn btn-outline"
            type="button"
            data-management-view-transfer="${escapeManagementHtml(transfer.id)}"
          >
            Review
          </button>
        </td>
      `;

      list.appendChild(row);
    });

    if (empty) {
      empty.hidden = filtered.length !== 0;
    }
  }

  function setupTransferControls() {
    const controls = [
      "#management-transfer-search",
      "#management-transfer-status",
      "#management-transfer-type",
      "#management-transfer-sort"
    ];

    controls.forEach(function (selector) {
      const element = document.querySelector(selector);

      if (!element) return;

      element.addEventListener(
        "input",
        renderManagementTransfers
      );

      element.addEventListener(
        "change",
        renderManagementTransfers
      );
    });

    renderManagementTransfers();
  }

  function setupTransferActions() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest(
        "[data-management-view-transfer]"
      );

      if (!button) return;

      const transferId =
        button.getAttribute("data-management-view-transfer");

      show(
        "Transfer " + transferId + " opened in demo mode.",
        "info"
      );
    });

    const exportButton =
      document.querySelector(
        "[data-export-management='transfers']"
      );

    if (!exportButton) return;

    exportButton.addEventListener("click", function () {
      const mock = getMock();

      if (!mock || !Array.isArray(mock.transfers)) {
        show(
          "No transfer data is available.",
          "error"
        );
        return;
      }

      const rows = [
        [
          "ID",
          "Date",
          "Customer",
          "From",
          "To",
          "Type",
          "Amount",
          "Status"
        ]
      ];

      mock.transfers.forEach(function (transfer) {
        rows.push([
          transfer.id || "",
          transfer.date || "",
          transfer.customer || (
            mock.customer
              ? mock.customer.name
              : "Demo Customer"
          ),
          transfer.from || "****4821",
          transfer.to || transfer.beneficiary || "****7712",
          transfer.type || "External",
          transfer.amount || 0,
          transfer.status || "Pending"
        ]);
      });

      const csv = rows.map(function (row) {
        return row.map(function (value) {
          return '"' +
            String(value == null ? "" : value)
              .replace(/"/g, '""') +
            '"';
        }).join(",");
      }).join("\n");

      const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        "northstar-management-transfers.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      show(
        "Transfer CSV exported.",
        "success"
      );
    });
  }


  function renderManagementCards() {
    const mock = getMock();

    const list = document.querySelector("#management-card-list");
    const empty = document.querySelector("#management-card-empty");

    if (!list || !mock) return;

    const source = Array.isArray(mock.cards)
      ? mock.cards
      : [];

    const cards = source.map(function (card) {
      return {
        id: card.id || "",
        name: card.name || "",
        number: card.number || "",
        type: card.type || "",
        status: card.status || "",
        limit: Number(card.limit) || 0,
        available: Number(card.available) || 0,
        customer: mock.customer
          ? mock.customer.name
          : "Demo Customer"
      };
    });

    const searchInput =
      document.querySelector("#management-card-search");

    const statusSelect =
      document.querySelector("#management-card-status");

    const typeSelect =
      document.querySelector("#management-card-type");

    const sortSelect =
      document.querySelector("#management-card-sort");

    const query = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const status = statusSelect
      ? statusSelect.value
      : "";

    const type = typeSelect
      ? typeSelect.value
      : "";

    const sort = sortSelect
      ? sortSelect.value
      : "name-asc";

    let filtered = cards.filter(function (card) {
      const searchable = [
        card.id,
        card.name,
        card.number,
        card.type,
        card.status,
        card.customer
      ].join(" ").toLowerCase();

      if (query && !searchable.includes(query)) {
        return false;
      }

      if (status && card.status !== status) {
        return false;
      }

      if (type && card.type !== type) {
        return false;
      }

      return true;
    });

    filtered.sort(function (a, b) {
      if (sort === "name-desc") {
        return b.name.localeCompare(a.name);
      }

      if (sort === "available-desc") {
        return b.available - a.available;
      }

      if (sort === "available-asc") {
        return a.available - b.available;
      }

      return a.name.localeCompare(b.name);
    });

    list.innerHTML = "";

    filtered.forEach(function (card) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>
          <strong>${escapeManagementHtml(card.name)}</strong>
          <small>${escapeManagementHtml(card.id)}</small>
        </td>
        <td>${escapeManagementHtml(card.customer)}</td>
        <td>${escapeManagementHtml(card.number)}</td>
        <td>${escapeManagementHtml(card.type)}</td>
        <td>${escapeManagementHtml(card.status)}</td>
        <td>${formatManagementCurrency(card.limit)}</td>
        <td>${formatManagementCurrency(card.available)}</td>
        <td>
          <button
            class="btn btn-outline"
            type="button"
            data-management-view-card="${escapeManagementHtml(card.id)}"
          >
            Review
          </button>
        </td>
      `;

      list.appendChild(row);
    });

    if (empty) {
      empty.hidden = filtered.length !== 0;
    }
  }

  function setupCardControls() {
    const controls = [
      "#management-card-search",
      "#management-card-status",
      "#management-card-type",
      "#management-card-sort"
    ];

    controls.forEach(function (selector) {
      const element = document.querySelector(selector);

      if (!element) return;

      element.addEventListener(
        "input",
        renderManagementCards
      );

      element.addEventListener(
        "change",
        renderManagementCards
      );
    });

    renderManagementCards();
  }

  function setupCardActions() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest(
        "[data-management-view-card]"
      );

      if (!button) return;

      const cardId =
        button.getAttribute("data-management-view-card");

      show(
        "Card " + cardId + " opened in demo mode.",
        "info"
      );
    });

    const exportButton =
      document.querySelector(
        "[data-export-management='cards']"
      );

    if (!exportButton) return;

    exportButton.addEventListener("click", function () {
      const mock = getMock();

      if (!mock || !Array.isArray(mock.cards)) {
        show(
          "No card data is available.",
          "error"
        );
        return;
      }

      const rows = [
        [
          "ID",
          "Name",
          "Number",
          "Type",
          "Status",
          "Limit",
          "Available"
        ]
      ];

      mock.cards.forEach(function (card) {
        rows.push([
          card.id,
          card.name,
          card.number,
          card.type,
          card.status,
          card.limit,
          card.available
        ]);
      });

      const csv = rows.map(function (row) {
        return row.map(function (value) {
          return '"' +
            String(value == null ? "" : value)
              .replace(/"/g, '""') +
            '"';
        }).join(",");
      }).join("\n");

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        "northstar-management-cards.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      show(
        "Card CSV exported.",
        "success"
      );
    });
  }



  function renderManagementSupport() {
    const mock = getMock();

    const list = document.querySelector("#management-support-list");
    const empty = document.querySelector("#management-support-empty");

    if (!list || !mock) return;

    const source = Array.isArray(mock.supportCases)
      ? mock.supportCases
      : [];

    const cases = source.map(function (supportCase) {
      return {
        id: supportCase.id || "",
        date: supportCase.date || "",
        customer: supportCase.customer || "Demo Customer",
        subject: supportCase.subject || "",
        category: supportCase.category || "Other",
        priority: supportCase.priority || "Low",
        status: supportCase.status || "Open"
      };
    });

    const searchInput =
      document.querySelector("#management-support-search");

    const statusSelect =
      document.querySelector("#management-support-status");

    const categorySelect =
      document.querySelector("#management-support-category");

    const prioritySelect =
      document.querySelector("#management-support-priority");

    const sortSelect =
      document.querySelector("#management-support-sort");

    const query = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const status = statusSelect ? statusSelect.value : "";
    const category = categorySelect ? categorySelect.value : "";
    const priority = prioritySelect ? prioritySelect.value : "";
    const sort = sortSelect
      ? sortSelect.value
      : "date-desc";

    const priorityRank = {
      High: 3,
      Medium: 2,
      Low: 1
    };

    let filtered = cases.filter(function (supportCase) {
      const searchable = [
        supportCase.id,
        supportCase.customer,
        supportCase.subject,
        supportCase.category,
        supportCase.priority,
        supportCase.status
      ].join(" ").toLowerCase();

      if (query && !searchable.includes(query)) {
        return false;
      }

      if (status && supportCase.status !== status) {
        return false;
      }

      if (category && supportCase.category !== category) {
        return false;
      }

      if (priority && supportCase.priority !== priority) {
        return false;
      }

      return true;
    });

    filtered.sort(function (a, b) {
      if (sort === "date-asc") {
        return new Date(a.date) - new Date(b.date);
      }

      if (sort === "priority-desc") {
        return priorityRank[b.priority] - priorityRank[a.priority];
      }

      if (sort === "priority-asc") {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }

      return new Date(b.date) - new Date(a.date);
    });

    list.innerHTML = "";

    filtered.forEach(function (supportCase) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${formatManagementDate(supportCase.date)}</td>
        <td>
          <strong>${escapeManagementHtml(supportCase.id)}</strong>
        </td>
        <td>${escapeManagementHtml(supportCase.customer)}</td>
        <td>${escapeManagementHtml(supportCase.subject)}</td>
        <td>${escapeManagementHtml(supportCase.category)}</td>
        <td>${escapeManagementHtml(supportCase.priority)}</td>
        <td>${escapeManagementHtml(supportCase.status)}</td>
        <td>
          <button
            class="btn btn-outline"
            type="button"
            data-management-view-support="${escapeManagementHtml(supportCase.id)}"
          >
            Review
          </button>
        </td>
      `;

      list.appendChild(row);
    });

    if (empty) {
      empty.hidden = filtered.length !== 0;
    }
  }

  function setupSupportControls() {
    const controls = [
      "#management-support-search",
      "#management-support-status",
      "#management-support-category",
      "#management-support-priority",
      "#management-support-sort"
    ];

    controls.forEach(function (selector) {
      const element = document.querySelector(selector);

      if (!element) return;

      element.addEventListener(
        "input",
        renderManagementSupport
      );

      element.addEventListener(
        "change",
        renderManagementSupport
      );
    });

    renderManagementSupport();
  }

  function setupSupportActions() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest(
        "[data-management-view-support]"
      );

      if (!button) return;

      const caseId =
        button.getAttribute("data-management-view-support");

      show(
        "Support case " + caseId + " opened in demo mode.",
        "info"
      );
    });

    const exportButton =
      document.querySelector(
        "[data-export-management='support']"
      );

    if (!exportButton) return;

    exportButton.addEventListener("click", function () {
      const mock = getMock();

      if (!mock || !Array.isArray(mock.supportCases)) {
        show(
          "No support case data is available.",
          "error"
        );
        return;
      }

      const headers = [
        "Case ID",
        "Date",
        "Customer",
        "Subject",
        "Category",
        "Priority",
        "Status"
      ];

      const rows = mock.supportCases.map(function (supportCase) {
        return [
          supportCase.id,
          supportCase.date,
          supportCase.customer,
          supportCase.subject,
          supportCase.category,
          supportCase.priority,
          supportCase.status
        ];
      });

      const csv = createManagementCsv(headers, rows);
      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "northstar-management-support.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      show("Support CSV exported.", "success");
    });
  }



  function renderManagementAuditLog() {
    const mock = getMock();

    if (!mock) return;

    const logs = Array.isArray(mock.auditLogs)
      ? mock.auditLogs.slice()
      : [];

    const searchInput = document.querySelector("#audit-search");
    const roleFilter = document.querySelector("#audit-role");
    const statusFilter = document.querySelector("#audit-status");
    const sortSelect = document.querySelector("#audit-sort");
    const list = document.querySelector("#audit-log-list");
    const empty = document.querySelector("#audit-empty");

    if (!list) return;

    const search = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const role = roleFilter
      ? roleFilter.value
      : "";

    const status = statusFilter
      ? statusFilter.value
      : "";

    const sort = sortSelect
      ? sortSelect.value
      : "date-desc";

    let filtered = logs.filter(function (entry) {
      const searchable = [
        entry.id,
        entry.actor,
        entry.role,
        entry.action,
        entry.resource,
        entry.details,
        entry.status
      ]
        .join(" ")
        .toLowerCase();

      if (search && !searchable.includes(search)) {
        return false;
      }

      if (role && entry.role !== role) {
        return false;
      }

      if (status && entry.status !== status) {
        return false;
      }

      return true;
    });

    filtered.sort(function (a, b) {
      if (sort === "actor-asc") {
        return String(a.actor || "").localeCompare(String(b.actor || ""));
      }

      if (sort === "actor-desc") {
        return String(b.actor || "").localeCompare(String(a.actor || ""));
      }

      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (sort === "date-asc") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    list.innerHTML = "";

    filtered.forEach(function (entry) {
      const row = document.createElement("tr");

      const formattedDate = formatManagementDate(entry.date);

      row.innerHTML = `
        <td>${escapeManagementHtml(formattedDate)}</td>
        <td>${escapeManagementHtml(entry.actor || "")}</td>
        <td>${escapeManagementHtml(entry.role || "")}</td>
        <td>${escapeManagementHtml(entry.action || "")}</td>
        <td>${escapeManagementHtml(entry.resource || "")}</td>
        <td>${escapeManagementHtml(entry.status || "")}</td>
        <td>
          <button
            class="btn btn-outline"
            type="button"
            data-audit-view="${escapeManagementHtml(entry.id || "")}"
          >
            View
          </button>
        </td>
      `;

      list.appendChild(row);
    });

    if (empty) {
      empty.hidden = filtered.length > 0;
    }
  }

  function setupAuditControls() {
    const searchInput = document.querySelector("#audit-search");
    const roleFilter = document.querySelector("#audit-role");
    const statusFilter = document.querySelector("#audit-status");
    const sortSelect = document.querySelector("#audit-sort");

    [
      searchInput,
      roleFilter,
      statusFilter,
      sortSelect
    ].forEach(function (element) {
      if (!element) return;

      element.addEventListener("input", renderManagementAuditLog);
      element.addEventListener("change", renderManagementAuditLog);
    });
  }

  function setupAuditActions() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest("[data-audit-view]");

      if (!button) return;

      const id = button.getAttribute("data-audit-view");
      const mock = getMock();

      if (!mock || !Array.isArray(mock.auditLogs)) return;

      const entry = mock.auditLogs.find(function (item) {
        return item.id === id;
      });

      if (!entry) return;

      show(
        entry.id +
          " — " +
          entry.action +
          " — " +
          entry.details,
        entry.status === "Failed" ? "error" : "info"
      );
    });

    const refreshButton =
      document.querySelector("[data-refresh-audit]");

    if (refreshButton) {
      refreshButton.addEventListener("click", function () {
        renderManagementAuditLog();

        show(
          "Audit log refreshed.",
          "success"
        );
      });
    }

    const exportButton =
      document.querySelector(
        "[data-export-management='audit']"
      );

    if (!exportButton) return;

    exportButton.addEventListener("click", function () {
      const mock = getMock();

      const logs =
        mock && Array.isArray(mock.auditLogs)
          ? mock.auditLogs
          : [];

      if (!logs.length) {
        show(
          "No audit events are available.",
          "error"
        );
        return;
      }

      const rows = [
        [
          "ID",
          "Date",
          "Actor",
          "Role",
          "Action",
          "Resource",
          "Details",
          "Status"
        ],
        ...logs.map(function (entry) {
          return [
            entry.id,
            entry.date,
            entry.actor,
            entry.role,
            entry.action,
            entry.resource,
            entry.details,
            entry.status
          ];
        })
      ];

      downloadManagementCsv(
        "northstar-management-audit-log.csv",
        rows
      );

      show(
        "Audit log CSV exported.",
        "success"
      );
    });
  }

  function renderManagementReports() {
    const mock = getMock();

    if (!mock) return;

    const accounts = Array.isArray(mock.accounts)
      ? mock.accounts
      : [];

    const transactions = Array.isArray(mock.transactions)
      ? mock.transactions
      : [];

    const transfers = Array.isArray(mock.transfers)
      ? mock.transfers
      : [];

    const supportCases = Array.isArray(mock.supportCases)
      ? mock.supportCases
      : [];

    const cards = Array.isArray(mock.cards)
      ? mock.cards
      : [];

    const loans = Array.isArray(mock.loans)
      ? mock.loans
      : [];

    const totalDeposits = accounts.reduce(function (total, account) {
      return total + (Number(account.balance) || 0);
    }, 0);

    const totalLoans = loans.reduce(function (total, loan) {
      return total + (Number(loan.balance) || 0);
    }, 0);

    const transferVolume = transfers.reduce(function (total, transfer) {
      return total + (Number(transfer.amount) || 0);
    }, 0);

    const openSupport = supportCases.filter(function (supportCase) {
      return ["Open", "In Progress"].includes(supportCase.status);
    }).length;

    const activeCards = cards.filter(function (card) {
      return card.status === "Active";
    }).length;

    const depositsElement =
      document.querySelector("#report-total-deposits");

    const loansElement =
      document.querySelector("#report-total-loans");

    const transactionCountElement =
      document.querySelector("#report-transaction-count");

    const transferVolumeElement =
      document.querySelector("#report-transfer-volume");

    const supportElement =
      document.querySelector("#report-open-support");

    const cardsElement =
      document.querySelector("#report-active-cards");

    if (depositsElement) {
      depositsElement.textContent =
        formatManagementCurrency(totalDeposits);
    }

    if (loansElement) {
      loansElement.textContent =
        formatManagementCurrency(totalLoans);
    }

    if (transactionCountElement) {
      transactionCountElement.textContent =
        transactions.length.toLocaleString();
    }

    if (transferVolumeElement) {
      transferVolumeElement.textContent =
        formatManagementCurrency(transferVolume);
    }

    if (supportElement) {
      supportElement.textContent =
        openSupport.toLocaleString();
    }

    if (cardsElement) {
      cardsElement.textContent =
        activeCards.toLocaleString();
    }

    const transactionSummary =
      document.querySelector("#report-transaction-summary");

    if (transactionSummary) {
      const grouped = {};

      transactions.forEach(function (transaction) {
        const type = transaction.type || "Unknown";

        if (!grouped[type]) {
          grouped[type] = {
            count: 0,
            total: 0
          };
        }

        grouped[type].count += 1;
        grouped[type].total += Number(transaction.amount) || 0;
      });

      transactionSummary.innerHTML = "";

      Object.keys(grouped)
        .sort()
        .forEach(function (type) {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${escapeManagementHtml(type)}</td>
            <td>${grouped[type].count}</td>
            <td>${formatManagementCurrency(grouped[type].total)}</td>
          `;

          transactionSummary.appendChild(row);
        });
    }

    const transferSummary =
      document.querySelector("#report-transfer-summary");

    if (transferSummary) {
      const grouped = {};

      transfers.forEach(function (transfer) {
        const status = transfer.status || "Unknown";

        if (!grouped[status]) {
          grouped[status] = {
            count: 0,
            amount: 0
          };
        }

        grouped[status].count += 1;
        grouped[status].amount += Number(transfer.amount) || 0;
      });

      transferSummary.innerHTML = "";

      Object.keys(grouped)
        .sort()
        .forEach(function (status) {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${escapeManagementHtml(status)}</td>
            <td>${grouped[status].count}</td>
            <td>${formatManagementCurrency(grouped[status].amount)}</td>
          `;

          transferSummary.appendChild(row);
        });
    }

    const supportSummary =
      document.querySelector("#report-support-summary");

    if (supportSummary) {
      const grouped = {};

      supportCases.forEach(function (supportCase) {
        const status = supportCase.status || "Unknown";

        grouped[status] = (grouped[status] || 0) + 1;
      });

      supportSummary.innerHTML = "";

      Object.keys(grouped)
        .sort()
        .forEach(function (status) {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${escapeManagementHtml(status)}</td>
            <td>${grouped[status]}</td>
          `;

          supportSummary.appendChild(row);
        });
    }

    const categorySummary =
      document.querySelector("#report-category-summary");

    if (categorySummary) {
      const grouped = {};

      transactions
        .filter(function (transaction) {
          return transaction.type === "Debit";
        })
        .forEach(function (transaction) {
          const category = transaction.category || "Other";

          if (!grouped[category]) {
            grouped[category] = {
              count: 0,
              total: 0
            };
          }

          grouped[category].count += 1;
          grouped[category].total += Number(transaction.amount) || 0;
        });

      categorySummary.innerHTML = "";

      Object.keys(grouped)
        .sort()
        .forEach(function (category) {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${escapeManagementHtml(category)}</td>
            <td>${grouped[category].count}</td>
            <td>${formatManagementCurrency(grouped[category].total)}</td>
          `;

          categorySummary.appendChild(row);
        });
    }

    const empty = document.querySelector("#report-empty");

    if (empty) {
      const hasReportData =
        accounts.length > 0 ||
        transactions.length > 0 ||
        transfers.length > 0 ||
        supportCases.length > 0 ||
        cards.length > 0 ||
        loans.length > 0;

      empty.hidden = hasReportData;
    }
  }

  function setupReportActions() {
    const refreshButton =
      document.querySelector("[data-refresh-reports]");

    if (refreshButton) {
      refreshButton.addEventListener("click", function () {
        renderManagementReports();

        show(
          "Reports refreshed.",
          "success"
        );
      });
    }

    const exportButton =
      document.querySelector(
        "[data-export-management='reports']"
      );

    if (!exportButton) return;

    exportButton.addEventListener("click", function () {
      const mock = getMock();

      if (!mock) {
        show(
          "No report data is available.",
          "error"
        );
        return;
      }

      const accounts = Array.isArray(mock.accounts)
        ? mock.accounts
        : [];

      const transactions = Array.isArray(mock.transactions)
        ? mock.transactions
        : [];

      const transfers = Array.isArray(mock.transfers)
        ? mock.transfers
        : [];

      const supportCases = Array.isArray(mock.supportCases)
        ? mock.supportCases
        : [];

      const cards = Array.isArray(mock.cards)
        ? mock.cards
        : [];

      const loans = Array.isArray(mock.loans)
        ? mock.loans
        : [];

      const rows = [
        ["Report", "Metric", "Value"],
        [
          "Accounts",
          "Total deposits",
          accounts.reduce(function (sum, account) {
            return sum + (Number(account.balance) || 0);
          }, 0).toFixed(2)
        ],
        [
          "Loans",
          "Outstanding balance",
          loans.reduce(function (sum, loan) {
            return sum + (Number(loan.balance) || 0);
          }, 0).toFixed(2)
        ],
        [
          "Transactions",
          "Transaction count",
          transactions.length
        ],
        [
          "Transfers",
          "Transfer volume",
          transfers.reduce(function (sum, transfer) {
            return sum + (Number(transfer.amount) || 0);
          }, 0).toFixed(2)
        ],
        [
          "Support",
          "Open and in-progress cases",
          supportCases.filter(function (supportCase) {
            return ["Open", "In Progress"].includes(
              supportCase.status
            );
          }).length
        ],
        [
          "Cards",
          "Active cards",
          cards.filter(function (card) {
            return card.status === "Active";
          }).length
        ]
      ];

      const csv = rows.map(function (row) {
        return row.map(function (value) {
          const text = String(value == null ? "" : value);

          return '"' +
            text.replace(/"/g, '""') +
            '"';
        }).join(",");
      }).join("\n");

      const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "northstar-management-reports.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      show(
        "Reports CSV exported.",
        "success"
      );
    });
  }

  function renderManagementLoans() {
    const mock = getMock();

    const list = document.querySelector("#management-loan-list");
    const empty = document.querySelector("#management-loan-empty");

    if (!list || !mock) return;

    const source = Array.isArray(mock.loans)
      ? mock.loans
      : [];

    const loans = source.map(function (loan) {
      return {
        id: loan.id || "",
        customer: loan.customer || (
          mock.customer
            ? mock.customer.name
            : "Demo Customer"
        ),
        type: loan.type || "Loan",
        principal: Number(loan.principal) || 0,
        balance: Number(loan.balance) || 0,
        rate: Number(loan.rate) || 0,
        status: loan.status || "Pending"
      };
    });

    const searchInput =
      document.querySelector("#management-loan-search");

    const statusSelect =
      document.querySelector("#management-loan-status");

    const typeSelect =
      document.querySelector("#management-loan-type");

    const sortSelect =
      document.querySelector("#management-loan-sort");

    const query = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const status = statusSelect
      ? statusSelect.value
      : "";

    const type = typeSelect
      ? typeSelect.value
      : "";

    const sort = sortSelect
      ? sortSelect.value
      : "balance-desc";

    let filtered = loans.filter(function (loan) {
      const searchable = [
        loan.id,
        loan.customer,
        loan.type,
        loan.status
      ].join(" ").toLowerCase();

      if (query && !searchable.includes(query)) {
        return false;
      }

      if (status && loan.status !== status) {
        return false;
      }

      if (type && loan.type !== type) {
        return false;
      }

      return true;
    });

    filtered.sort(function (a, b) {
      if (sort === "balance-asc") {
        return a.balance - b.balance;
      }

      if (sort === "principal-desc") {
        return b.principal - a.principal;
      }

      if (sort === "principal-asc") {
        return a.principal - b.principal;
      }

      if (sort === "rate-desc") {
        return b.rate - a.rate;
      }

      if (sort === "rate-asc") {
        return a.rate - b.rate;
      }

      if (sort === "type-asc") {
        return a.type.localeCompare(b.type);
      }

      if (sort === "type-desc") {
        return b.type.localeCompare(a.type);
      }

      return b.balance - a.balance;
    });

    list.innerHTML = "";

    filtered.forEach(function (loan) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>
          <strong>${escapeManagementHtml(loan.id)}</strong>
        </td>
        <td>${escapeManagementHtml(loan.customer)}</td>
        <td>${escapeManagementHtml(loan.type)}</td>
        <td>${formatManagementCurrency(loan.principal)}</td>
        <td>${formatManagementCurrency(loan.balance)}</td>
        <td>${loan.rate.toFixed(2)}%</td>
        <td>${escapeManagementHtml(loan.status)}</td>
        <td>
          <button
            class="btn btn-outline"
            type="button"
            data-management-view-loan="${escapeManagementHtml(loan.id)}"
          >
            Review
          </button>
        </td>
      `;

      list.appendChild(row);
    });

    if (empty) {
      empty.hidden = filtered.length !== 0;
    }
  }

  function setupLoanControls() {
    const controls = [
      "#management-loan-search",
      "#management-loan-status",
      "#management-loan-type",
      "#management-loan-sort"
    ];

    controls.forEach(function (selector) {
      const element = document.querySelector(selector);

      if (!element) return;

      element.addEventListener(
        "input",
        renderManagementLoans
      );

      element.addEventListener(
        "change",
        renderManagementLoans
      );
    });

    renderManagementLoans();
  }

  function setupLoanActions() {
    document.addEventListener("click", function (event) {
      const button = event.target.closest(
        "[data-management-view-loan]"
      );

      if (!button) return;

      const loanId =
        button.getAttribute("data-management-view-loan");

      show(
        "Loan " + loanId + " opened in demo mode.",
        "info"
      );
    });

    const exportButton =
      document.querySelector(
        "[data-export-management='loans']"
      );

    if (!exportButton) return;

    exportButton.addEventListener("click", function () {
      const mock = getMock();

      if (!mock || !Array.isArray(mock.loans)) {
        show(
          "No loan data is available.",
          "error"
        );
        return;
      }

      const rows = [
        [
          "Loan ID",
          "Customer",
          "Type",
          "Principal",
          "Balance",
          "Rate",
          "Status"
        ]
      ];

      mock.loans.forEach(function (loan) {
        rows.push([
          loan.id || "",
          loan.customer || (
            mock.customer
              ? mock.customer.name
              : "Demo Customer"
          ),
          loan.type || "",
          Number(loan.principal) || 0,
          Number(loan.balance) || 0,
          Number(loan.rate) || 0,
          loan.status || ""
        ]);
      });

      const csv = rows.map(function (row) {
        return row.map(function (value) {
          const text = String(value ?? "");

          return '"' +
            text.replace(/"/g, '""') +
            '"';
        }).join(",");
      }).join("\n");

      const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "northstar-management-loans.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      show("Loan CSV exported.", "success");
    });
  }


  function managementStatusClass(status) {
    const value = String(status || "").toLowerCase();

    if (
      value === "active" ||
      value === "completed" ||
      value === "success" ||
      value === "resolved"
    ) {
      return "status-success";
    }

    if (
      value === "pending" ||
      value === "review" ||
      value === "in progress"
    ) {
      return "status-warning";
    }

    if (
      value === "suspended" ||
      value === "closed" ||
      value === "failed"
    ) {
      return "status-error";
    }

    return "status-neutral";
  }

  function renderManagementAccounts() {
    const mock = getMock();
    const list = document.querySelector("#management-account-list");

    if (!list || !mock) return;

    const search =
      (document.querySelector("#account-search")?.value || "")
        .trim()
        .toLowerCase();

    const type =
      document.querySelector("#account-type")?.value || "";

    const status =
      document.querySelector("#account-status")?.value || "";

    const sort =
      document.querySelector("#account-sort")?.value || "account-id";

    const accounts = Array.isArray(mock.accounts)
      ? mock.accounts.slice()
      : [];

    const filtered = accounts.filter(function (account) {
      const haystack = [
        account.id,
        account.customer,
        account.number,
        account.type,
        account.status
      ].join(" ").toLowerCase();

      return (
        (!search || haystack.includes(search)) &&
        (!type || account.type === type) &&
        (!status || account.status === status)
      );
    });

    filtered.sort(function (a, b) {
      if (sort === "customer") {
        return String(a.customer || "").localeCompare(
          String(b.customer || "")
        );
      }

      if (sort === "type") {
        return String(a.type || "").localeCompare(
          String(b.type || "")
        );
      }

      if (sort === "balance") {
        return (Number(b.balance) || 0) - (Number(a.balance) || 0);
      }

      if (sort === "status") {
        return String(a.status || "").localeCompare(
          String(b.status || "")
        );
      }

      return String(a.id || "").localeCompare(
        String(b.id || "")
      );
    });

    list.innerHTML = "";

    if (!filtered.length) {
      list.innerHTML =
        '<tr><td colspan="8" class="empty-state">No accounts match the selected filters.</td></tr>';
      return;
    }

    filtered.forEach(function (account) {
      const row = document.createElement("tr");

      row.innerHTML = [
        "<td>" + escapeManagementHtml(account.id) + "</td>",
        "<td>" + escapeManagementHtml(account.customer || "—") + "</td>",
        "<td>" + escapeManagementHtml(account.type) + "</td>",
        "<td>" + escapeManagementHtml(account.number) + "</td>",
        "<td>" + formatManagementCurrency(account.balance) + "</td>",
        "<td>" + escapeManagementHtml(account.currency || "USD") + "</td>",
        '<td><span class="status ' +
          managementStatusClass(account.status) +
          '">' +
          escapeManagementHtml(account.status) +
          "</span></td>",
        '<td><button class="btn btn-small btn-outline" type="button" data-management-view-account="' +
          escapeManagementHtml(account.id) +
          '">View</button></td>'
      ].join("");

      list.appendChild(row);
    });
  }

  function setupManagementAccounts() {
    const list = document.querySelector("#management-account-list");

    if (!list) return;

    [
      "#account-search",
      "#account-type",
      "#account-status",
      "#account-sort"
    ].forEach(function (selector) {
      const element = document.querySelector(selector);

      if (!element) return;

      element.addEventListener("input", renderManagementAccounts);
      element.addEventListener("change", renderManagementAccounts);
    });

    document.addEventListener("click", function (event) {
      const viewButton =
        event.target.closest("[data-management-view-account]");

      if (viewButton) {
        const id =
          viewButton.getAttribute("data-management-view-account");

        const mock = getMock();
        const account = mock &&
          Array.isArray(mock.accounts)
          ? mock.accounts.find(function (item) {
              return item.id === id;
            })
          : null;

        if (!account) {
          show("Account could not be found.", "error");
          return;
        }

        show(
          account.id +
          " • " +
          account.customer +
          " • " +
          account.type +
          " • " +
          formatManagementCurrency(account.balance) +
          " • " +
          account.status,
          "info"
        );

        return;
      }

      const action = event.target.closest("[data-management-action]");

      if (!action) return;

      const actionName =
        action.getAttribute("data-management-action");

      const mock = getMock();

      if (actionName === "create-account") {
        if (!mock) return;

        if (!Array.isArray(mock.accounts)) {
          mock.accounts = [];
        }

        const number = String(
          Math.floor(1000 + Math.random() * 9000)
        );

        const nextId =
          "ACC-" +
          String(mock.accounts.length + 1).padStart(3, "0");

        mock.accounts.push({
          id: nextId,
          customerId: mock.customer?.id || "CUS-100284",
          customer: mock.customer?.name || "Demo Customer",
          type: "Checking",
          number: "****" + number,
          balance: 0,
          available: 0,
          currency: "USD",
          status: "Pending"
        });

        renderManagementAccounts();

        show(
          "Created demo account " + nextId + ".",
          "success"
        );

        return;
      }

      if (actionName === "export-accounts") {
        const accounts = mock && Array.isArray(mock.accounts)
          ? mock.accounts
          : [];

        const rows = [
          [
            "Account ID",
            "Customer ID",
            "Customer",
            "Type",
            "Account Number",
            "Balance",
            "Available",
            "Currency",
            "Status"
          ]
        ];

        accounts.forEach(function (account) {
          rows.push([
            account.id,
            account.customerId,
            account.customer,
            account.type,
            account.number,
            account.balance,
            account.available,
            account.currency || "USD",
            account.status
          ]);
        });

        downloadManagementCsv(
          "northstar-management-accounts.csv",
          rows
        );

        show("Account directory exported.", "success");
        return;
      }

      if (actionName === "review-account-statuses") {
        const accounts = mock && Array.isArray(mock.accounts)
          ? mock.accounts
          : [];

        const counts = {};

        accounts.forEach(function (account) {
          counts[account.status] =
            (counts[account.status] || 0) + 1;
        });

        const summary = Object.keys(counts)
          .sort()
          .map(function (key) {
            return key + ": " + counts[key];
          })
          .join(" • ");

        show(
          summary || "No account statuses are available.",
          "info"
        );
      }
    });

    renderManagementAccounts();
  }

  function renderManagementCustomers() {
    const mock = getMock();
    const list = document.querySelector("#management-customer-list");

    if (!list || !mock) return;

    const search =
      (document.querySelector("#customer-search")?.value || "")
        .trim()
        .toLowerCase();

    const status =
      document.querySelector("#customer-status")?.value || "";

    const type =
      document.querySelector("#customer-type")?.value || "";

    const sort =
      document.querySelector("#customer-sort")?.value || "name";

    const customers = Array.isArray(mock.customers)
      ? mock.customers.slice()
      : [];

    const filtered = customers.filter(function (customer) {
      const haystack = [
        customer.id,
        customer.name,
        customer.email,
        customer.type,
        customer.status
      ].join(" ").toLowerCase();

      return (
        (!search || haystack.includes(search)) &&
        (!status || customer.status === status) &&
        (!type || customer.type === type)
      );
    });

    filtered.sort(function (a, b) {
      if (sort === "id") {
        return String(a.id || "").localeCompare(
          String(b.id || "")
        );
      }

      if (sort === "accounts") {
        return (Number(b.accounts) || 0) - (Number(a.accounts) || 0);
      }

      if (sort === "status") {
        return String(a.status || "").localeCompare(
          String(b.status || "")
        );
      }

      return String(a.name || "").localeCompare(
        String(b.name || "")
      );
    });

    list.innerHTML = "";

    if (!filtered.length) {
      list.innerHTML =
        '<tr><td colspan="8" class="empty-state">No customers match the selected filters.</td></tr>';
      return;
    }

    filtered.forEach(function (customer) {
      const row = document.createElement("tr");

      row.innerHTML = [
        "<td>" + escapeManagementHtml(customer.id) + "</td>",
        "<td>" + escapeManagementHtml(customer.name) + "</td>",
        "<td>" + escapeManagementHtml(customer.email) + "</td>",
        "<td>" + escapeManagementHtml(customer.type) + "</td>",
        "<td>" + escapeManagementHtml(customer.accounts) + "</td>",
        '<td><span class="status ' +
          managementStatusClass(customer.status) +
          '">' +
          escapeManagementHtml(customer.status) +
          "</span></td>",
        "<td>" + escapeManagementHtml(customer.joined) + "</td>",
        '<td><button class="btn btn-small btn-outline" type="button" data-management-view-customer="' +
          escapeManagementHtml(customer.id) +
          '">View</button></td>'
      ].join("");

      list.appendChild(row);
    });
  }

  function setupManagementCustomers() {
    const list = document.querySelector("#management-customer-list");

    if (!list) return;

    [
      "#customer-search",
      "#customer-status",
      "#customer-type",
      "#customer-sort"
    ].forEach(function (selector) {
      const element = document.querySelector(selector);

      if (!element) return;

      element.addEventListener("input", renderManagementCustomers);
      element.addEventListener("change", renderManagementCustomers);
    });

    document.addEventListener("click", function (event) {
      const viewButton =
        event.target.closest("[data-management-view-customer]");

      if (viewButton) {
        const id =
          viewButton.getAttribute("data-management-view-customer");

        const mock = getMock();
        const customer = mock &&
          Array.isArray(mock.customers)
          ? mock.customers.find(function (item) {
              return item.id === id;
            })
          : null;

        if (!customer) {
          show("Customer could not be found.", "error");
          return;
        }

        show(
          customer.id +
          " • " +
          customer.name +
          " • " +
          customer.email +
          " • " +
          customer.type +
          " • " +
          customer.accounts +
          " account(s) • " +
          customer.status,
          "info"
        );

        return;
      }

      const action = event.target.closest("[data-management-action]");

      if (!action) return;

      const actionName =
        action.getAttribute("data-management-action");

      const mock = getMock();

      if (actionName === "add-customer") {
        if (!mock) return;

        if (!Array.isArray(mock.customers)) {
          mock.customers = [];
        }

        const nextId =
          "CUS-" +
          String(100284 + mock.customers.length);

        const name =
          "Demo Customer " +
          (mock.customers.length + 1);

        mock.customers.push({
          id: nextId,
          name: name,
          email:
            "demo" +
            mock.customers.length +
            "@example.test",
          type: "Personal",
          accounts: 0,
          status: "Review",
          joined: new Date().toISOString().slice(0, 10),
          phone: ""
        });

        renderManagementCustomers();

        show(
          "Added demo customer " + nextId + ".",
          "success"
        );

        return;
      }

      if (actionName === "export-customers") {
        const customers = mock && Array.isArray(mock.customers)
          ? mock.customers
          : [];

        const rows = [
          [
            "Customer ID",
            "Name",
            "Email",
            "Type",
            "Accounts",
            "Status",
            "Joined",
            "Phone"
          ]
        ];

        customers.forEach(function (customer) {
          rows.push([
            customer.id,
            customer.name,
            customer.email,
            customer.type,
            customer.accounts,
            customer.status,
            customer.joined,
            customer.phone || ""
          ]);
        });

        downloadManagementCsv(
          "northstar-management-customers.csv",
          rows
        );

        show("Customer directory exported.", "success");
        return;
      }

      if (actionName === "review-customer-queue") {
        const customers = mock && Array.isArray(mock.customers)
          ? mock.customers
          : [];

        const review = customers.filter(function (customer) {
          return customer.status === "Review";
        });

        show(
          review.length +
          " customer record(s) currently require review.",
          "info"
        );
      }
    });

    renderManagementCustomers();
  }

  function setupLogout() {
    document.querySelectorAll("[data-logout]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();

        sessionStorage.removeItem("northstarRole");

        show(
          "Signed out of the fictional management portal.",
          "info"
        );

        window.setTimeout(function () {
          window.location.href = "../public/login.html";
        }, 300);
      });
    });
  }

  function getManagementSettings() {
    const defaults = {
      sessionTimeout: "30",
      twoFactor: true,
      loginAlerts: true,
      transferAlerts: true,
      supportAlerts: true,
      securityAlerts: true,
      reportAlerts: false,
      currency: "USD",
      dateFormat: "MMM D, YYYY",
      pageSize: "25"
    };

    try {
      const stored =
        window.localStorage.getItem("northstarManagementSettings");

      if (!stored) {
        return defaults;
      }

      const parsed = JSON.parse(stored);

      return Object.assign({}, defaults, parsed);
    } catch (error) {
      return defaults;
    }
  }

  function saveManagementSettings(settings) {
    window.localStorage.setItem(
      "northstarManagementSettings",
      JSON.stringify(settings)
    );
  }

  function applyManagementSettings() {
    const settings = getManagementSettings();

    const fields = {
      sessionTimeout: document.querySelector("#management-session-timeout"),
      twoFactor: document.querySelector("#management-two-factor"),
      loginAlerts: document.querySelector("#management-login-alerts"),
      transferAlerts: document.querySelector("#management-transfer-alerts"),
      supportAlerts: document.querySelector("#management-support-alerts"),
      securityAlerts: document.querySelector("#management-security-alerts"),
      reportAlerts: document.querySelector("#management-report-alerts"),
      currency: document.querySelector("#management-currency"),
      dateFormat: document.querySelector("#management-date-format"),
      pageSize: document.querySelector("#management-page-size")
    };

    if (fields.sessionTimeout) {
      fields.sessionTimeout.value = settings.sessionTimeout;
    }

    if (fields.twoFactor) {
      fields.twoFactor.checked = Boolean(settings.twoFactor);
    }

    if (fields.loginAlerts) {
      fields.loginAlerts.checked = Boolean(settings.loginAlerts);
    }

    if (fields.transferAlerts) {
      fields.transferAlerts.checked = Boolean(settings.transferAlerts);
    }

    if (fields.supportAlerts) {
      fields.supportAlerts.checked = Boolean(settings.supportAlerts);
    }

    if (fields.securityAlerts) {
      fields.securityAlerts.checked = Boolean(settings.securityAlerts);
    }

    if (fields.reportAlerts) {
      fields.reportAlerts.checked = Boolean(settings.reportAlerts);
    }

    if (fields.currency) {
      fields.currency.value = settings.currency;
    }

    if (fields.dateFormat) {
      fields.dateFormat.value = settings.dateFormat;
    }

    if (fields.pageSize) {
      fields.pageSize.value = settings.pageSize;
    }
  }

  function readManagementSettingsFromForm() {
    return {
      sessionTimeout:
        document.querySelector("#management-session-timeout")?.value || "30",

      twoFactor:
        document.querySelector("#management-two-factor")?.checked || false,

      loginAlerts:
        document.querySelector("#management-login-alerts")?.checked || false,

      transferAlerts:
        document.querySelector("#management-transfer-alerts")?.checked || false,

      supportAlerts:
        document.querySelector("#management-support-alerts")?.checked || false,

      securityAlerts:
        document.querySelector("#management-security-alerts")?.checked || false,

      reportAlerts:
        document.querySelector("#management-report-alerts")?.checked || false,

      currency:
        document.querySelector("#management-currency")?.value || "USD",

      dateFormat:
        document.querySelector("#management-date-format")?.value ||
        "MMM D, YYYY",

      pageSize:
        document.querySelector("#management-page-size")?.value || "25"
    };
  }

  function setupManagementSettings() {
    const securityForm =
      document.querySelector("#management-security-form");

    const notificationForm =
      document.querySelector("#management-notification-form");

    const displayForm =
      document.querySelector("#management-display-form");

    if (!securityForm && !notificationForm && !displayForm) {
      return;
    }

    applyManagementSettings();

    [
      securityForm,
      notificationForm,
      displayForm
    ].forEach(function (form) {
      if (!form) return;

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        const settings = readManagementSettingsFromForm();

        saveManagementSettings(settings);
        applyManagementSettings();

        show(
          "Management settings saved.",
          "success"
        );
      });
    });

    const refreshButton =
      document.querySelector("[data-refresh-settings]");

    if (refreshButton) {
      refreshButton.addEventListener("click", function () {
        applyManagementSettings();

        show(
          "Management settings refreshed.",
          "success"
        );
      });
    }

    const resetButton =
      document.querySelector("[data-reset-settings]");

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        const confirmed = window.confirm(
          "Reset all management settings to their defaults?"
        );

        if (!confirmed) return;

        window.localStorage.removeItem(
          "northstarManagementSettings"
        );

        applyManagementSettings();

        show(
          "Management settings reset to defaults.",
          "success"
        );
      });
    }
  }

  function init() {
    renderDashboardMetrics();
    setupRefresh();
    setupDemoActions();
    setupManagementAccounts();
    setupManagementCustomers();
    setupTransactionControls();
    setupTransactionActions();
    setupTransferControls();
    setupTransferActions();
    setupLoanControls();
    setupLoanActions();
    renderManagementAuditLog();
    setupAuditControls();
    setupAuditActions();

    renderManagementReports();
    setupReportActions();
    setupSupportControls();
    setupSupportActions();
    setupCardControls();
    setupCardActions();
    setupManagementSettings();
    setupLogout();

    console.log("Northstar management portal ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
