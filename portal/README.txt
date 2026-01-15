DOGS.BUNDLE PROFILE DISABLE PATCH

You proved it: when portal/dogs.bundle.js is commented out, heat stops flicking off.
That means dogs.bundle.js is still controlling (and resetting) the legacy profile UI.

This patch keeps dogs.bundle.js for the Dogs list, BUT disables its Dog Profile renderer.

INSTALL
1) Upload this file to /portal/:
   - portal/dogs_bundle_profile_disable.js

2) In root index.html footer, order MUST be:

<script src="portal/inventory.bundle.js"></script>
<script src="portal/dogs.bundle.js"></script>
<script src="portal/dogs_bundle_profile_disable.js"></script>
<script src="portal/back_button_history_patch.js"></script>
<script src="portal/portal_pin_multiuser_v2.js"></script>
<script src="portal/dog_profile_rebuild_v3_5.js"></script>

(Your rebuild must be last. Remove any other profile scripts.)

3) Hard refresh with cache buster:
?v=13001

EXPECTED RESULT
- Dogs list still works (because dogs.bundle is loaded)
- Opening a dog profile no longer flicks off heat / resets Adult/Puppy
- Rebuild UI owns the profile completely
