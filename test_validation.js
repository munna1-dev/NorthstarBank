const http = require('http');

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log("--- Test 1: Negative Amount Transfer ---");
  const test1 = await makeRequest('/api/customer/transfer', {
    senderAccount: '5333982304',
    receiverAccount: '1644691475',
    amount: -50
  });
  console.log("Status:", test1.status, "| Response:", test1.body);

  console.log("\n--- Test 2: Transfer to Non-Existent Account ---");
  const test2 = await makeRequest('/api/customer/transfer', {
    senderAccount: '5333982304',
    receiverAccount: '0000000000',
    amount: 50
  });
  console.log("Status:", test2.status, "| Response:", test2.body);

  console.log("\n--- Test 3: Valid Transfer ---");
  const test3 = await makeRequest('/api/customer/transfer', {
    senderAccount: '5333982304',
    receiverAccount: '1644691475',
    amount: 50
  });
  console.log("Status:", test3.status, "| Response:", test3.body);
}

runTests();
