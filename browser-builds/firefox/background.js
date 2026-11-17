// TraceX Firefox background script. Firefox MV3 loads db.js from manifest.background.scripts.
const txBrowser = (typeof browser !== "undefined") ? browser : chrome;

async function txSetCaptureDiagnostic(values) {
  try { await txBrowser.storage.local.set(values); } catch (error) { console.error("TraceX diagnostic write failed:", error); }
}

async function txCleanupAndSchedule() {
  try {
    await btDeleteExpired();
    await txBrowser.alarms.create("tracex-retention-cleanup", { periodInMinutes: 24 * 60 });
  } catch (error) {
    console.error("TraceX retention cleanup failed:", error);
  }
}

txBrowser.runtime.onInstalled.addListener(() => { void txCleanupAndSchedule(); });
txBrowser.runtime.onStartup.addListener(() => { void txCleanupAndSchedule(); });
txBrowser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "tracex-retention-cleanup") void txCleanupAndSchedule();
});

// Register the history listener at top level so Firefox can restore it reliably.
txBrowser.history.onVisited.addListener((item) => {
  void (async () => {
    const eventAt = Date.now();
    try {
      const settings = await txBrowser.storage.local.get({ trackingEnabled: true });
      if (!settings.trackingEnabled) {
        await txSetCaptureDiagnostic({ lastCaptureAt: eventAt, lastCaptureUrl: item.url || "", lastCaptureResult: "ignored_paused", lastCaptureError: "" });
        return;
      }
      const saved = await btSaveVisit(item);
      await txSetCaptureDiagnostic({
        lastCaptureAt: eventAt,
        lastCaptureUrl: item.url || "",
        lastCaptureResult: saved ? "saved" : "rejected_url",
        lastCaptureError: ""
      });
    } catch (error) {
      console.error("TraceX visit capture failed:", error);
      await txSetCaptureDiagnostic({ lastCaptureAt: eventAt, lastCaptureUrl: item.url || "", lastCaptureResult: "error", lastCaptureError: String(error && error.message || error) });
    }
  })();
});

txBrowser.history.onVisitRemoved.addListener((details) => {
  void (async () => {
    try {
      const settings = await txBrowser.storage.local.get({ trackingEnabled: true });
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
  })();
});

void txCleanupAndSchedule();
