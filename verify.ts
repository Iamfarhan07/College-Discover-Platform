// Fetch is natively supported in Node 22

const BASE_URL = "http://localhost:3000";

interface Assertion {
  name: string;
  run: () => Promise<void>;
}

const tests: Assertion[] = [];

// Helper to log test outcomes
function logSuccess(message: string) {
  console.log(`\x1b[32m✔ PASS: ${message}\x1b[0m`);
}

function logFailure(message: string, error?: any) {
  console.error(`\x1b[31m✘ FAIL: ${message}\x1b[0m`);
  if (error) {
    console.error(error);
  }
}

// Global state for dynamic test execution
let authToken = "";
let registeredEmail = `test_${Date.now()}@example.com`;
let testCollegeId1 = 0;
let testCollegeId2 = 0;
let testCollegeId3 = 0;

// ----------------------------------------------------
// FEATURE 1: COLLEGE LISTING + SEARCH
// ----------------------------------------------------
tests.push({
  name: "Feature 1: GET /api/colleges - Default Listing",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/colleges`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const json: any = await res.json();

    if (!Array.isArray(json.data)) throw new Error("Data is not an array");
    if (json.data.length !== 10) throw new Error(`Expected 10 colleges, got ${json.data.length}`);
    
    // Dynamically store IDs for downstream tests
    testCollegeId1 = json.data[0].id;
    testCollegeId2 = json.data[1].id;
    testCollegeId3 = json.data[2].id;

    console.log(`Resolved test IDs dynamically: ${testCollegeId1}, ${testCollegeId2}, ${testCollegeId3}`);

    const meta = json.meta;
    if (meta.page !== 1 || meta.limit !== 10 || meta.total !== 20 || meta.totalPages !== 2) {
      throw new Error("Invalid meta fields");
    }

    const first = json.data[0];
    const keys = ["id", "name", "location", "fees", "rating", "type", "established"];
    keys.forEach(k => {
      if (first[k] === undefined) throw new Error(`Missing college key: ${k}`);
    });
  }
});

tests.push({
  name: "Feature 1: GET /api/colleges - Fuzzy Search & Location Filter",
  run: async () => {
    // Fuzzy search for "Bombay"
    const resSearch = await fetch(`${BASE_URL}/api/colleges?search=Bombay`);
    const jsonSearch: any = await resSearch.json();
    if (jsonSearch.data.length !== 1 || !jsonSearch.data[0].name.includes("Bombay")) {
      throw new Error("Fuzzy search for Bombay failed");
    }

    // Filter by location "Delhi" (IIT Delhi, DTU, NSUT)
    const resLoc = await fetch(`${BASE_URL}/api/colleges?location=Delhi`);
    const jsonLoc: any = await resLoc.json();
    if (jsonLoc.data.length !== 3) {
      throw new Error(`Expected 3 colleges in Delhi, got ${jsonLoc.data.length}`);
    }
  }
});

tests.push({
  name: "Feature 1: GET /api/colleges - Search validation (length < 2)",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/colleges?search=a`);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const json: any = await res.json();
    if (!json.error || !json.details || !json.details.search) {
      throw new Error("Invalid error formatting for search length validation");
    }
  }
});

tests.push({
  name: "Feature 1: GET /api/colleges - Range & Rating Filters",
  run: async () => {
    // Fees filter: 0 to 200,000
    const resFees = await fetch(`${BASE_URL}/api/colleges?minFees=0&maxFees=200000`);
    const jsonFees: any = await resFees.json();
    // IISc is 120k, Jadavpur is 10k
    if (jsonFees.data.length !== 2) {
      throw new Error(`Expected 2 colleges in 0-200k fees range, got ${jsonFees.data.length}`);
    }

    // Rating filter: minRating = 4.8
    const resRating = await fetch(`${BASE_URL}/api/colleges?minRating=4.8`);
    const jsonRating: any = await resRating.json();
    if (jsonRating.data.length < 3) {
      throw new Error(`Expected at least 3 colleges with rating >= 4.8, got ${jsonRating.data.length}`);
    }
  }
});

tests.push({
  name: "Feature 1: GET /api/colleges - Sorting (fees_asc & rating_desc)",
  run: async () => {
    // Sort fees_asc (Jadavpur at 10000 should be first)
    const resAsc = await fetch(`${BASE_URL}/api/colleges?sortBy=fees_asc`);
    const jsonAsc: any = await resAsc.json();
    if (jsonAsc.data[0].fees !== 10000) {
      throw new Error(`Expected cheapest college (10000) first, got ${jsonAsc.data[0].fees}`);
    }

    // Sort rating_desc
    const resRating = await fetch(`${BASE_URL}/api/colleges?sortBy=rating_desc`);
    const jsonRating: any = await resRating.json();
    if (jsonRating.data[0].rating !== 4.9) {
      throw new Error(`Expected top rated (4.9) first, got ${jsonRating.data[0].rating}`);
    }
  }
});

tests.push({
  name: "Feature 1: GET /api/colleges - Pagination limit constraints",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/colleges?limit=60`);
    if (res.status !== 400) throw new Error(`Expected 400 on limit=60, got ${res.status}`);
  }
});

// ----------------------------------------------------
// FEATURE 2: COLLEGE DETAIL
// ----------------------------------------------------
tests.push({
  name: "Feature 2: GET /api/colleges/:id - Success Detail",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/colleges/${testCollegeId1}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const college: any = await res.json();

    if (college.id !== testCollegeId1 || !college.courses || !college.placements || !college.reviews) {
      throw new Error("Missing detail keys or invalid ID");
    }

    if (college.courses.length === 0) {
      throw new Error("Courses count is zero");
    }

    if (college.reviews.length === 0) {
      throw new Error("Reviews count is zero");
    }
  }
});

tests.push({
  name: "Feature 2: GET /api/colleges/:id - Not Found (404)",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/colleges/999999`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    const json: any = await res.json();
    if (json.error !== "College not found") {
      throw new Error(`Expected 'College not found' message, got '${json.error}'`);
    }
  }
});

tests.push({
  name: "Feature 2: GET /api/colleges/:id - Reviews Pagination",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/colleges/${testCollegeId1}?reviewPage=1&reviewLimit=1`);
    const college: any = await res.json();
    if (college.reviews.length !== 1) {
      throw new Error(`Expected 1 review, got ${college.reviews.length}`);
    }
  }
});

// ----------------------------------------------------
// FEATURE 3: COMPARE COLLEGES
// ----------------------------------------------------
tests.push({
  name: "Feature 3: GET /api/colleges/compare - Success 2 or 3 IDs",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/colleges/compare?ids=${testCollegeId1},${testCollegeId2},${testCollegeId3}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const result: any = await res.json();

    if (result.length !== 3) throw new Error(`Expected 3 compared colleges, got ${result.length}`);
    const first = result[0];
    if (first.id !== testCollegeId1 || first.placements.averagePackage === undefined || first.courses === undefined) {
      throw new Error("Comparison mapping is incorrect");
    }
  }
});

tests.push({
  name: "Feature 3: GET /api/colleges/compare - Validation constraints (<2, >3 IDs)",
  run: async () => {
    // 1 ID
    const res1 = await fetch(`${BASE_URL}/api/colleges/compare?ids=${testCollegeId1}`);
    if (res1.status !== 400) throw new Error(`Expected 400 on 1 ID, got ${res1.status}`);

    // 4 IDs
    const res4 = await fetch(`${BASE_URL}/api/colleges/compare?ids=${testCollegeId1},${testCollegeId2},${testCollegeId3},999999`);
    if (res4.status !== 400) throw new Error(`Expected 400 on 4 IDs, got ${res4.status}`);

    // Duplicate IDs
    const resDup = await fetch(`${BASE_URL}/api/colleges/compare?ids=${testCollegeId1},${testCollegeId1}`);
    if (resDup.status !== 400) throw new Error(`Expected 400 on duplicates, got ${resDup.status}`);
  }
});

tests.push({
  name: "Feature 3: GET /api/colleges/compare - College not found (400)",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/colleges/compare?ids=${testCollegeId1},999999`);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const json: any = await res.json();
    if (json.error !== "One or more college IDs were not found") {
      throw new Error("Incorrect error message for comparison not found");
    }
  }
});

// ----------------------------------------------------
// FEATURE 4: AUTHENTICATION + SAVED ITEMS
// ----------------------------------------------------
tests.push({
  name: "Feature 4: POST /api/auth/register - Success",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Verifier User",
        email: registeredEmail,
        password: "securepassword123",
      }),
    });
    if (res.status !== 201) throw new Error(`Status: ${res.status}`);
    const json: any = await res.json();
    if (!json.token || !json.user || json.user.passwordHash !== undefined) {
      throw new Error("Registration response failed keys validation");
    }
    authToken = json.token;
  }
});

tests.push({
  name: "Feature 4: POST /api/auth/register - Email Conflict (409)",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Verifier User Duplicate",
        email: registeredEmail,
        password: "securepassword123",
      }),
    });
    if (res.status !== 409) throw new Error(`Expected 409, got ${res.status}`);
  }
});

tests.push({
  name: "Feature 4: POST /api/auth/login - Success",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: registeredEmail,
        password: "securepassword123",
      }),
    });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const json: any = await res.json();
    if (!json.token || !json.user || json.user.passwordHash !== undefined) {
      throw new Error("Login response failed keys validation");
    }
  }
});

tests.push({
  name: "Feature 4: POST /api/auth/login - Invalid Credentials (401)",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: registeredEmail,
        password: "wrongpassword",
      }),
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  }
});

tests.push({
  name: "Feature 4: POST /api/saved/colleges - Save college & check auth",
  run: async () => {
    // 1. Unauthenticated save (missing header)
    const resNoAuth = await fetch(`${BASE_URL}/api/saved/colleges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collegeId: testCollegeId1 }),
    });
    if (resNoAuth.status !== 401) {
      throw new Error(`Expected 401 on unauthenticated save, got ${resNoAuth.status}`);
    }

    // 2. Authenticated save (IIT Bombay)
    const resAuth = await fetch(`${BASE_URL}/api/saved/colleges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ collegeId: testCollegeId1 }),
    });
    if (resAuth.status !== 201) {
      throw new Error(`Expected 201, got ${resAuth.status}`);
    }

    // 3. Save already saved college (Conflict 409)
    const resConflict = await fetch(`${BASE_URL}/api/saved/colleges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ collegeId: testCollegeId1 }),
    });
    if (resConflict.status !== 409) {
      throw new Error(`Expected 409 conflict, got ${resConflict.status}`);
    }

    // 4. Save not found college (404)
    const resNotFound = await fetch(`${BASE_URL}/api/saved/colleges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ collegeId: 999999 }),
    });
    if (resNotFound.status !== 404) {
      throw new Error(`Expected 404 not found, got ${resNotFound.status}`);
    }
  }
});

tests.push({
  name: "Feature 4: GET /api/saved/colleges - Retrieve saved colleges",
  run: async () => {
    const res = await fetch(`${BASE_URL}/api/saved/colleges`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const list: any = await res.json();

    if (list.length !== 1 || list[0].id !== testCollegeId1) {
      throw new Error("Saved list content does not match saved college");
    }
  }
});

tests.push({
  name: "Feature 4: DELETE /api/saved/colleges/:id - Remove saved college",
  run: async () => {
    // 1. Delete college
    const resDel = await fetch(`${BASE_URL}/api/saved/colleges/${testCollegeId1}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (resDel.status !== 200) throw new Error(`Status: ${resDel.status}`);

    // 2. Retrieve list again (should be empty)
    const resCheck = await fetch(`${BASE_URL}/api/saved/colleges`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const list: any = await resCheck.json();
    if (list.length !== 0) {
      throw new Error("List is not empty after deletion");
    }

    // 3. Delete not found in list (404)
    const resNotFound = await fetch(`${BASE_URL}/api/saved/colleges/${testCollegeId1}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (resNotFound.status !== 404) {
      throw new Error(`Expected 404 not found on subsequent delete, got ${resNotFound.status}`);
    }
  }
});

// Run all test definitions
async function runSuite() {
  console.log("\n=========================================");
  console.log("🚀 STARTING INTEGRATION TEST VERIFICATION");
  console.log("=========================================");
  let passedCount = 0;
  
  for (const test of tests) {
    try {
      await test.run();
      logSuccess(test.name);
      passedCount++;
    } catch (e: any) {
      logFailure(test.name, e);
    }
  }

  console.log("=========================================");
  console.log(`📊 RESULTS: ${passedCount}/${tests.length} tests passed`);
  console.log("=========================================\n");
  
  if (passedCount !== tests.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite();
