DOG PROFILE REBUILD v3.7.1 (HIDE LEGACY TIMELINE)

Problem: With v3.7, you may still see legacy timeline blocks (Status/DOB/Microchip/Rabies)
under the rebuilt editor. This patch hides ALL legacy timeline items after the Photo block,
so only Photo + rebuilt editor remain.

INSTALL
1) Upload to /portal:
   - dog_profile_rebuild_v3_7_1.js

2) In root index.html footer, replace:
   <script src="portal/dog_profile_rebuild_v3_7.js"></script>
   with:
   <script src="portal/dog_profile_rebuild_v3_7_1.js"></script>

3) Hard refresh with ?v=31001
