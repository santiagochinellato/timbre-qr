
const http = require('http'); // Using http/https module or simple fetch if node version supports it (Node 18+)

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ENDPOINT = '/api/camera/snapshot';
const CONCURRENT_REQUESTS = 50;

async function runLoadTest() {
  console.log(`🚀 Starting Load Test against ${BASE_URL}${ENDPOINT}`);
  console.log(`🔥 Simulating ${CONCURRENT_REQUESTS} concurrent requests...`);

  const startTime = Date.now();
  const requests = [];

  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    requests.push(makeRequest(i));
  }

  const results = await Promise.all(requests);
  const totalTime = Date.now() - startTime;

  // Analysis
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const cacheHits = results.filter(r => r.cacheStatus.includes('HIT')).length;
  const cacheMisses = results.filter(r => r.cacheStatus.includes('MISS')).length;
  const cacheCoalesced = results.filter(r => r.cacheStatus.includes('COALESCED')).length;

  console.log('\n--- 📊 LOAD TEST RESULTS ---');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed:     ${failed}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  console.log(`⚡ Avg Time:   ${(totalTime / CONCURRENT_REQUESTS).toFixed(2)}ms (Approx per batch)`);
  
  console.log('\n--- 🧠 CACHE BEHAVIOR ---');
  console.log(`🎯 HIT:        ${cacheHits}`);
  console.log(`🆕 MISS:       ${cacheMisses} (Should be ~1)`);
  console.log(`🤝 COALESCED:  ${cacheCoalesced} (Should be ~${CONCURRENT_REQUESTS - 1})`);

  if (cacheMisses > 5) {
      console.error("\n⚠️ WARNING: Too many misses! Mutex might not be working or 'concurrent' loop isn't tight enough.");
  } else {
      console.log("\n✅ SUCCESS: Mutex is effective. Only minimal processes spawned.");
  }
}

async function makeRequest(id) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
        cache: 'no-store' // Ensure client doesn't cache, forcing server to handle it
    });
    
    // Read debugging headers
    const cacheStatus = res.headers.get('X-Cache-Status') || 'UNKNOWN';
    
    // We expect image back
    const blob = await res.blob();
    const duration = Date.now() - start;

    return { 
        id, 
        success: res.ok, 
        status: res.status, 
        duration,
        cacheStatus
    };
  } catch (err) {
    return { 
        id, 
        success: false, 
        error: err.message, 
        duration: Date.now() - start 
    };
  }
}

runLoadTest();
