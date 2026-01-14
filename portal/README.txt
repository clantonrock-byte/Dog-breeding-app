DOG PROFILE REBUILD v2 (below photo)

This replaces the entire Dog Profile form BELOW the photo with a clean stable UI:
- One Save & Done
- One-way Puppy -> Adult
- Disposition with Retired
- Sex filtering + fixed lock
- Heat tracking only for Adult + Female (intact)

INSTALL
1) Upload to /portal/:
   - portal/dog_profile_rebuild_v2.js
   - portal/dog_profile_rebuild_v2.css

2) index.html:
   <head>:
     <link rel="stylesheet" href="portal/dog_profile_rebuild_v2.css" />
   footer (after dogs.bundle.js):
     <script src="portal/dog_profile_rebuild_v2.js"></script>

3) IMPORTANT: while testing, remove/disable other profile patches:
   - dog_profile_polish_patch_v2.js
   - profile_save_and_autofill_fix.js
   - heat_single_save_patch.js
   - dog_disposition_patch.js
   - dog_sex_intact_fixed_lock.js
   - dog_sex_dropdown_filter_v2.js
   - any status/disposition split patches

Reason: this rebuild owns those concerns now.

Hard refresh: ?v=12000
