BP DogID + Photo Binding Fix

What it does:
1) Adds a stable dogId to each dog record (one-time migration) so future bindings can be reliable.
2) Updates dog_photo_open.js to bind photos per dog (dogId-aware, callName fallback), and never reuse another dog’s photo.

Install:
- Upload/replace these files in repo root:
  dog_id_migrate.js
  dog_photo_open.js
- Add to root index.html before </body>:
  <script src="dog_id_migrate.js"></script>
  <script src="dog_photo_open.js"></script>

Cache-bust:
? v=dogid1
