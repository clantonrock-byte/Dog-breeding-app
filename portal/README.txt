STATUS vs DISPOSITION SPLIT – SAFE v2

What it does:
- Life Stage Status (#dogStatus): ONLY Puppy, Adult
- Disposition (#dogDisposition): Active, For sale, Retired, Transferred, Deceased
- No broad hiding; only manipulates these two selects

Install:
1) Upload into /portal/:
   - portal/dog_status_disposition_split_safe_v2.js
   - portal/dog_status_disposition_split_safe_v2.css (optional, minimal)

2) index.html:
   <head> (optional):
     <link rel=\"stylesheet\" href=\"portal/dog_status_disposition_split_safe_v2.css\" />
   footer (AFTER dog_disposition_patch.js):
     <script src=\"portal/dog_status_disposition_split_safe_v2.js\"></script>

3) Keep your prior “status vs disposition split” script commented out.
4) Hard refresh: ?v=10510
