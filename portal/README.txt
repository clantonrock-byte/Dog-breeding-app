HEAT NAME BADGES v3 (PHASE-AWARE)

Requested behavior:
- RED "HEAT" while in standing heat
- YELLOW only when coming into or coming out of heat:
  - "HEAT SOON" (within 14 days before predicted heat)
  - "HEAT ENDING" (within last 5 days of heat window)

Install:
1) Upload into /portal/:
   - portal/dogs_heat_name_badge_v3.js
   - portal/dogs_heat_name_badge.css

2) In root index.html:
   <head>:
     <link rel="stylesheet" href="portal/dogs_heat_name_badge.css" />
   footer (after dogs_heat_cycle_per_dog.js):
     <script src="portal/dogs_heat_name_badge_v3.js"></script>

3) Remove older badge scripts:
   - dogs_heat_name_badge_v2.js
   - dogs_heat_name_badge.js

Hard refresh: ?v=9401
