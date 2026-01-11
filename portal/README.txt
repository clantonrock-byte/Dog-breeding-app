SETTINGS + KIND-FIX FOR TRANSFER DROPDOWNS

WHAT THIS FIXES
- Transfer dropdowns showing Inventory and Stock together:
  The selects are now forced to per-kind lists and refresh automatically
  when kind/view changes.

WHAT THIS ADDS
- ⚙️ Settings button in the top bar
- Settings dialog where user can define:
  - Default source label
  - Saved sources/destinations for Inventory (edible)
  - Saved sources/destinations for Stock (inedible)

INSTALL (root index is entrypoint)
1) Upload into /portal/:
   - portal/inventory_settings_kindfix.js
   - portal/inventory_settings_kindfix.css

2) In root index.html:
   - In <head>:
     <link rel="stylesheet" href="portal/inventory_settings_kindfix.css" />

   - At bottom (right before </body>), load AFTER other inventory patches:
     <script src="portal/inventory_settings_kindfix.js"></script>

NOTES
- Presets stored in: breederPro_transfer_locations_presets_v1
