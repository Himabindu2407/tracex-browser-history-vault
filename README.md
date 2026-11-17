# TraceX – Browser History Vault

**A Local-First Browser History Management Extension**

TraceX is a browser extension designed to maintain an independent record of supported browsing activity. It stores browsing records in its own IndexedDB database, allowing users to search, review, export, and manage their browsing history independently of the browser's standard history interface.

Built for **Google Chrome and Mozilla Firefox**, TraceX provides users with greater control over their browsing records through simple tracking controls and automatic data retention.

---

## 1. Project Overview

| Detail | Information |
|---|---|
| Project Name | TraceX – Browser History Vault |
| Category | Browser Extension / Privacy & Productivity |
| Version | 1.3.0 |
| Supported Browsers | Google Chrome, Mozilla Firefox |
| Architecture | Local-First |
| Storage | IndexedDB |
| Frontend | HTML, CSS, JavaScript |
| License | All Rights Reserved |
| Privacy Policy | https://himabindu2407.github.io/tracex-privacy/ |

## 2. Key Features

### Independent Browsing History Storage
- Maintains browsing records in the extension's own IndexedDB database.
- Stores supported website visit information independently of the browser's normal history interface.
- Keeps records available within the extension while its stored data remains intact.

### Tracking Controls
- Pause and resume browsing activity tracking.
- Control when new browsing records are collected.
- Manage tracking through the extension interface.

### Search and Filtering
- Search saved browsing records.
- Filter records by date.
- Review website URLs, page titles, domains, and visit timestamps.

### Data Export
- Export saved browsing records in CSV format.
- Export records in JSON format.
- Maintain an external copy of exported data when needed.

### Automatic Data Retention
- Automatically removes records older than two calendar months.
- Retains records within the configured retention period.
- Helps keep the local database manageable.

### Data Management
- Review saved browsing records.
- Manually delete records.
- Manage stored browsing information through the extension dashboard.

### Built-in Testing
- Retention testing.
- Database integrity testing.
- Security checks.
- Performance testing.

---

## 3. Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Extension interface structure |
| CSS3 | User interface styling |
| JavaScript | Extension functionality |
| IndexedDB | Local browsing record storage |
| Chrome Extension APIs | Chrome browser integration |
| Firefox WebExtension APIs | Firefox browser integration |

## 4. Project Structure

```text
TraceX/
│
├── browser-builds/
│   │
│   ├── chromium/
│   │   ├── manifest.json
│   │   ├── background.js
│   │   ├── dashboard.html
│   │   ├── dashboard.js
│   │   ├── dashboard.css
│   │   ├── popup.html
│   │   ├── popup.js
│   │   ├── db.js
│   │   └── icons/
│   │
│   └── firefox/
│       ├── manifest.json
│       ├── background.js
│       ├── dashboard.html
│       ├── dashboard.js
│       ├── dashboard.css
│       ├── popup.html
│       ├── popup.js
│       ├── db.js
│       └── icons/
│
├── .gitignore
├── PRIVACY_POLICY_FINAL_DRAFT.md
├── RELEASE_NOTES.md
├── STORE_SUBMISSION_CHECKLIST.md
└── README.md
```

## 5. Installation

### Google Chrome

1. Download or clone this repository.
2. Open Google Chrome.
3. Navigate to `chrome://extensions/`.
4. Enable **Developer mode**.
5. Select **Load unpacked**.
6. Open the `browser-builds/chromium/` folder.
7. TraceX will appear in your browser extensions.

### Mozilla Firefox

For development and testing:

1. Open Firefox.
2. Navigate to `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on**.
4. Open the `browser-builds/firefox/` folder.
5. Select the `manifest.json` file.

For regular installation, use the official Mozilla Add-ons listing once the extension is approved and published.

## 6. How TraceX Works

TraceX follows a simple workflow:

1. The extension detects supported browsing activity.
2. Relevant visit information is processed.
3. Records are stored in the extension's IndexedDB database.
4. Users can view, search, and filter saved records.
5. Users can export or manually delete their records.
6. The retention process removes records older than two calendar months.

**Workflow:**

```text
Website Visit
     |
     v
Activity Detection
     |
     v
Record Processing
     |
     v
IndexedDB Storage
     |
     v
TraceX Dashboard
     |
     +---- Search & Filter
     |
     +---- Export CSV / JSON
     |
     +---- Manual Deletion
     |
     +---- Automatic Retention
```

## 7. Privacy and Data Handling

TraceX is designed around a local-first storage approach.

- Browsing records are stored in the extension's local IndexedDB database.
- Users can pause and resume tracking.
- Users can manually manage and export their records.
- Automatic retention removes records older than two calendar months.
- Chrome and Firefox maintain separate extension storage.

Read the full Privacy Policy:

**https://himabindu2407.github.io/tracex-privacy/**

## 8. Important Limitations

Please understand the following before using TraceX:

- TraceX records supported browsing activity only after installation and while tracking is enabled.
- It cannot recover browsing history deleted before installation.
- It does not capture activity while tracking is paused or the extension is disabled.
- Private/incognito browsing capture is not supported in the current release.
- Chrome and Firefox do not automatically synchronize their TraceX databases.
- Uninstalling the extension, clearing extension storage, or removing the browser profile may result in loss of locally stored records.
- TraceX is a browsing history management tool, not a tamper-proof forensic evidence platform.

## 9. Testing and Validation

The project has undergone functional testing across its core components.

| Testing Area | Coverage |
|---|---|
| Retention Testing | Two-calendar-month retention rules |
| Database Integrity | IndexedDB read/write and record validation |
| Security Testing | Input handling and data validation checks |
| Performance Testing | Record handling and export checks |
| Browser Compatibility | Chrome and Firefox testing |
| Tracking Controls | Pause and resume functionality |

Testing results are based on the development and validation activities performed for the project. They should not be interpreted as independent security certification.

## 10. Version Information

**Current Project Version: 1.3.0**

Refer to `RELEASE_NOTES.md` for version-specific changes and improvements.

## 11. Future Enhancements

Potential areas for future development include:

- Improved database-level pagination.
- Additional dashboard analytics.
- Enhanced data backup and recovery options.
- More detailed browsing activity reports.
- Further browser compatibility improvements.

## 12. Support and Contact

For questions, feedback, or technical support:

**Email:** sekharnaidu@gmail.com

**GitHub Repository:**  
https://github.com/Himabindu2407/tracex-browser-history-vault

**Privacy Policy:**  
https://himabindu2407.github.io/tracex-privacy/

---

## 13. License

Copyright © 2026 TraceX.

All Rights Reserved.

This project is proprietary software. Unauthorized copying, redistribution, modification, or commercial use is not permitted without prior written permission from the project owner.

---

**TraceX – Your Browsing History, Under Your Control.**
