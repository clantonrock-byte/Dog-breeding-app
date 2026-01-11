INVENTORY/STOCK UI PATCH + ACTIVITY LOG

FILES
- inventory_ui_patch.js
- inventory_ui_patch.css

INSTALL (root index is entrypoint)
1) Upload both files into /portal/:
   - portal/inventory_ui_patch.js
   - portal/inventory_ui_patch.css

2) In root index.html:
   - Add CSS in <head>:
     <link rel="stylesheet" href="portal/inventory_ui_patch.css" />

   - Add JS at the VERY bottom (right before </body>), load AFTER your app scripts:
     <script src="portal/inventory_ui_patch.js"></script>

WHAT YOU GET
- Available list becomes cards with quick actions (Add / Use / Transfer)
- Search box on Available view
- Recent activity log (last 20 actions per kind)
- Auto-refresh after create/add/use/transfer/scan

NOTES
- Activity is stored in localStorage key: breederPro_inventory_activity_v1
- This patch overrides window.renderInv.
