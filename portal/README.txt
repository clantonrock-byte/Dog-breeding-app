DOGS: NEEDS SEX SET FIX

WHAT THIS FIXES
- "Needs sex set" shows all dogs instead of filtering.

WHY
- Your list renderer is reading window.dogsViewMode,
  but the existing "Needs sex set" handler updates a local dogsViewMode.

INSTALL (root index is entrypoint)
1) Upload dogs_unassigned_fix.js to /portal/
   /portal/dogs_unassigned_fix.js

2) Add to the bottom of ROOT index.html (right before </body>):
   <script src="portal/dogs_unassigned_fix.js"></script>

(If you have a patch loader, you can load it there instead.)

VERIFY
- Tap "Needs sex set" -> only dogs with unknown sex show in main list
