const http = require("http");

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runPenetrationTests() {
  console.log("🛡️ Starting AI Penetration Testing & Vulnerability Audit...\n");
  let passed = 0;
  let failed = 0;

  // Test 1: Unauthorized Admin Settings Read (GET /api/settings)
  try {
    const res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/settings",
      method: "GET",
    });
    if (res.statusCode === 401) {
      console.log("✅ TEST 1 PASSED: Unauthenticated GET /api/settings correctly blocked with 401 Unauthorized.");
      passed++;
    } else {
      console.error(`❌ TEST 1 FAILED: Expected 401, got ${res.statusCode}: ${res.body}`);
      failed++;
    }
  } catch (e) {
    console.error("Test 1 error:", e);
    failed++;
  }

  // Test 2: Unauthorized Settings Bulk Overwrite (POST /api/settings/bulk)
  try {
    const res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/settings/bulk",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { SITE_TITLE: "Hacked by Hacker" }
    );
    if (res.statusCode === 401) {
      console.log("✅ TEST 2 PASSED: Malicious settings overwrite blocked with 401 Unauthorized.");
      passed++;
    } else {
      console.error(`❌ TEST 2 FAILED: Expected 401, got ${res.statusCode}`);
      failed++;
    }
  } catch (e) {
    console.error("Test 2 error:", e);
    failed++;
  }

  // Test 3: Unauthorized Wipe Banners (DELETE /api/banners/all)
  try {
    const res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/banners/all",
      method: "DELETE",
    });
    if (res.statusCode === 401) {
      console.log("✅ TEST 3 PASSED: Malicious banner wipe blocked with 401 Unauthorized.");
      passed++;
    } else {
      console.error(`❌ TEST 3 FAILED: Expected 401, got ${res.statusCode}`);
      failed++;
    }
  } catch (e) {
    console.error("Test 3 error:", e);
    failed++;
  }

  // Test 4: Unauthorized Product Injection (POST /api/products)
  try {
    const res = await request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/api/products",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { name: "Spam Injection Product", brandId: "b1", categoryId: "c1" }
    );
    if (res.statusCode === 401) {
      console.log("✅ TEST 4 PASSED: Unauthorized product creation blocked with 401 Unauthorized.");
      passed++;
    } else {
      console.error(`❌ TEST 4 FAILED: Expected 401, got ${res.statusCode}`);
      failed++;
    }
  } catch (e) {
    console.error("Test 4 error:", e);
    failed++;
  }

  // Test 5: Unauthorized Category Deletion (DELETE /api/categories/xyz)
  try {
    const res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/categories/dummy-cat-id",
      method: "DELETE",
    });
    if (res.statusCode === 401) {
      console.log("✅ TEST 5 PASSED: Unauthorized category deletion blocked with 401 Unauthorized.");
      passed++;
    } else {
      console.error(`❌ TEST 5 FAILED: Expected 401, got ${res.statusCode}`);
      failed++;
    }
  } catch (e) {
    console.error("Test 5 error:", e);
    failed++;
  }

  // Test 6: OWASP Security Headers Check
  try {
    const res = await request({
      hostname: "localhost",
      port: 5000,
      path: "/api/categories",
      method: "GET",
    });
    const headers = res.headers;
    const hasFrameOptions = headers["x-frame-options"] === "SAMEORIGIN";
    const hasContentTypeOptions = headers["x-content-type-options"] === "nosniff";
    const hasHsts = Boolean(headers["strict-transport-security"]);
    const hasRateLimit = Boolean(headers["x-ratelimit-limit"]);

    if (hasFrameOptions && hasContentTypeOptions && hasHsts && hasRateLimit) {
      console.log("✅ TEST 6 PASSED: All OWASP Security Headers (Clickjacking, MIME Sniffing, HSTS, RateLimit) active.");
      passed++;
    } else {
      console.error("❌ TEST 6 FAILED: Missing headers", { hasFrameOptions, hasContentTypeOptions, hasHsts, hasRateLimit });
      failed++;
    }
  } catch (e) {
    console.error("Test 6 error:", e);
    failed++;
  }

  // Test 7: Brute Force Rate Limiter Test on /api/auth/login
  try {
    let triggered429 = false;
    for (let i = 0; i < 20; i++) {
      const res = await request(
        {
          hostname: "localhost",
          port: 5000,
          path: "/api/auth/login",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        { email: "admin@test.com", password: "wrongpassword" }
      );
      if (res.statusCode === 429) {
        triggered429 = true;
        break;
      }
    }
    if (triggered429) {
      console.log("✅ TEST 7 PASSED: Brute-force login defense triggered HTTP 429 Too Many Requests lockout.");
      passed++;
    } else {
      console.error("❌ TEST 7 FAILED: Rate limiter did not lock out rapid brute-force attempts.");
      failed++;
    }
  } catch (e) {
    console.error("Test 7 error:", e);
    failed++;
  }

  console.log(`\n===========================================`);
  console.log(`🛡️ Penetration Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);
}

runPenetrationTests();
