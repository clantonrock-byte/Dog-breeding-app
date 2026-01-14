DOG PROFILE – COMBINED PATCH
============================

This bundle combines the following fixes:

1) dog-profile-final-cleanup
   - Removes redundant profile controls
   - Single Save / Save & Done flow
   - Profile-level persistence cleanup
   - Notes autofill suppression

2) dog-sex-dropdown-filter-v2
   - Once a sex is selected, opposite-sex options are hidden
   - If spayed/neutered is selected, all other sex options are locked out
   - Enforces: intact -> fixed only (no cross-sex switching)

NOT INCLUDED (parked intentionally):
- dog-lifestage-no-dropdown (as requested)

INSTALL
-------
• Copy the JS files into /portal/
• Ensure these scripts load AFTER dogs.bundle.js in index.html

This bundle is safe to apply on top of your current state.