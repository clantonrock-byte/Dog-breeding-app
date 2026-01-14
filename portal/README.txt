DOG PROFILE MASTER PACK (Profile UX + Rules + Heat persistence helpers)

What’s included
- Save & Done profile polish (v2): moves the real Save button into a sticky bottom bar
- Autofill/password popup suppression for Notes fields
- Status+Heat unify save helper (makes Adult + in-heat persist when saving)
- Heat single-save (hides heat-card Save; rely on Save & Done only)
- Disposition selector: Active | For sale | Transferred | Deceased (auto-archives on Transferred/Deceased)
- Life-stage promote: replaces Puppy/Adult dropdown with one-way “Promote to Adult” (then hides selector)
- Sex lock rules: no Male<->Female switching once set; intact->fixed only

INSTALL
1) Unzip and upload ALL files into /portal/

2) root index.html <head> add these CSS (once each):
  <link rel="stylesheet" href="portal/dog_profile_polish_patch.css" />
  <link rel="stylesheet" href="portal/heat_single_save_patch.css" />
  <link rel="stylesheet" href="portal/dog_disposition_patch.css" />
  <link rel="stylesheet" href="portal/dog_lifestage_promote_patch.css" />

3) root index.html footer (after dogs.bundle.js and after dogs_heat_cycle_per_dog.js if you use it):
  <script src="portal/dog_profile_polish_patch_v2.js"></script>
  <script src="portal/profile_save_and_autofill_fix.js"></script>
  <script src="portal/dog_status_heat_unify_patch.js"></script>
  <script src="portal/heat_single_save_patch.js"></script>
  <script src="portal/dog_disposition_patch.js"></script>
  <script src="portal/dog_status_hide_lifestage_when_adult.js"></script>
  <script src="portal/dog_lifestage_promote_patch.js"></script>
  <script src="portal/dog_sex_intact_fixed_lock.js"></script>

Hard refresh: add ?v=10100
