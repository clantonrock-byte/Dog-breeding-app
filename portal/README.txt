SETTINGS TABS PATCH v2

WHY v2
- Your Settings sections are injected at different times by different patches/bundles.
- v2 re-applies tab layout after the dialog exists and on dialog open.

INSTALL
1) Upload into /portal/:
   - portal/settings_tabs_patch_v2.js
   - portal/settings_tabs_patch.css

2) In root index.html:
   <head>:
     <link rel="stylesheet" href="portal/settings_tabs_patch.css" />
   bottom (right before </body>), load AFTER inventory.bundle.js:
     <script src="portal/settings_tabs_patch_v2.js"></script>

3) Hard refresh (Samsung cache bust):
   add ?v=999 to the URL
