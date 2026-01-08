BP Photo Bind Per Dog (v1)

Fixes the 'all dogs show same photo' problem by storing ONE current photo per dog.

Storage:
- localStorage rc_dog_photos_v1 maps callName -> dataURL (and also id:dogId when available)

Install:
1) Upload photo_bind_per_dog.js to repo root.
2) Add to index.html before </body>:
   <script src="photo_bind_per_dog.js"></script>

Then:
- Update each dog's photo once in the profile to seed the per-dog map.
- Dog list will show the correct photo per dog, otherwise 📷 Add photo.
