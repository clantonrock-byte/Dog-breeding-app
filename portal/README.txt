LOW STOCK (ON HAND) + SETTINGS ITEM LISTS

WHAT YOU ASKED FOR
- Low prompt should be based on "On hand" per item (not total).
- Inventory and Stock should list items separately.
- When a new item is added, it appears in Settings to set its low prompt.

WHAT THIS DOES
- Uses DEFAULT SOURCE bucket (settings) as "On hand" and checks:
  locs[defaultSource] <= minOnHand
- Adds per-item minOnHand editor inside Settings:
  - Inventory items list
  - Stock items list
- LOW badge added to Available cards
- Optional once-per-day alert when opening Available list (per kind)

INSTALL
1) Upload into /portal/:
   - portal/inventory_lowstock_onhand_settings_patch.js
   - portal/inventory_lowstock_onhand_settings_patch.css

2) In root index.html:
   - In <head>:
     <link rel="stylesheet" href="portal/inventory_lowstock_onhand_settings_patch.css" />
   - At bottom (right before </body>), load AFTER inventory_settings_kindfix.js:
     <script src="portal/inventory_lowstock_onhand_settings_patch.js"></script>

IMPORTANT
- Disable/remove older low-stock patches to avoid conflicts:
  - inventory_settings_lowstock_patch.js

DATA FIELDS
- item.minOnHand (number)
- settings: breederPro_inventory_settings_v2
