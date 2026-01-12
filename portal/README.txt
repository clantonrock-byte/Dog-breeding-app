SETTINGS TABS PATCH (Professional Settings UX)

Adds tabs inside Settings dialog:
- Access | Dogs | Inventory | Data

Also moves Backup/Restore (import/export) into the Data tab automatically if #bpBackupWrap exists.

INSTALL (bundles setup)
1) Upload into /portal/:
   - portal/settings_tabs_patch.js
   - portal/settings_tabs_patch.css

2) In root index.html:
   In <head>:
     <link rel="stylesheet" href="portal/settings_tabs_patch.css" />
   At bottom (right before </body>), load AFTER inventory.bundle.js:
     <script src="portal/settings_tabs_patch.js"></script>

NOTES
- This patch only rearranges existing Settings sections; it does not change underlying logic.
