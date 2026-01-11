LOW BADGES ON HOME + OPTIONAL NOTIFICATIONS

WHAT YOU PICKED
1) Show LOW (n) badge on Home buttons for Inventory and Stock
3) Optional notifications (best-effort) via browser Notification API

INSTALL
1) Upload into /portal/:
   - portal/inventory_low_badge_notify_patch.js
   - portal/inventory_low_badge_notify_patch.css

2) In root index.html:
   - In <head>:
     <link rel="stylesheet" href="portal/inventory_low_badge_notify_patch.css" />
   - At bottom (right before </body>), load AFTER inventory_lowstock_onhand_settings_patch.js:
     <script src="portal/inventory_low_badge_notify_patch.js"></script>

NOTES
- Notifications require permission and typically HTTPS.
- This patch adds a Notifications section in ⚙️ Settings (if Settings dialog exists).
