HEAT SINGLE SAVE PATCH

Fixes: Two save buttons on Dog Profile.
- Hides the Heat card "Save" button.
- Use only the bottom "Save & Done".

REQUIRES
- dog_status_heat_unify_patch.js installed (so Save & Done persists heat fields)
- dog_profile_polish_patch_v2.js installed

INSTALL
1) Upload into /portal/:
   portal/heat_single_save_patch.js
   portal/heat_single_save_patch.css

2) In root index.html:
   <head>:
     <link rel="stylesheet" href="portal/heat_single_save_patch.css" />
   footer (after dog_profile_polish_patch_v2.js and dogs_heat_cycle_per_dog.js):
     <script src="portal/heat_single_save_patch.js"></script>

Hard refresh: ?v=9803
