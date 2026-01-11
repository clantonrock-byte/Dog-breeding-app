DOGS: (A) Needs sex set as a true filter + (B) list polish

FILES
- dogs_filters_polish.js
- dogs_filters_polish.css

INSTALL (root index is entrypoint)
1) Upload both files into /portal/
   /portal/dogs_filters_polish.js
   /portal/dogs_filters_polish.css

2) Add CSS to root index.html <head> (or your main css imports):
   <link rel="stylesheet" href="portal/dogs_filters_polish.css" />

3) Add JS to the bottom of root index.html (right before </body>):
   <script src="portal/dogs_filters_polish.js"></script>

RESULT
- "Needs sex set" behaves like All/Males/Females (filters main list)
- Dog rows are tappable with chevron
- Badges: Male/Female/Needs sex, Intact/Altered, Status, Route (best-effort)

NOTES
- This patch replaces window.renderDogs at runtime to standardize behavior.
- It does not modify stored dog data.
