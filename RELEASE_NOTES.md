# TraceX 1.3.0 — Release candidate

## Changes
- Unified Chrome and Firefox version to 1.3.0.
- Removed SynthoQuest product branding from the shipped dashboard.
- Added a stable Firefox Gecko extension ID for this release candidate.
- Retained the existing IndexedDB database name to avoid an unnecessary database migration in the Chrome build.
- Kept the optional Flask backup service out of the browser extension release packages; it is not connected to these builds.

## Important migration notes
- Back up/export TraceX records before replacing builds.
- Chrome: replace files in the existing unpacked extension directory and reload the same extension; do not remove/re-add it or change its path.
- Firefox: the Gecko ID is now fixed to `a01d9174-8ce7-43c6-9618-dc82523c9fed`. A temporary add-on previously installed under a different ID may have a different storage origin. Export records before switching; do not assume its local IndexedDB will automatically carry over.
- This is a release candidate, not store-approved. Run manual install, pause/resume, retention, export and deletion tests in both browsers.
