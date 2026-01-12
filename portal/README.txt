ANDROID BACK BUTTON FIX

Install (bundles setup):
1) Upload into /portal/:
   portal/back_button_history_patch.js

2) In root index.html, add AFTER dogs.bundle.js:
   <script src="portal/back_button_history_patch.js"></script>

3) Hard refresh:
   open with ?v=1 to bust cache.
