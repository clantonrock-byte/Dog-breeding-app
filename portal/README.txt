HEAT VISUAL BADGES v2 (COMPUTED FROM DATA)

Fix: If you didn't see badges before, v2 computes directly from localStorage dog data.

Install:
1) Upload into /portal/:
   - portal/dogs_heat_visual_badges_v2.js
   - portal/dogs_heat_visual_badges.css

2) In root index.html:
   <head>: <link rel="stylesheet" href="portal/dogs_heat_visual_badges.css" />
   footer: load AFTER dogs_heat_cycle_per_dog.js:
     <script src="portal/dogs_heat_visual_badges_v2.js"></script>

Hard refresh: ?v=9201
