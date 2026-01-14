DOG DISPOSITION PATCH (SECOND STATUS)

Goal:
- Keep Puppy/Adult as the life stage.
- Add a separate "Disposition" status for: For sale | Transferred | Deceased.

Install:
1) Upload into /portal/:
   - portal/dog_disposition_patch.js
   - portal/dog_disposition_patch.css

2) In root index.html:
   <head>:
     <link rel="stylesheet" href="portal/dog_disposition_patch.css" />
   footer (after dogs.bundle.js and after dog_profile_polish_patch_v2.js):
     <script src="portal/dog_disposition_patch.js"></script>

Hard refresh: ?v=9970

Notes:
- Disposition "Transferred" or "Deceased" auto-archives the dog.
