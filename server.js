const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const initSqlJs = require('sql.js');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'northstar_dev_secret_key_2026';
let db;

initSqlJs().then(SQL => {
  db = new SQL.Database();
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      account_number TEXT UNIQUE,
      balance REAL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_account TEXT,
      receiver_account TEXT,
      amount REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const checkUsers = db.exec("SELECT COUNT(*) as count FROM users")[0].values[0][0];
  if (checkUsers === 0) {
    db.run("INSERT INTO users (email, password) VALUES ('alice@northstar.com', 'password123')");
    db.run("INSERT INTO users (email, password) VALUES ('bob@northstar.com', 'password123')");
    db.run("INSERT INTO accounts (user_id, account_number, balance) VALUES (1, '5333982304', 500.0)");
    db.run("INSERT INTO accounts (user_id, account_number, balance) VALUES (2, '1644691475', 200.0)");
    console.log("Sample users & accounts created.");
  }

  console.log("Database initialized successfully.");
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access token required." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    req.user = user;
    next();
  });
};

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const stmt = db.prepare("SELECT u.id, u.email, a.account_number, a.balance FROM users u JOIN accounts a ON u.id = a.user_id WHERE u.email = :email AND u.password = :pass");
  const user = stmt.getAsObject({ ':email': email, ':pass': password });
  stmt.free();

  if (!user || !user.id) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = jwt.sign({ userId: user.id, email: user.email, accountNumber: user.account_number }, JWT_SECRET, { expiresIn: '1h' });
  return res.json({ token, user: { email: user.email, accountNumber: user.account_number, balance: user.balance } });
});

app.get('/api/customer/account', authenticateToken, (req, res) => {
  const stmt = db.prepare("SELECT account_number, balance FROM accounts WHERE user_id = :userId");
  const acc = stmt.getAsObject({ ':userId': req.user.userId });
  stmt.free();

  if (!acc || !acc.account_number) {
    return res.status(404).json({ error: "Account not found." });
  }

  res.json({ accountNumber: acc.account_number, balance: acc.balance });
});

app.post('/api/customer/transfer', authenticateToken, (req, res) => {
  const { receiverAccount, amount } = req.body;
  const senderAccount = req.user.accountNumber;

  if (!receiverAccount || !amount) {
    return res.status(400).json({ error: "receiverAccount and amount are required." });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Transfer amount must be a positive number." });
  }

  if (senderAccount === receiverAccount) {
    return res.status(400).json({ error: "Cannot transfer money to the same account." });
  }

  try {
    db.run("BEGIN TRANSACTION;");

    const senderStmt = db.prepare("SELECT balance FROM accounts WHERE account_number = :acc");
    const senderRes = senderStmt.getAsObject({ ':acc': senderAccount });
    senderStmt.free();

    if (!senderRes || senderRes.balance === undefined) {
      db.run("ROLLBACK;");
      return res.status(404).json({ error: "Sender account not found." });
    }

    if (senderRes.balance < parsedAmount) {
      db.run("ROLLBACK;");
      return res.status(400).json({ error: "Insufficient funds." });
    }

    const receiverStmt = db.prepare("SELECT id FROM accounts WHERE account_number = :acc");
    const receiverRes = receiverStmt.getAsObject({ ':acc': receiverAccount });
    receiverStmt.free();

    if (!receiverRes || receiverRes.id === undefined) {
      db.run("ROLLBACK;");
      return res.status(404).json({ error: "Receiver account not found." });
    }

    db.run("UPDATE accounts SET balance = balance - ? WHERE account_number = ?", [parsedAmount, senderAccount]);
    db.run("UPDATE accounts SET balance = balance + ? WHERE account_number = ?", [parsedAmount, receiverAccount]);

    const txId = 'tx_' + Date.now();
    db.run(
      "INSERT INTO transactions (sender_account, receiver_account, amount) VALUES (?, ?, ?)",
      [senderAccount, receiverAccount, parsedAmount]
    );

    db.run("COMMIT;");

    const updatedStmt = db.prepare("SELECT balance FROM accounts WHERE account_number = :acc");
    const updatedRes = updatedStmt.getAsObject({ ':acc': senderAccount });
    updatedStmt.free();

    return res.json({
      message: "Transfer successful",
      transactionId: txId,
      newBalance: updatedRes.balance
    });

  } catch (error) {
    db.run("ROLLBACK;");
    console.error("Transfer Error:", error);
    return res.status(500).json({ error: "Internal server error during transfer processing." });
  }
});

app.get('/api/customer/transactions/:accountNumber', authenticateToken, (req, res) => {
  const { accountNumber } = req.params;

  if (accountNumber !== req.user.accountNumber) {
    return res.status(403).json({ error: "Unauthorized access to transaction history." });
  }

  const stmt = db.prepare(`
    SELECT id, sender_account, receiver_account, amount, timestamp 
    FROM transactions 
    WHERE sender_account = :acc OR receiver_account = :acc 
    ORDER BY id DESC
  `);
  
  stmt.bind({ ':acc': accountNumber });
  const transactions = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    transactions.push({
      id: row.id,
      senderAccount: row.sender_account,
      receiverAccount: row.receiver_account,
      amount: row.amount,
      type: row.sender_account === accountNumber ? 'DEBIT' : 'CREDIT',
      timestamp: row.timestamp
    });
  }
  stmt.free();

  res.json({ accountNumber, transactions });
});

const PORT = 5000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`NorthstarBank Backend running on http://127.0.0.1:${PORT}`);
});

app.get('/api/statements/export', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const db = getDb();
    const account = db.prepare('SELECT id FROM accounts WHERE user_id = ?').get(userId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const transactions = db.prepare(
      'SELECT type, amount, description, created_at FROM transactions WHERE account_id = ? ORDER BY created_at DESC'
    ).all(account.id);

    let csv = 'Type,Amount,Description,Date\n';
    transactions.forEach(tx => {
      csv += '"' + tx.type + '",' + tx.amount + ',"' + (tx.description || '') + '","' + tx.created_at + '"\n';
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('account-statement.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate statement' });
  }
});
