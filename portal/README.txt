AUTO LOGOUT AFTER INACTIVITY (10 MINUTES)

WHAT THIS DOES
- Logs the user out after 10 minutes of no interaction
- Forces Portal PIN screen to reappear
- Prevents phone-back / idle screen from staying unlocked

REQUIRES
- portal_pin_multiuser_v2.js installed and working

INSTALL
1) Upload into /portal/:
   portal/portal_auto_logout.js

2) In root index.html, load AFTER portal_pin_multiuser_v2.js:
   <script src="portal/portal_auto_logout.js"></script>

CHANGE TIMEOUT
- Edit TIMEOUT_MINUTES inside the file (default = 10)

BEHAVIOR
- Any touch, tap, scroll, or keypress resets the timer
- After timeout, PIN screen returns
