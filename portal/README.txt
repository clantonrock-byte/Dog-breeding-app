DOGS: VIEW MALES / VIEW FEMALES FIX

WHAT THIS FIXES
- "View all dogs" works, but "View males" / "View females" don't filter correctly.

WHY
- Some versions of renderDogs() read window.dogsViewMode.
- Your "View males/females" buttons may only update a local dogsViewMode variable.

INSTALL (ROOT index is entrypoint)
Option A (recommended): Use your patch loader
- Put dogs_male_female_fix.js in /portal/
- Add this line to portal/patches/patches.js:
  load("../dogs_male_female_fix.js");
  (or whatever your loader function is)

Option B: Direct include (quick)
- Add to the bottom of the index.html that actually runs:
  <script src="portal/dogs_male_female_fix.js"></script>

VERIFY
- Tap View males -> list shows only Male dogs
- Tap View females -> list shows only Female dogs
