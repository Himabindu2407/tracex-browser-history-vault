# TraceX Privacy Policy — release draft

**Last updated:** November 12, 2026  
**Product:** TraceX Browser History Vault  
**Privacy contact:** sekharnaidu@gmail.com

## What TraceX does
TraceX is a browser extension that lets a user keep a local record of supported browser visit events while the extension is installed, enabled, permitted to access browser history, and tracking is not paused.

## Information processed
TraceX may store the visited URL, page title, domain derived from the URL, visit timestamp, and browser-history deletion event metadata. URLs and page titles may themselves contain sensitive information. TraceX does not intentionally collect passwords, keystrokes, form contents, or page contents.

## Purpose and storage
These records are used to display, search, filter, export, and manage the user's browsing records. In the packaged browser builds, visit records are stored in IndexedDB within the browser extension's local profile storage. The extension code in this release does not call a remote analytics or backup endpoint.

## Sharing and external services
The Chrome and Firefox extension builds in this release do not automatically transmit browsing records to a remote server. The optional Flask backup source included in the development project is separate and is not included or connected in these browser release packages. If a future version adds sync, analytics, or remote backup, this policy must be updated before release.

## Permissions
TraceX requests the browser `history`, `storage`, and `alarms` permissions. History access is required to receive visit and history-removal events; storage is used for tracking preferences and local records; alarms support scheduled retention cleanup.

## Retention
TraceX automatically removes records older than two calendar months using the extension's local retention logic. TraceX is not a permanent archive and does not recover visits deleted before installation or missed while tracking was paused or the extension could not run.

## User controls and deletion
Users can pause and resume tracking, export records as CSV or JSON, and delete records using the controls provided in the extension. Uninstalling the extension or clearing extension storage may remove locally stored records. Exported files are outside TraceX's control and may contain sensitive browsing information.

## Limitations
The current build does not capture private/incognito browsing. TraceX is not tamper-proof and should not be treated as guaranteed forensic evidence preservation.

## Contact
For privacy questions or support, email **sekharnaidu@gmail.com**.

---

**Publisher review required:** Confirm the policy against the exact signed store packages and the publisher's applicable legal obligations before submission.
