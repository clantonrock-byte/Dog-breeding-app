DOG PROFILE REBUILD v3.2 (FORCE INSERT + DEBUG BADGE)

Use this if your profile ends at Rabies / you don't see the rebuilt panel.
This version:
- Forces insertion near the top of #viewDogProfile (no photo anchor required)
- Shows a small "V3.2" badge bottom-right to confirm script loaded
- Hides legacy Done/Notes/More and legacy ids (dogStatus/dogSexInline etc)

Install:
1) Upload to /portal/:
   - portal/dog_profile_rebuild_v3_2.js
   - portal/dog_profile_rebuild_v3_2.css

2) index.html:
   <head>:
     <link rel="stylesheet" href="portal/dog_profile_rebuild_v3_2.css" />
   footer (after dogs.bundle.js):
     <script src="portal/dog_profile_rebuild_v3_2.js"></script>

3) Remove other rebuild scripts (v3/v3.1) while testing.

Hard refresh: ?v=12032
