DOG LIFE-STAGE PROMOTE PATCH

Goal:
- Remove redundancy of the Status dropdown.
- Show ONE-way "Promote to Adult" only when status is Puppy.
- Hide the Puppy/Adult selector once Adult (or other non-Puppy status) is set.
- Keep Disposition selector for For sale / Transferred / Deceased.

Install:
1) Upload into /portal/:
   - portal/dog_lifestage_promote_patch.js
   - portal/dog_lifestage_promote_patch.css

2) In root index.html:
   <head>:
     <link rel="stylesheet" href="portal/dog_lifestage_promote_patch.css" />
   footer (after dogs.bundle.js):
     <script src="portal/dog_lifestage_promote_patch.js"></script>

Hard refresh: ?v=9990
