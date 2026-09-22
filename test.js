async function testWorkflow() {
  const timestamp = Date.now();
  const aliceEmail = "alice_" + timestamp + "@example.com";
  const bobEmail = "bob_" + timestamp + "@example.com";

  const aliceReg = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: aliceEmail, password: "password123", fullName: "Alice Smith" })
  }).then(r => r.json());

  const bobReg = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: bobEmail, password: "password123", fullName: "Bob Jones" })
  }).then(r => r.json());

  console.log("Alice Account No:", aliceReg.accountNumber);
  console.log("Bob Account No:", bobReg.accountNumber);

  const aliceLogin = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: aliceEmail, password: "password123" })
  }).then(r => r.json());

  const aliceAccounts = await fetch("http://localhost:5000/api/customer/accounts", {
    headers: { "Authorization": "Bearer " + aliceLogin.token }
  }).then(r => r.json());

  const transfer = await fetch("http://localhost:5000/api/customer/transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + aliceLogin.token
    },
    body: JSON.stringify({
      senderAccountId: aliceAccounts[0].id,
      receiverAccountNumber: bobReg.accountNumber,
      amount: 150.0,
      description: "Dinner Split"
    })
  }).then(r => r.json());

  console.log("Transfer Result:", transfer);
}

testWorkflow();