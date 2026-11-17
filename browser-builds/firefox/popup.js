const txBrowser = (typeof browser !== "undefined") ? browser : chrome;
const countEl = document.getElementById("visitCount");
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleTracking");
const diagnosticEl = document.getElementById("captureDiagnostic");
async function refresh() {
  const visits = await btGetAll();
  const settings = await txBrowser.storage.local.get({ trackingEnabled: true, lastCaptureAt: 0, lastCaptureUrl: "", lastCaptureResult: "", lastCaptureError: "" });
  countEl.textContent = visits.length.toLocaleString();
  statusEl.textContent = settings.trackingEnabled ? "Active" : "Paused";
  toggleBtn.textContent = settings.trackingEnabled ? "Pause tracking" : "Resume tracking";
  if (settings.lastCaptureAt) {
    const when = new Date(settings.lastCaptureAt).toLocaleString();
    const detail = settings.lastCaptureResult === "saved" ? "Last visit saved" : settings.lastCaptureResult === "ignored_paused" ? "Last visit ignored while paused" : settings.lastCaptureResult === "rejected_url" ? "Last URL was not HTTP/HTTPS" : "Last capture error: " + (settings.lastCaptureError || "Unknown error");
    diagnosticEl.textContent = detail + " · " + when + (settings.lastCaptureUrl ? " · " + settings.lastCaptureUrl : "");
  } else {
    diagnosticEl.textContent = "No visit event recorded yet. Visit a new website after enabling tracking.";
  }
}
toggleBtn.addEventListener("click", async () => {
  const settings = await txBrowser.storage.local.get({ trackingEnabled: true });
  await txBrowser.storage.local.set({ trackingEnabled: !settings.trackingEnabled });
  await refresh();
});
document.getElementById("openDashboard").addEventListener("click", () => {
  void txBrowser.tabs.create({ url: txBrowser.runtime.getURL("dashboard/dashboard.html") });
});
refresh().catch(console.error);
