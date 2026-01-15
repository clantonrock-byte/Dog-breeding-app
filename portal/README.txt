DOG LIST THUMBNAILS (CSS-ONLY) - Steps 1-3

This package completes:
1) Stabilization: keep dogs.bundle.js, but do NOT let it own DogProfile (you already did this).
2) Restore thumbnails: CSS-only clamp to keep list images at 64x64 on Dogs view.
3) Lock architecture: Dogs list stays list-only; Dog profile stays rebuild-only.

INSTALL
1) Upload to /portal/:
   - portal/dogs_list_thumbs.css

2) In root index.html <head> add (near other CSS):
   <link rel="stylesheet" href="portal/dogs_list_thumbs.css" />

Hard refresh: ?v=16001

Notes
- This does NOT change profile images.
- This clamps images only inside #viewDogs lists.
