// Automated QA script for PRISMS API

const BASE_URL = 'http://localhost:5000/api/v1';
let passed = 0;
let failed = 0;

async function runTest(name: string, requestPromise: Promise<Response>, expectedStatus: number) {
  try {
    const res = await requestPromise;
    if (res.status === expectedStatus) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      const text = await res.text();
      console.error(`❌ [FAIL] ${name} - Expected ${expectedStatus}, got ${res.status}. Response: ${text}`);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [FAIL] ${name} - Network/Crash Error:`, err);
    failed++;
  }
}

async function startTests() {
  console.log('--- STARTING API QA SWEEP ---\n');

  // 1. Auth Module
  await runTest('Register with invalid email format', fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email: 'not-an-email', password: 'Password123!', role: 'farmer' })
  }), 400);

  // Note: Seed data creates random stuff, let's create a known duplicate
  await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Dup', email: 'dup@test.com', password: 'Password123!', role: 'farmer' })
  });

  await runTest('Register with duplicate email', fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Dup', email: 'dup@test.com', password: 'Password123!', role: 'farmer' })
  }), 409);

  await runTest('Login with wrong password', fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dup@test.com', password: 'WrongPassword!' })
  }), 401);

  // 2. User Module
  await runTest('Fetch /users/me without token', fetch(`${BASE_URL}/users/me`), 401);

  // 3. Markets Module
  await runTest('Markets: Lat without Lng', fetch(`${BASE_URL}/markets?lat=18.5`), 400);
  
  await runTest('Markets: Invalid string for coordinates', fetch(`${BASE_URL}/markets?lat=abc&lng=def`), 400);

  // 4. Prices Module
  await runTest('Prices: Missing commodity', fetch(`${BASE_URL}/prices?marketId=123`), 400);

  // 5. Net Earning Module
  await runTest('NetEarning: Negative quantity', fetch(`${BASE_URL}/net-earning`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commodity: 'Onion', quantityQuintals: -10, farmerLat: 18.5, farmerLng: 73.8 })
  }), 400);

  await runTest('NetEarning: Out of bounds Lat', fetch(`${BASE_URL}/net-earning`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commodity: 'Onion', quantityQuintals: 10, farmerLat: 900, farmerLng: 73.8 })
  }), 400);

  // 6. Forecast Engine
  await runTest('Forecast: Invalid days enum', fetch(`${BASE_URL}/forecast?marketId=123&commodity=Onion&days=100`), 400);

  console.log(`\n--- RESULTS: ${passed} Passed | ${failed} Failed ---`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

startTests();
