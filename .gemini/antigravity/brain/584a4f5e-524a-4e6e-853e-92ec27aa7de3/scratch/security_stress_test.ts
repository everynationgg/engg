import { randomUUID } from 'node:crypto';

// Use native fetch (Node 18+) to avoid axios dependency in scratch script
const API_BASE = process.env['API_BASE_URL'] || 'http://localhost:10000/api';
const TEST_EMAIL = `stress_${Date.now()}@example.com`;
const TEST_PASS = 'P@ssword123!';

async function stressTest() {
  console.log('>>> INITIATING SECURITY STRESS TEST');

  try {
    // 1. Setup: Register and Login
    console.log('--- Phase 1: Identity Provisioning ---');
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        username: `stresser_${Date.now()}`,
        password: TEST_PASS
      })
    });
    
    if (!regRes.ok) throw new Error(`Registration failed: ${regRes.status}`);
    const regData = await regRes.json() as { token: string };
    const token = regData.token;
    const authHeaders = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('Identity established.');

    // 2. Concurrency: Role Unlocks
    console.log('--- Phase 2: Role Unlock Concurrency ---');
    const unlockPromises = Array(5).fill(null).map(() => 
      fetch(`${API_BASE}/game/unlock-role`, { 
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ 
          sessionId: 'STRESS_TEST_ROOM', 
          roleId: 'virus' 
        })
      })
    );

    const unlockResults = await Promise.all(unlockPromises);
    const successes = unlockResults.filter(r => r.status === 200).length;
    const failures = unlockResults.filter(r => r.status !== 200).length;
    console.log(`Unlock results: ${successes} success, ${failures} failure (expected 1 success if credits allow)`);

    // 3. Idempotency: PayPal Capture
    console.log('--- Phase 3: PayPal Replay Attack ---');
    const orderID = 'FAKE_ORDER_' + randomUUID();
    const packId = 'credits_25';
    
    console.log('Simulating first capture...');
    const cap1 = await fetch(`${API_BASE}/shop/capture-order`, { 
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ orderID, packId })
    });
    
    console.log('Simulating replay attack...');
    const cap2 = await fetch(`${API_BASE}/shop/capture-order`, { 
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ orderID, packId })
    });

    console.log(`Replay result: ${cap2.status === 409 ? 'REJECTED (Correct)' : `ACCEPTED Status: ${cap2.status} (Potential Bug)`}`);

    // 4. Rate Limiting: Login Spam
    console.log('--- Phase 4: Auth Rate Limit Stress ---');
    console.log('Spamming login attempts...');
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: 'WRONG_PASSWORD'
        })
      });

      if (res.status === 429) {
        console.log(`Rate limit triggered at attempt ${i + 1} (Success)`);
        break;
      }
      
      if (i === 14) console.log('Rate limit NOT triggered after 15 attempts (Potential Config Issue)');
    }

    console.log('>>> STRESS TEST COMPLETE');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Stress test failed unexpectedly:', message);
  }
}

stressTest().catch(console.error);
