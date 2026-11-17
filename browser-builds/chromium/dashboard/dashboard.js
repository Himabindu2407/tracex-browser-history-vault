const $ = (id) => document.getElementById(id);
let allVisits = [], allEvents = [];
const PAGE_SIZE = 50;
let currentPage = 1;
function paginateRows(rows, page, pageSize = PAGE_SIZE) {
  const safeSize = Math.max(1, Math.floor(Number(pageSize) || PAGE_SIZE));
  const pageCount = Math.max(1, Math.ceil(rows.length / safeSize));
  const safePage = Math.min(Math.max(1, Math.floor(Number(page) || 1)), pageCount);
  const start = (safePage - 1) * safeSize;
  return { items: rows.slice(start, start + safeSize), page: safePage, pageCount, start, end: Math.min(start + safeSize, rows.length) };
}
function dateText(value) { return new Date(value).toLocaleString(); }
function safeText(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function safeHref(value) {
  try {
    const parsed = new URL(String(value || ""));
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.username && !parsed.password ? parsed.href : "#";
  } catch { return "#"; }
}
function csvSafeCell(value) {
  let text = String(value ?? "");
  // Prefix spreadsheet formula-leading cells so exports are inert when opened in spreadsheet apps.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}
async function load() {
  [allVisits, allEvents] = await Promise.all([btGetAll(), btGetAll(BT_EVENTS)]);
  allVisits.sort((a,b) => b.visitedAt - a.visitedAt);
  $("totalVisits").textContent = allVisits.length.toLocaleString();
  $("uniqueDomains").textContent = new Set(allVisits.map(v => v.domain)).size.toLocaleString();
  $("deletionEvents").textContent = allEvents.length.toLocaleString();
  const settings = await chrome.storage.local.get({trackingEnabled:true});
  $("trackingState").textContent = settings.trackingEnabled ? "● Tracking active" : "● Tracking paused";
  $("toggle").textContent = settings.trackingEnabled ? "Pause tracking" : "Resume tracking";
  render();
  $("eventList").innerHTML = allEvents.length ? [...allEvents].sort((a,b)=>b.eventAt-a.eventAt).map(e =>
    `<div class="event"><strong>${safeText(e.note)}</strong><br><small>${safeText(dateText(e.eventAt))}</small></div>`).join("") : "No events recorded.";
}
function render() {
  const q = $("search").value.trim().toLowerCase();
  const from = $("fromDate").value ? new Date($("fromDate").value+"T00:00:00").getTime() : 0;
  const to = $("toDate").value ? new Date($("toDate").value+"T23:59:59").getTime() : Infinity;
  const rows = allVisits.filter(v => v.visitedAt >= from && v.visitedAt <= to && (!q || `${v.url} ${v.title} ${v.domain}`.toLowerCase().includes(q)));
  const pageData = paginateRows(rows, currentPage);
  currentPage = pageData.page;
  $("historyRows").innerHTML = rows.length ? pageData.items.map(v => `<tr><td><a href="${safeText(safeHref(v.url))}" target="_blank" rel="noreferrer">${safeText(v.title || v.url)}</a></td><td>${safeText(v.domain)}</td><td>${safeText(dateText(v.visitedAt))}</td></tr>`).join("") : `<tr><td colspan="3" class="empty">No matching records found.</td></tr>`;
  $("resultCount").textContent = rows.length ? `Showing ${pageData.start + 1}–${pageData.end} of ${rows.length} matching visits (${allVisits.length} saved total)` : `Showing 0 of ${allVisits.length} saved visits`;
  $("pageStatus").textContent = `Page ${pageData.page} of ${pageData.pageCount}`;
  $("prevPage").disabled = pageData.page <= 1;
  $("nextPage").disabled = pageData.page >= pageData.pageCount;
}
function download(name, type, content) {
  const blob = new Blob([content], {type}), url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("search").addEventListener("input", () => { currentPage = 1; render(); });
$("fromDate").addEventListener("change", () => { currentPage = 1; render(); });
$("toDate").addEventListener("change", () => { currentPage = 1; render(); });
$("prevPage").addEventListener("click", () => { currentPage = Math.max(1, currentPage - 1); render(); });
$("nextPage").addEventListener("click", () => { currentPage += 1; render(); });
$("refresh").addEventListener("click", load);
$("exportJson").addEventListener("click", () => download("tracex-history.json","application/json",JSON.stringify({visits:allVisits,events:allEvents},null,2)));
$("exportCsv").addEventListener("click", () => {
  const lines = [["Title","URL","Domain","Visited At"], ...allVisits.map(v=>[v.title,v.url,v.domain,dateText(v.visitedAt)])];
  download("tracex-history.csv","text/csv;charset=utf-8",lines.map(row=>row.map(csvSafeCell).join(",")).join("\n"));
});
$("toggle").addEventListener("click", async () => {
  const s=await chrome.storage.local.get({trackingEnabled:true});
  await chrome.storage.local.set({trackingEnabled:!s.trackingEnabled}); await load();
});
$("clear").addEventListener("click", async () => {
  if (!confirm("Permanently delete all TraceX visits and event records from this browser profile?")) return;
  await btDeleteAll(); await load();
});
load().catch(err=>{console.error(err);$("historyRows").innerHTML='<tr><td colspan="3" class="empty">Could not load TraceX local history database.</td></tr>';});

// Synthetic, temporary records are used to exercise the same IndexedDB cleanup routine.
// They are removed at the end of the test and are never uploaded.
async function runRetentionSelfTest() {
  const button = $("runRetentionTest");
  const output = $("retentionTestResult");
  button.disabled = true;
  output.className = "testresult";
  output.textContent = "Running retention checks…";
  const runId = "TRACEX-TEST-" + Date.now();
  const now = new Date();
  const cutoff = btRetentionCutoff(now);
  const fixtures = [
    { key: "older_than_3_months", visitedAt: new Date(now.getFullYear(), now.getMonth()-3, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()).getTime(), shouldRemain: false },
    { key: "older_than_2_months_plus_1_day", visitedAt: cutoff - 24*60*60*1000, shouldRemain: false },
    { key: "exactly_2_months_boundary", visitedAt: cutoff, shouldRemain: true },
    { key: "yesterday", visitedAt: now.getTime() - 24*60*60*1000, shouldRemain: true },
    { key: "today", visitedAt: now.getTime(), shouldRemain: true }
  ];
  let fixtureIds = [];
  let testPassed = false;
  try {
    const db = await btOpenDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(BT_STORE, "readwrite");
      const store = tx.objectStore(BT_STORE);
      fixtures.forEach(f => {
        const req = store.add({
          url: "https://tracex-test.invalid/" + f.key,
          title: "[TraceX temporary retention test] " + f.key,
          domain: "tracex-test.invalid",
          visitedAt: f.visitedAt,
          testRunId: runId
        });
        req.onsuccess = () => fixtureIds.push(req.result);
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();

    // Freeze the cleanup clock to the same instant used to create the exact-boundary fixture.
    await btDeleteExpired(now);

    // Read directly: btGetAll() intentionally runs cleanup with the live clock, which would
    // move the cutoff forward by a few milliseconds and invalidate an exact-boundary test.
    const readDb = await btOpenDB();
    const all = await new Promise((resolve, reject) => {
      const tx = readDb.transaction(BT_STORE, "readonly");
      const req = tx.objectStore(BT_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => readDb.close();
    });
    const remaining = all.filter(row => row.testRunId === runId);
    const failures = fixtures.filter(f => {
      const exists = remaining.some(row => row.title.endsWith(f.key));
      return exists !== f.shouldRemain;
    });

    // Remove all surviving synthetic fixtures so they never appear in user history.
    const cleanupDb = await btOpenDB();
    await new Promise((resolve, reject) => {
      const tx = cleanupDb.transaction(BT_STORE, "readwrite");
      const store = tx.objectStore(BT_STORE);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        if (cursor.value.testRunId === runId) cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    cleanupDb.close();

    testPassed = failures.length === 0;
    output.textContent = [
      testPassed ? "PASS — all retention checks passed." : "FAIL — one or more checks did not match expectations.",
      ...fixtures.map(f => {
        const expected = f.shouldRemain ? "RETAIN" : "DELETE";
        const found = remaining.some(row => row.title.endsWith(f.key));
        return `${f.key}: expected ${expected}; observed ${found ? "RETAINED" : "DELETED"}`;
      }),
      "Temporary test records cleaned up."
    ].join("\n");
    output.className = "testresult " + (testPassed ? "pass" : "fail");
  } catch (error) {
    console.error("TraceX retention self-test failed:", error);
    output.textContent = "TEST ERROR: " + (error.message || String(error));
    output.className = "testresult fail";
  } finally {
    button.disabled = false;
    await load();
  }
}
if ($("runRetentionTest")) $("runRetentionTest").addEventListener("click", runRetentionSelfTest);


// Phase 2: verify IndexedDB write/read/reopen integrity without touching real records.
async function runIntegritySelfTest() {
  const button = $("runIntegrityTest");
  const output = $("integrityTestResult");
  button.disabled = true;
  output.className = "testresult";
  output.textContent = "Running data integrity checks…";
  const runId = "TRACEX-INTEGRITY-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  const now = Date.now();
  const fixtures = [
    { url: "https://tracex-integrity.invalid/alpha", title: "TraceX integrity fixture alpha", domain: "tracex-integrity.invalid", visitedAt: now - 3000 },
    { url: "https://tracex-integrity.invalid/beta?sample=2", title: "TraceX integrity fixture beta", domain: "tracex-integrity.invalid", visitedAt: now - 2000 },
    { url: "https://example.org/tracex-integrity-check", title: "TraceX integrity fixture gamma", domain: "example.org", visitedAt: now - 1000 }
  ];
  let fixtureIds = [];
  const checks = [];
  try {
    // First connection: write uniquely tagged synthetic rows.
    const writeDb = await btOpenDB();
    await new Promise((resolve, reject) => {
      const tx = writeDb.transaction(BT_STORE, "readwrite");
      const store = tx.objectStore(BT_STORE);
      fixtures.forEach(f => {
        const req = store.add({ ...f, testRunId: runId, source: "phase2-integrity-test" });
        req.onsuccess = () => fixtureIds.push(req.result);
        req.onerror = () => reject(req.error);
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Write transaction aborted"));
    });
    writeDb.close();
    checks.push(["IndexedDB write transaction", fixtureIds.length === fixtures.length]);

    // Second connection simulates reopening the database after a page/context restart.
    const readDb = await btOpenDB();
    const rows = await new Promise((resolve, reject) => {
      const tx = readDb.transaction(BT_STORE, "readonly");
      const req = tx.objectStore(BT_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => readDb.close();
    });
    const found = rows.filter(row => row.testRunId === runId);
    checks.push(["Read after database reopen", found.length === fixtures.length]);
    checks.push(["Unique auto-generated record IDs", new Set(found.map(row => row.id)).size === fixtures.length && found.every(row => Number.isInteger(row.id))]);
    const fieldsMatch = fixtures.every(f => found.some(row => row.url === f.url && row.title === f.title && row.domain === f.domain && row.visitedAt === f.visitedAt && row.source === "phase2-integrity-test"));
    checks.push(["URL, title, domain and timestamp integrity", fieldsMatch]);
    checks.push(["No duplicate fixture rows", found.length === fixtures.length && found.every(row => row.testRunId === runId)]);

    // Delete only rows created by this run; never clear user records.
    const deleteDb = await btOpenDB();
    await new Promise((resolve, reject) => {
      const tx = deleteDb.transaction(BT_STORE, "readwrite");
      const cursorReq = tx.objectStore(BT_STORE).openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        if (cursor.value.testRunId === runId) cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Cleanup transaction aborted"));
    });
    deleteDb.close();
    const verifyDb = await btOpenDB();
    const leftovers = await new Promise((resolve, reject) => {
      const tx = verifyDb.transaction(BT_STORE, "readonly");
      const req = tx.objectStore(BT_STORE).getAll();
      req.onsuccess = () => resolve((req.result || []).filter(row => row.testRunId === runId));
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => verifyDb.close();
    });
    checks.push(["Temporary test rows removed", leftovers.length === 0]);

    const passed = checks.every(([, ok]) => ok);
    output.textContent = [
      passed ? "PASS — all Phase 2 integrity checks passed." : "FAIL — one or more Phase 2 checks failed.",
      ...checks.map(([name, ok]) => `${ok ? "PASS" : "FAIL"} — ${name}`),
      "Temporary test rows cleaned up; existing user records were not cleared."
    ].join("\n");
    output.className = "testresult " + (passed ? "pass" : "fail");
  } catch (error) {
    console.error("TraceX Phase 2 integrity test failed:", error);
    output.textContent = "TEST ERROR: " + (error.message || String(error)) + "\nIf the test stopped before cleanup, refresh the dashboard and contact support before deleting any records.";
    output.className = "testresult fail";
    // Best-effort cleanup of this run's own fixtures after a test error.
    try {
      const db = await btOpenDB();
      await new Promise(resolve => {
        const tx = db.transaction(BT_STORE, "readwrite");
        const req = tx.objectStore(BT_STORE).openCursor();
        req.onsuccess = () => { const c = req.result; if (!c) return; if (c.value.testRunId === runId) c.delete(); c.continue(); };
        tx.oncomplete = resolve; tx.onerror = resolve;
      });
      db.close();
    } catch (cleanupError) { console.error("TraceX Phase 2 fixture cleanup failed:", cleanupError); }
  } finally {
    button.disabled = false;
    await load();
  }
}
if ($("runIntegrityTest")) $("runIntegrityTest").addEventListener("click", runIntegritySelfTest);


// Phase 3: local security/privacy checks. No real browsing rows are modified.
async function runSecuritySelfTest() {
  const button = $("runSecurityTest");
  const output = $("securityTestResult");
  button.disabled = true;
  output.className = "testresult";
  output.textContent = "Running security and privacy checks…";
  const checks = [];
  try {
    checks.push(["HTTPS URL accepted", !!btParseAllowedVisitUrl("https://example.com/path")]);
    checks.push(["HTTP URL accepted", !!btParseAllowedVisitUrl("http://example.com/path")]);
    checks.push(["javascript: URL rejected", btParseAllowedVisitUrl("javascript:alert(1)") === null]);
    checks.push(["data: URL rejected", btParseAllowedVisitUrl("data:text/html,test") === null]);
    checks.push(["Credential-bearing URL rejected", btParseAllowedVisitUrl("https://user:pass@example.com/") === null]);
    const escaped = safeText('<img src=x onerror=alert(1)>');
    checks.push(["HTML content escaped", escaped.includes("&lt;img") && !escaped.includes("<img")]);
    checks.push(["Unsafe link scheme neutralized", safeHref("javascript:alert(1)") === "#"]);
    checks.push(["CSV formula prefix neutralized", csvSafeCell("=1+1").startsWith("\"'")]);
    checks.push(["CSV quotes escaped", csvSafeCell('hello "TraceX"').includes('""TraceX""')]);
    const manifest = chrome.runtime.getManifest();
    const perms = Array.isArray(manifest.permissions) ? manifest.permissions : [];
    checks.push(["Only declared core permissions present", ["history","storage","alarms"].every(p => perms.includes(p)) && perms.length === 3 && !(manifest.host_permissions || []).length]);
    const before = await chrome.storage.local.get({ trackingEnabled: true });
    await chrome.storage.local.set({ trackingEnabled: false });
    const paused = await chrome.storage.local.get({ trackingEnabled: true });
    await chrome.storage.local.set({ trackingEnabled: true });
    const resumed = await chrome.storage.local.get({ trackingEnabled: true });
    await chrome.storage.local.set({ trackingEnabled: before.trackingEnabled });
    checks.push(["Pause/resume setting round-trip", paused.trackingEnabled === false && resumed.trackingEnabled === true]);
    const passed = checks.every(([, ok]) => ok);
    output.textContent = [
      passed ? "PASS — all Phase 3 security checks passed." : "FAIL — one or more Phase 3 checks failed.",
      ...checks.map(([name, ok]) => `${ok ? "PASS" : "FAIL"} — ${name}`),
      "No real browsing records were changed. Tracking preference restored to its original value.",
      "Note: external network transmission is verified by source review, not this runtime self-test."
    ].join("\n");
    output.className = "testresult " + (passed ? "pass" : "fail");
  } catch (error) {
    console.error("TraceX Phase 3 security test failed:", error);
    output.textContent = "TEST ERROR: " + (error.message || String(error));
    output.className = "testresult fail";
  } finally {
    button.disabled = false;
    await load();
  }
}
if ($("runSecurityTest")) $("runSecurityTest").addEventListener("click", runSecuritySelfTest);


// Phase 4: test pagination boundaries using in-memory fixtures only.
async function runPerformanceSelfTest() {
  const button = $("runPerformanceTest");
  const output = $("performanceTestResult");
  button.disabled = true;
  output.className = "testresult";
  output.textContent = "Running dashboard pagination checks…";
  try {
    const sample = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, visitedAt: 1000 - i }));
    const checks = [];
    const empty = paginateRows([], 1, 50);
    checks.push(["Empty result set", empty.items.length === 0 && empty.page === 1 && empty.pageCount === 1]);
    const one = paginateRows(sample.slice(0, 1), 1, 50);
    checks.push(["Single-row result set", one.items.length === 1 && one.start === 0 && one.end === 1]);
    const exact = paginateRows(sample.slice(0, 50), 1, 50);
    checks.push(["Exact page-size boundary", exact.items.length === 50 && exact.pageCount === 1]);
    const overflow = paginateRows(sample.slice(0, 51), 2, 50);
    checks.push(["Next page boundary", overflow.items.length === 1 && overflow.start === 50 && overflow.page === 2]);
    const large = paginateRows(sample, 20, 50);
    checks.push(["Large result set (1,000 rows)", large.items.length === 50 && large.pageCount === 20 && large.items[0].id === 951]);
    const clamped = paginateRows(sample, 999, 50);
    checks.push(["Out-of-range page is safely clamped", clamped.page === 20 && clamped.items.length === 50]);
    checks.push(["Pagination leaves source rows unchanged", sample.length === 1000 && sample[0].id === 1 && sample[999].id === 1000]);
    const passed = checks.every(([, ok]) => ok);
    output.textContent = [passed ? "PASS — all Phase 4 pagination checks passed." : "FAIL — one or more Phase 4 checks failed.", ...checks.map(([name, ok]) => `${ok ? "PASS" : "FAIL"} — ${name}`), "Test data existed only in memory; no browsing records were written, changed or deleted.", "Dashboard shows up to 50 rows per page; exports still include all saved records."].join("\n");
    output.className = "testresult " + (passed ? "pass" : "fail");
  } catch (error) {
    console.error("TraceX Phase 4 performance test failed:", error);
    output.textContent = "TEST ERROR: " + (error.message || String(error));
    output.className = "testresult fail";
  } finally { button.disabled = false; }
}
if ($("runPerformanceTest")) $("runPerformanceTest").addEventListener("click", runPerformanceSelfTest);
