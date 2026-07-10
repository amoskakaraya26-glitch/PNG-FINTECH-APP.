const http = require('http');
const data = JSON.stringify({ bank: 'kina', accountNumber: '1234567890', accountName: 'John Doe', pin: '1234' });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/bank/link',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('status', res.statusCode);
    console.log('body', body);
  });
});
req.on('error', (err) => {
  console.error(err);
});
req.write(data);
req.end();
