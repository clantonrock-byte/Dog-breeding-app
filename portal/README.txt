STATUS vs DISPOSITION (Retired is Disposition)

This patch:
- Keeps Life Stage Status dropdown to Puppy/Adult only.
- Ensures Disposition includes Retired.
- Removes legacy "Life status" card that references transfer/deceased under Status.
- Hides life-stage dropdown once Adult.

INSTALL
1) Upload into /portal/:
   - portal/dog_status_disposition_split_patch.js
   - portal/dog_status_disposition_split_patch.css

2) Add to root index.html:
   <head>:
     <link rel="stylesheet" href="portal/dog_status_disposition_split_patch.css" />
   footer (after dogs.bundle.js and after dog_disposition_patch.js):
     <script src="portal/dog_status_disposition_split_patch.js"></script>

Hard refresh: ?v=10500
