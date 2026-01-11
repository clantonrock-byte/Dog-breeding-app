INVENTORY/STOCK: A–C (Source presets + Remember last + Locations editor)

WHAT THIS ADDS
A) User-defined SOURCE dropdown (per kind) + Manage dialog
B) Remembers last used Source/Destination per kind
C) Locations editor per item (edit buckets)

INSTALL (root index is entrypoint)
1) Upload into /portal/:
   - portal/inventory_locations_ui_patch.js
   - portal/inventory_locations_ui_patch.css

2) In root index.html:
   - In <head>:
     <link rel="stylesheet" href="portal/inventory_locations_ui_patch.css" />

   - At bottom (right before </body>), load AFTER other inventory patches:
     <script src="portal/inventory_locations_ui_patch.js"></script>

USAGE
- Transfer:
  - Saved sources/destinations dropdowns fill Source/Destination
  - "Manage locations" lets user edit presets (separate Inventory vs Stock)
  - Last-used source/dest auto-fills next time

- Inventory Available:
  - Each card gets a "Locations" button
  - Opens editor to add/remove locations and adjust quantities (buckets)
  - Totals auto-recompute

STORAGE
- Presets: breederPro_transfer_locations_presets_v1
- Last used: breederPro_transfer_last_v1
