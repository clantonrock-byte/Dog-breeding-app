INVENTORY/STOCK: A–D PATCH (Seed tools + True transfer + Export/Import + Scanner fallback)

FILES
- inventory_a_to_d_patch.js
- inventory_a_to_d_patch.css

INSTALL (root index is entrypoint)
1) Upload both files into /portal/:
   - portal/inventory_a_to_d_patch.js
   - portal/inventory_a_to_d_patch.css

2) In root index.html:
   - Add CSS in <head>:
     <link rel="stylesheet" href="portal/inventory_a_to_d_patch.css" />

   - Add JS at the VERY bottom (right before </body>), AFTER inventory_ui_patch.js and after transfer destination patch:
     <script src="portal/inventory_a_to_d_patch.js"></script>

NOTES
- True transfer uses location buckets per item:
  item.locs = { "On hand": 10, "Freezer": 3, ... }
  Total qty is sum of buckets and remains consistent.
- Transfer moves qty from "On hand" to destination bucket when a destination is provided.
- Add/Use apply to "On hand" bucket.
- Export/Import saves: Dogs + Inventory + Activity to a JSON file.
- Scanner fallback loads ZXing from jsdelivr if BarcodeDetector is missing.
