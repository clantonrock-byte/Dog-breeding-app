BP Photo Per Call Name (Rule A)

This patch stops the 'all dogs show same photo' problem by storing one current photo per dog
keyed by Call Name.

Install:
1) Upload dog_photo_per_callname.js to repo root.
2) Add to root index.html before </body>:
   <script src="dog_photo_per_callname.js"></script>

Use:
- In Dogs list, tap 📷 Add photo on each dog once.
- After set, tapping the thumbnail opens that dog profile.
