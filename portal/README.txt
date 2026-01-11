
DOGS UNIFIED v3 (Archived list uses same polished cards)

INSTALL (root index is entrypoint)
1) Upload both files into /portal/
   - portal/dogs_unified_v3.js
   - portal/dogs_unified_v3.css

2) In root index.html:
   - Add CSS in <head>:
     <link rel="stylesheet" href="portal/dogs_unified_v3.css" />

   - Add JS at the VERY bottom (right before </body>), and ensure it loads LAST:
     <script src="portal/dogs_unified_v3.js"></script>

3) Remove/comment out older dog patches that override renderDogs or bind dog buttons:
   - portal/dogs_filters_polish.js
   - portal/dogs_male_female_fix.js
   - portal/dogs_unassigned_fix.js
   - portal/dogs_unified_v2.js (replace with v3)

VERIFY
- Active list filters work (All/Males/Females/Needs sex set)
- Toggle "Show archived" -> archived list shows same card layout + thumbnail
