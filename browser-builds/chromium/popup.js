const countEl = document.getElementById("visitCount");
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleTracking");
async function refresh() {
  const visits = await btGetAll();
  const settings = await chrome.storage.local.get({ trackingEnabled: true });
  countEl.textContent = visits.length.toLocaleString();
  statusEl.textContent = settings.trackingEnabled ? "Active" : "Paused";
  toggleBtn.textContent = settings.trackingEnabled ? "Pause tracking" : "Resume tracking";
}
toggleBtn.addEventListener("click", async () => {
  const settings = await chrome.storage.local.get({ trackingEnabled: true });
  await chrome.storage.local.set({ trackingEnabled: !settings.trackingEnabled });
  refresh();
});
document.getElementById("openDashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
});
refresh().catch(console.error);