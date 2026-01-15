DOG LIST + PROFILE PHOTO RESTORE (V2)

Symptoms you reported:
- Dogs list shows "full image" instead of thumbnail
- Dog profile shows NO image

Root cause:
- The previous profile-disable patch blocked the legacy renderDogProfile, which also bound the photo.
- The list thumbnail patch relies on CSS to size images; if CSS doesn't load or is overridden, it can expand.

Fixes:
1) dogs_bundle_profile_disable_v3.js
   - Disables legacy profile DOM updates BUT still binds photo block (dogPhotoImg/placeholder/View photo)

2) dogs_list_thumb_rowclick_patch_v2.js + .css
   - Keeps thumbnail at 64x64 using CSS + inline fallback so it cannot blow up to full size

INSTALL

1) Upload to /portal:
- dogs_bundle_profile_disable_v3.js
- dogs_list_thumb_rowclick_patch_v2.js
- dogs_list_thumb_rowclick_patch_v2.css

2) Root index.html HEAD:
<link rel="stylesheet" href="portal/dogs_list_thumb_rowclick_patch_v2.css" />

3) Root index.html FOOTER (order):
<script src="portal/inventory.bundle.js"></script>
<script src="portal/dogs.bundle.js"></script>

<script src="portal/dogs_bundle_profile_disable_v3.js"></script>
<script src="portal/dogs_list_thumb_rowclick_patch_v2.js"></script>

<script src="portal/back_button_history_patch.js"></script>
<script src="portal/portal_pin_multiuser_v2.js"></script>

<script src="portal/dog_profile_rebuild_v3_5.js"></script>

Hard refresh: ?v=15001
