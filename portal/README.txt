MULTI-USER PORTAL PIN GATE (client-side)

Install:
1) Upload into /portal/:
   - portal/portal_pin_multiuser.js
   - portal/portal_pin_multiuser.css

2) root index.html:
   <head>:
     <link rel="stylesheet" href="portal/portal_pin_multiuser.css" />
   bottom (AFTER dogs.bundle.js):
     <script src="portal/portal_pin_multiuser.js"></script>

First-time setup:
- Open site -> lock screen -> tap "Admin setup"
- Create Admin name + PIN
- Unlock, then ⚙️ Settings -> Portal access -> Add users and set PINs
