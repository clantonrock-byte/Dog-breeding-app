SETTINGS TABS PATCH v3 (AUTO-DETECT DIALOG)

Use this if v2 doesn't show tabs reliably.
v3 doesn't depend on #dlgBpSettings; it detects the Settings dialog automatically.

INSTALL
1) Upload into /portal/:
   - portal/settings_tabs_patch_v3.js
   - portal/settings_tabs_patch.css   (same CSS file name)

2) root index.html:
   <head>:
     <link rel="stylesheet" href="portal/settings_tabs_patch.css" />
   footer (load last):
     <script src="portal/settings_tabs_patch_v3.js"></script>

3) Remove the v2 script include to avoid double-loading:
   - portal/settings_tabs_patch_v2.js
