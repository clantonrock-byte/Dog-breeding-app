DOG PROFILE UI POLISH (CSS ONLY)

This patch improves layout + navigation for the rebuilt profile panel (v3.5),
without changing any saving logic.

WHAT IT DOES
- Sticky section tabs (Basics/Repro/Heat/Notes) with blur background
- Better spacing + touch targets
- Safer sticky Save & Done (respects iOS safe-area inset)
- Slightly larger inputs + consistent rounding

INSTALL
1) Upload to /portal/:
   - portal/dog_profile_ui_polish.css

2) Add to root index.html <head> AFTER dog_profile_rebuild_v3_5.css:
   <link rel="stylesheet" href="portal/dog_profile_ui_polish.css" />

Hard refresh: ?v=17001
