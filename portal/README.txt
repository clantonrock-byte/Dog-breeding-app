DOG PROFILE REBUILD v3.4 (AUTOSAVE INTERACTIONS)

Fixes:
- Heat checkbox "flicking off" (caused by re-render before Save & Done)
- Promote to Adult "not sticking" (same cause)

Changes:
- No continuous interval re-render; only a short retry loop on profile open
- Auto-saves on:
  - Sex change
  - Disposition change
  - Promote to Adult
  - Heat today / ended
  - In-heat checkbox toggle
  - Heat start date change

Install:
1) Upload to /portal/:
   - portal/dog_profile_rebuild_v3_4.js
   - portal/dog_profile_rebuild_v3_4.css

2) index.html:
   <head>:
     <link rel="stylesheet" href="portal/dog_profile_rebuild_v3_4.css" />
   footer (after dogs.bundle.js):
     <script src="portal/dog_profile_rebuild_v3_4.js"></script>

3) Remove other rebuild scripts while testing (v3.2/v3.3).

Hard refresh: ?v=12034
