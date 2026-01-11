INVENTORY TRANSFER: DESTINATION TEXT FIELD

FILES
- inventory_transfer_destination_patch.js

INSTALL (root index is entrypoint)
1) Upload to /portal/:
   portal/inventory_transfer_destination_patch.js

2) In root index.html, include AFTER inventory_ui_patch.js:
   <script src="portal/inventory_transfer_destination_patch.js"></script>

RESULT
- Transfer form shows "Destination (optional)" text input
- Destination is saved in activity log as a note ("To: ...")
