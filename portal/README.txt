TRANSFER: SELECTABLE SOURCE + DESTINATION TEXT

INSTALL (root index is entrypoint)
1) Upload:
   portal/inventory_transfer_source_patch.js

2) In root index.html, include AFTER your inventory patches:
   <script src="portal/inventory_transfer_source_patch.js"></script>

USAGE
- Go to Transfer
- Pick Source location (dropdown)
- Enter Destination (text)
- Done -> moves qty from Source -> Destination bucket (does NOT reduce total)

NOTES
- If Destination is blank, Transfer behaves like legacy (subtract qty via original applyTransfer).
- Source options are generated from existing non-zero location buckets for that item.
