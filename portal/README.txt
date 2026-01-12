MULTI-USER PORTAL PIN GATE v2 (first-time setup fixed)

Fix:
- If no users exist, the PIN screen shows automatically so you can create the first Admin.

Install:
1) Upload into /portal/:
   - portal/portal_pin_multiuser_v2.js
   - portal/portal_pin_multiuser.css

2) root index.html:
   <head>:
     <link rel="stylesheet" href="portal/portal_pin_multiuser.css" />
   bottom (AFTER dogs.bundle.js):
     <script src="portal/portal_pin_multiuser_v2.js"></script>

First-time setup:
- Open site -> PIN screen -> tap "Admin setup" -> create Admin
- Unlock, then ⚙️ Settings -> Portal access -> Add users and set their PINs
