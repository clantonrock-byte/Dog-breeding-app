
LOW SHOPPING LIST (EXPORT + SHARE)

WHAT THIS ADDS
- Inventory Available / Stock Available:
  - Export LOW list (downloads a checklist .txt)
  - Share LOW list (uses Web Share API if available)

INSTALL
1) Upload into /portal/:
   portal/inventory_low_shopping_list_patch.js

2) In root index.html, load AFTER inventory_lowstock_onhand_settings_patch.js:
   <script src="portal/inventory_low_shopping_list_patch.js"></script>

NOTES
- Uses on-hand bucket + per-item low prompt to build the list.
- Inventory and Stock are separate; list exports based on current mode.
