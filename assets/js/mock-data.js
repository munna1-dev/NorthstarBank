/* Northstar Bank - fictional demo data */
window.NorthstarMock = {
  customer: {
    id: "CUS-100284",
    name: "Alex Morgan",
    email: "alex@example.test",
    phone: "+1 555 010 2840"
  },

  customers: [
    {
      id: "CUS-100284",
      name: "Alex Morgan",
      email: "alex@example.test",
      type: "Personal",
      accounts: 2,
      status: "Active",
      joined: "2026-09-20",
      phone: "+1 555 010 2840"
    },
    {
      id: "CUS-100285",
      name: "Jordan Lee",
      email: "jordan@example.test",
      type: "Personal",
      accounts: 3,
      status: "Active",
      joined: "2026-09-18",
      phone: "+1 555 010 2851"
    },
    {
      id: "CUS-100286",
      name: "Taylor Smith",
      email: "taylor@example.test",
      type: "Business",
      accounts: 1,
      status: "Review",
      joined: "2026-09-15",
      phone: "+1 555 010 2852"
    },
    {
      id: "CUS-100287",
      name: "Casey Brown",
      email: "casey@example.test",
      type: "Personal",
      accounts: 2,
      status: "Active",
      joined: "2026-09-11",
      phone: "+1 555 010 2853"
    }
  ],

  accounts: [
    {
      id: "ACC-001",
      customerId: "CUS-100284",
      customer: "Alex Morgan",
      type: "Checking",
      number: "****4821",
      balance: 4280.75,
      available: 4280.75,
      currency: "USD",
      status: "Active"
    },
    {
      id: "ACC-002",
      customerId: "CUS-100284",
      customer: "Alex Morgan",
      type: "Savings",
      number: "****9137",
      balance: 12650.40,
      available: 12650.40,
      currency: "USD",
      status: "Active"
    },
    {
      id: "ACC-003",
      customerId: "CUS-100285",
      customer: "Jordan Lee",
      type: "Checking",
      number: "****7712",
      balance: 8914.22,
      available: 8914.22,
      currency: "USD",
      status: "Active"
    },
    {
      id: "ACC-004",
      customerId: "CUS-100286",
      customer: "Taylor Smith",
      type: "Business",
      number: "****2284",
      balance: 24680.10,
      available: 24680.10,
      currency: "USD",
      status: "Pending"
    }
  ],

  transactions: [
    {
      id: "ACC-001",
      type: "Checking",
      number: "****4821",
      balance: 4280.75,
      available: 4280.75,
      status: "Active"
    },
    {
      id: "ACC-002",
      type: "Savings",
      number: "****9137",
      balance: 12650.40,
      available: 12650.40,
      status: "Active"
    }
  ],

  transactions: [
    {
      id: "TXN-1001",
      date: "2026-09-20",
      description: "Northstar Payroll",
      category: "Income",
      type: "Credit",
      amount: 3200.00,
      status: "Completed"
    },
    {
      id: "TXN-1002",
      date: "2026-09-19",
      description: "Metro Market",
      category: "Shopping",
      type: "Debit",
      amount: 86.42,
      status: "Completed"
    },
    {
      id: "TXN-1003",
      date: "2026-09-18",
      description: "City Utilities",
      category: "Bills",
      type: "Debit",
      amount: 142.80,
      status: "Completed"
    },
    {
      id: "TXN-1004",
      date: "2026-09-17",
      description: "Coffee House",
      category: "Food",
      type: "Debit",
      amount: 7.95,
      status: "Completed"
    },
    {
      id: "TXN-1005",
      date: "2026-09-15",
      description: "Interest Payment",
      category: "Interest",
      type: "Credit",
      amount: 24.18,
      status: "Completed"
    }
  ],

  beneficiaries: [
    {
      id: "BEN-001",
      name: "Jordan Lee",
      bank: "Northstar Bank",
      account: "****7712"
    },
    {
      id: "BEN-002",
      name: "Taylor Smith",
      bank: "Harbor Federal",
      account: "****2284"
    }
  ],

  cards: [
    {
      id: "CARD-001",
      name: "Northstar Everyday Card",
      number: "•••• •••• •••• 4821",
      type: "Debit",
      status: "Active",
      limit: 5000,
      available: 3925.50
    }
  ],

  loans: [
    {
      id: "LOAN-001",
      type: "Personal Loan",
      principal: 12000,
      balance: 8450.25,
      rate: 7.25,
      status: "Active"
    }
  ],

  transfers: [
    {
      id: "TRF-1001",
      date: "2026-09-20",
      customer: "Alex Morgan",
      from: "****4821",
      to: "****7712",
      type: "Internal",
      amount: 450.00,
      status: "Completed"
    },
    {
      id: "TRF-1002",
      date: "2026-09-19",
      customer: "Alex Morgan",
      from: "****4821",
      to: "****2284",
      type: "External",
      amount: 725.50,
      status: "Pending"
    },
    {
      id: "TRF-1003",
      date: "2026-09-17",
      customer: "Alex Morgan",
      from: "****9137",
      to: "****4821",
      type: "Internal",
      amount: 1000.00,
      status: "Completed"
    }
  ],

  notifications: [
    {
      id: "NOT-001",
      title: "Welcome to Northstar Bank",
      message: "Your fictional demo account is ready.",
      date: "2026-09-20",
      read: false
    },
    {
      id: "NOT-002",
      title: "Statement available",
      message: "Your latest demo statement is available.",
      date: "2026-09-18",
      read: true
    }
  ],

  supportCases: [
    {
      id: "CASE-1001",
      date: "2026-09-20",
      customer: "Alex Morgan",
      subject: "Card payment question",
      category: "Cards",
      priority: "Medium",
      status: "Open"
    },
    {
      id: "CASE-1002",
      date: "2026-09-19",
      customer: "Jordan Lee",
      subject: "Transfer pending",
      category: "Transfers",
      priority: "High",
      status: "Open"
    },
    {
      id: "CASE-1003",
      date: "2026-09-18",
      customer: "Taylor Smith",
      subject: "Statement request",
      category: "Statements",
      priority: "Low",
      status: "Resolved"
    },
    {
      id: "CASE-1004",
      date: "2026-09-17",
      customer: "Alex Morgan",
      subject: "Online banking access",
      category: "Access",
      priority: "High",
      status: "In Progress"
    }
  ],

  auditLogs: [
    {
      id: "AUD-1001",
      date: "2026-09-20T14:32:00",
      actor: "Maria Chen",
      role: "Manager",
      action: "Transfer reviewed",
      resource: "TRF-1002",
      details: "Reviewed pending external transfer.",
      status: "Success"
    },
    {
      id: "AUD-1002",
      date: "2026-09-20T12:15:00",
      actor: "David Wilson",
      role: "Manager",
      action: "Customer viewed",
      resource: "CUS-100284",
      details: "Viewed customer profile.",
      status: "Success"
    },
    {
      id: "AUD-1003",
      date: "2026-09-19T17:48:00",
      actor: "Maria Chen",
      role: "Manager",
      action: "Support case updated",
      resource: "CASE-1002",
      details: "Changed support case status to In Progress.",
      status: "Success"
    },
    {
      id: "AUD-1004",
      date: "2026-09-19T15:21:00",
      actor: "James Carter",
      role: "Administrator",
      action: "Card reviewed",
      resource: "CARD-001",
      details: "Reviewed customer card information.",
      status: "Success"
    },
    {
      id: "AUD-1005",
      date: "2026-09-18T10:06:00",
      actor: "Maria Chen",
      role: "Manager",
      action: "Report exported",
      resource: "REPORTS",
      details: "Exported management reports as CSV.",
      status: "Success"
    },
    {
      id: "AUD-1006",
      date: "2026-09-17T09:44:00",
      actor: "James Carter",
      role: "Administrator",
      action: "Login attempt",
      resource: "MANAGEMENT_PORTAL",
      details: "Management portal login was denied.",
      status: "Failed"
    }
  ],

  management: {
    customers: 1284,
    activeAccounts: 2147,
    pendingTransfers: 17,
    openSupportCases: 23,
    totalDeposits: 18425000.75,
    totalLoans: 6425000.50
  }
};
