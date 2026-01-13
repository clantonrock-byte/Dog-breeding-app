DOG PROFILE POLISH v2 (FIX SAVE)

Fixes "Save function not available yet" by moving the ORIGINAL Save button into
a sticky bottom bar (keeps its event handler intact).

Install:
1) Upload into /portal/:
   - portal/dog_profile_polish_patch_v2.js
   - portal/dog_profile_polish_patch.css

2) root index.html:
   <head>: <link rel="stylesheet" href="portal/dog_profile_polish_patch.css" />
   footer (after dogs.bundle.js):
     <script src="portal/dog_profile_polish_patch_v2.js"></script>

3) Remove old v1 script include if present:
   - dog_profile_polish_patch.js

Hard refresh: ?v=9703
