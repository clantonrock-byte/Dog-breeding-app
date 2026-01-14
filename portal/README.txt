DOG STATUS REDUNDANCY FIX

Removes extra "Set Puppy/Set Adult" buttons and prevents reverting Adult -> Puppy.

Install:
1) Upload into /portal/:
   - portal/dog_status_redundancy_fix.js
   - portal/dog_status_redundancy_fix.css

2) In root index.html:
   <head>:
     <link rel="stylesheet" href="portal/dog_status_redundancy_fix.css" />
   footer (after dogs.bundle.js):
     <script src="portal/dog_status_redundancy_fix.js"></script>

Hard refresh: ?v=9960
