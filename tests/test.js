/**
 * Simple test suite (no external dependencies needed)
 * CodeBuild runs this during the Build stage
 */

const http = require('http');

const PORT = 8081; // Use a test port
let server;

// Start the app on the test port
process.env.PORT = PORT;
const app = require('../app');

function request(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Wait a moment for server to start
  await new Promise(r => setTimeout(r, 1000));

  // Test 1: Health endpoint returns 200
  try {
    const res = await request('/health');
    if (res.status === 200) {
      console.log('✅ PASS: GET /health returns 200');
      passed++;
    } else {
      console.log(`❌ FAIL: GET /health returned ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.log(`❌ FAIL: GET /health - ${e.message}`);
    failed++;
  }

  // Test 2: Health response has required fields
  try {
    const res = await request('/health');
    const body = JSON.parse(res.body);
    if (body.status && body.timestamp && body.version) {
      console.log('✅ PASS: /health response has required fields');
      passed++;
    } else {
      console.log('❌ FAIL: /health response missing fields');
      failed++;
    }
  } catch (e) {
    console.log(`❌ FAIL: /health parse - ${e.message}`);
    failed++;
  }

  // Test 3: API info endpoint
  try {
    const res = await request('/api/info');
    if (res.status === 200) {
      console.log('✅ PASS: GET /api/info returns 200');
      passed++;
    } else {
      console.log(`❌ FAIL: GET /api/info returned ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.log(`❌ FAIL: GET /api/info - ${e.message}`);
    failed++;
  }

  // Test 4: Main page serves HTML
  try {
    const res = await request('/');
    if (res.status === 200 && res.body.includes('<!DOCTYPE html>')) {
      console.log('✅ PASS: GET / serves HTML page');
      passed++;
    } else {
      console.log('❌ FAIL: GET / did not serve HTML');
      failed++;
    }
  } catch (e) {
    console.log(`❌ FAIL: GET / - ${e.message}`);
    failed++;
  }

  // Summary
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    process.exit(1); // Non-zero exit = build failure in CodeBuild
  }

  process.exit(0);
}

runTests();
