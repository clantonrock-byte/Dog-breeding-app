SETTINGS DIALOG BOOTSTRAP

If your Settings button says "Settings dialog not available yet", this fixes it by
creating the <dialog id="dlgBpSettings"> at runtime.

INSTALL
1) Upload into /portal/:
   portal/settings_dialog_bootstrap.js

2) Add to root index.html footer (after bundles is fine):
   <script src="portal/settings_dialog_bootstrap.js"></script>

3) Hard refresh:
   ?v=8000
