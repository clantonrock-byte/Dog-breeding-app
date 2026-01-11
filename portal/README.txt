SETTINGS UX + LOW STOCK ALERTS

WHAT YOU ASKED FOR
1) Settings should have "buttons to direct the user to what they need to alter"
   - Adds Settings shortcuts: Transfer locations / Low stock alerts
2) Users should set an alert at X low level to prompt reorder
   - Adds per-item minQty + default minQty per kind
   - Highlights LOW items in Available list
   - Optional once-per-day low-stock popup when opening Available list

INSTALL (root index is entrypoint)
1) Upload into /portal/:
   - portal/inventory_settings_lowstock_patch.js
   - portal/inventory_settings_lowstock_patch.css

2) In root index.html:
   - In <head>:
     <link rel="stylesheet" href="portal/inventory_settings_lowstock_patch.css" />

   - At bottom (right before </body>), load AFTER inventory_settings_kindfix.js:
     <script src="portal/inventory_settings_lowstock_patch.js"></script>

NOTES
- Per-item threshold stored as item.minQty
- Default per-kind stored in breederPro_inventory_settings_v1
