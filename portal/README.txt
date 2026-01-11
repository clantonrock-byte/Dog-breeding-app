
DOGS UNIFIED v4 (ROW CLICK FIX)

INSTALL (root index is entrypoint)
1) Upload into /portal/:
   - portal/dogs_unified_v4.js
   - portal/dogs_unified_v4.css

2) In root index.html:
   - In <head>:
     <link rel="stylesheet" href="portal/dogs_unified_v4.css" />

   - At bottom (right before </body>), LOAD LAST:
     <script src="portal/dogs_unified_v4.js"></script>

3) Remove/comment older dog scripts:
   - portal/dogs_unified_v3.js / v2
   - portal/dogs_filters_polish.js
   - portal/dogs_male_female_fix.js
   - portal/dogs_unassigned_fix.js
   - portal/dog_ui_patch.js (if it overrides dog list rendering)

VERIFY
- Tap any dog row -> opens Dog Profile
