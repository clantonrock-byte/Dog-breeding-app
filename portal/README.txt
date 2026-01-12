
A–D BUNDLE (Stabilize + Reorder + Backup)

WHAT THIS ZIP GIVES YOU
- portal/dogs.bundle.js + portal/dogs.bundle.css
  - Unified Dogs renderer that "wins" after legacy re-renders
- portal/inventory.bundle.js + portal/inventory.bundle.css
  - Loads existing inventory patches in correct order
  - Adds Reorder workflow (Pending) + Backup/Restore/Reset inside Settings

INSTALL
1) Upload these 4 files into /portal/:
   - portal/dogs.bundle.js
   - portal/dogs.bundle.css
   - portal/inventory.bundle.js
   - portal/inventory.bundle.css

2) Update root index.html:
   In <head> add:
     <link rel="stylesheet" href="portal/dogs.bundle.css" />
     <link rel="stylesheet" href="portal/inventory.bundle.css" />

   At the bottom (right before </body>) keep ONLY:
     <script src="portal/inventory.bundle.js"></script>
     <script src="portal/dogs.bundle.js"></script>

IMPORTANT
- Do NOT delete the existing inventory patch files yet; inventory.bundle.js loads them.
- After you confirm everything works for a day, we can create a true single-file inventory bundle and then delete:
    inventory_ui_patch.js, inventory_a_to_d_patch.js, inventory_destination_presets_patch.js, etc.
