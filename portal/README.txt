DOG PROFILE REBUILD v3.3 (RESOLVE DOG ID)

You saw: "currentDogId is not set yet" with v3.2.
This v3.3 resolves the dogId using:
1) window.currentDogId (if set)
2) Fallback: match Dog Profile title text to store.dogs[].callName (must be unique)

Install:
1) Upload to /portal/:
   - portal/dog_profile_rebuild_v3_3.js
   - portal/dog_profile_rebuild_v3_3.css

2) index.html:
   <head>:
     <link rel="stylesheet" href="portal/dog_profile_rebuild_v3_3.css" />
   footer (after dogs.bundle.js):
     <script src="portal/dog_profile_rebuild_v3_3.js"></script>

3) Remove other rebuild scripts while testing (v3/v3.1/v3.2).

Hard refresh: ?v=12033
