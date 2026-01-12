DOGS: BITCH IN HEAT ALERTS (HEAT + SOON)

Install (bundles setup):
1) Upload into /portal/:
   - portal/dogs_heat_alert_patch.js
   - portal/dogs_heat_alert_patch.css

2) In root index.html <head>:
   <link rel="stylesheet" href="portal/dogs_heat_alert_patch.css" />

3) At the bottom, load AFTER dogs.bundle.js:
   <script src="portal/dogs_heat_alert_patch.js"></script>

Usage:
- Dog Profile (female): set Currently in heat + Heat start date + notes.
- Dog list: HEAT badge if in heat; SOON if predicted next heat within warn days.
- Dogs view: once per day popup summary when any are in heat or due soon.
- Settings: Heat alerts section (cycle days, heat duration days, warn days).
