DOG PROFILE CLEANUP (Status lock + remove heat notes)

Changes:
1) Once dog status is set to non-Puppy (e.g., Adult), it becomes locked (can't revert to Puppy).
2) Removes the Heat block "Notes (optional)" field (use main Dog Notes below instead).

INSTALL
1) Upload into /portal/:
   - portal/dog_profile_status_heat_cleanup.js
   - portal/dog_profile_status_heat_cleanup.css

2) In root index.html:
   <head>:
     <link rel="stylesheet" href="portal/dog_profile_status_heat_cleanup.css" />
   footer (after dogs.bundle.js):
     <script src="portal/dog_profile_status_heat_cleanup.js"></script>

Hard refresh: ?v=9950
