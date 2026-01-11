UPLOAD INSTRUCTIONS (HOT PATCH)

1) Copy BOTH files into your repo next to index.html:
   - dog_ui_patch.js
   - dog_ui_patch.css

2) Edit index.html and add these TWO tags near the bottom (after your existing CSS/JS is fine):
   <link rel="stylesheet" href="dog_ui_patch.css" />
   <script src="dog_ui_patch.js"></script>

3) Refresh the app (hard refresh).

WHY THIS WORKS
- Your app appears to define renderDogs() inline inside index.html.
- This patch overrides renderDogs() at runtime so you don't have to move code around.

If nothing changes after install:
- Make sure index.html actually includes dog_ui_patch.js (no 404)
- In browser console run: typeof renderDogs
