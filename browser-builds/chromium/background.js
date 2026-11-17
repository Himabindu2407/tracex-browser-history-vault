// Firefox loads db.js through manifest background.scripts.
// Chromium loads it here as a Manifest V3 service worker.
if (typeof importScripts === "function") {
  importScripts("db.js");
}

async function txCleanupAndSchedule() {
  try {
    await btDeleteExpired();
    if (chrome.alarms) {
      chrome.alarms.create("tracex-retention-cleanup", { periodInMinutes: 24 * 60 });
    }
  } catch (error) {
    console.error("TraceX retention cleanup failed:", error);
  }
}

chrome.runtime.onInstalled.addListener(() => { txCleanupAndSchedule(); });
chrome.runtime.onStartup.addListener(() => { txCleanupAndSchedule(); });
if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "tracex-retention-cleanup") txCleanupAndSchedule();
  });
}

chrome.history.onVisited.addListener(async (item) => {
  try {
    const settings = await chrome.storage.local.get({ trackingEnabled: true });
    if (!settings.trackingEnabled) return;
    await btSaveVisit(item);
  } catch (error) {
    console.error("TraceX visit capture failed:", error);
  }
});

chrome.history.onVisitRemoved.addListener(async (details) => {
  try {
    const settings = await chrome.storage.local.get({ trackingEnabled: true });
    if (!settings.trackingEnabled) return;
    await btSaveEvent({
      type: "browser_history_removed",
      eventAt: Date.now(),
      allHistory: Boolean(details.allHistory),
      note: details.allHistory ? "Browser history cleared" : "Browser history entries removed"
    });
  } catch (error) {
    console.error("TraceX deletion event capture failed:", error);
  }
});

// Run once whenever the background context is initialized.
txCleanupAndSchedule();