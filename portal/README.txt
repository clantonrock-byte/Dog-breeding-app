LOW SHOPPING LIST – TXT / SHARE / DOCX / PDF

WHAT THIS IS
- A single script that adds 4 buttons on the Available screen:
  - Export TXT
  - Share
  - Export DOCX
  - Export PDF

INSTALL (root index is entrypoint)
1) Upload into /portal/:
   portal/inventory_low_shopping_list_allformats.js

2) In root index.html, load AFTER inventory_lowstock_onhand_settings_patch.js:
   <script src="portal/inventory_low_shopping_list_allformats.js"></script>

NOTES
- DOCX + PDF require a one-time CDN load (docx + jsPDF).
- Inventory vs Stock remain separate (based on current mode).
