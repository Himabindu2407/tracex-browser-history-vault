// TraceX local database. Records stay in this browser profile unless the user exports them.
const BT_DB_NAME = "SynthoQuestBrowserTrace";
const BT_DB_VERSION = 1;
const BT_STORE = "visits";
const BT_EVENTS = "events";

function btOpenDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BT_DB_NAME, BT_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BT_STORE)) {
        const visits = db.createObjectStore(BT_STORE, { keyPath: "id", autoIncrement: true });
        visits.createIndex("visitedAt", "visitedAt");
        visits.createIndex("url", "url");
        visits.createIndex("domain", "domain");
      }
      if (!db.objectStoreNames.contains(BT_EVENTS)) {
        const events = db.createObjectStore(BT_EVENTS, { keyPath: "id", autoIncrement: true });
        events.createIndex("eventAt", "eventAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function btParseAllowedVisitUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;
    return parsed;
  } catch { return null; }
}

function btDomain(url) {
  const parsed = btParseAllowedVisitUrl(url);
  return parsed ? parsed.hostname : "";
}

// Calendar-month retention: calculate the instant two calendar months before now.
function btRetentionCutoff(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const targetFirst = new Date(year, month - 2, 1, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  const lastDay = new Date(targetFirst.getFullYear(), targetFirst.getMonth() + 1, 0).getDate();
  targetFirst.setDate(Math.min(day, lastDay));
  return targetFirst.getTime();
}

async function btDeleteExpired(now = new Date()) {
  const cutoff = btRetentionCutoff(now);
  const db = await btOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([BT_STORE, BT_EVENTS], "readwrite");
    let deletedVisits = 0;
    let deletedEvents = 0;

    const visitCursor = tx.objectStore(BT_STORE).index("visitedAt").openCursor(IDBKeyRange.upperBound(cutoff, true));
    visitCursor.onsuccess = () => {
      const cursor = visitCursor.result;
      if (!cursor) return;
      cursor.delete();
      deletedVisits++;
      cursor.continue();
    };

    const eventCursor = tx.objectStore(BT_EVENTS).index("eventAt").openCursor(IDBKeyRange.upperBound(cutoff, true));
    eventCursor.onsuccess = () => {
      const cursor = eventCursor.result;
      if (!cursor) return;
      cursor.delete();
      deletedEvents++;
      cursor.continue();
    };

    tx.oncomplete = () => { db.close(); resolve({ deletedVisits, deletedEvents, cutoff }); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error("Retention cleanup aborted")); };
  });
}

async function btSaveVisit(item) {
  const url = item.url;
  if (!btParseAllowedVisitUrl(url)) return false;
  // Clean expired rows periodically as new visits arrive too.
  await btDeleteExpired();
  const db = await btOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BT_STORE, "readwrite");
    tx.objectStore(BT_STORE).add({
      url,
      title: item.title || url,
      domain: btDomain(url),
      visitedAt: Number(item.lastVisitTime) || Date.now(),
      source: "browser-history-event"
    });
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function btSaveEvent(event) {
  await btDeleteExpired();
  const db = await btOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BT_EVENTS, "readwrite");
    tx.objectStore(BT_EVENTS).add(event);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function btGetAll(storeName = BT_STORE) {
  await btDeleteExpired();
  const db = await btOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => { db.close(); resolve(request.result || []); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function btDeleteAll() {
  const db = await btOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([BT_STORE, BT_EVENTS], "readwrite");
    tx.objectStore(BT_STORE).clear();
    tx.objectStore(BT_EVENTS).clear();
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}