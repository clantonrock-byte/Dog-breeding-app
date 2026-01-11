USER-DEFINED DESTINATION DROPDOWN (Transfer)

FILES
- inventory_destination_presets_patch.js
- inventory_destination_presets_patch.css

INSTALL (root index is entrypoint)
1) Upload into /portal/:
   - portal/inventory_destination_presets_patch.js
   - portal/inventory_destination_presets_patch.css

2) In root index.html:
   - In <head>:
     <link rel="stylesheet" href="portal/inventory_destination_presets_patch.css" />

   - At bottom (right before </body>), load AFTER other inventory patches:
     <script src="portal/inventory_destination_presets_patch.js"></script>

USAGE
- Go to Transfer
- Use "Saved destinations" dropdown to fill Destination text field
- Tap "Manage" to add/remove destinations
- Destinations are stored per kind (Inventory vs Stock) in localStorage

STORAGE
- breederPro_transfer_destinations_v1
