BP_CLEAR_DOG_LIST_PHOTOS

What:
- Clears photo-mapping keys used by dog list thumbnail experiments.
- Does NOT delete dog records or inventory.

Install:
1) Upload rc_clear_dog_list_photos.js to repo root.
2) Temporarily add this line to index.html before </body>:
   <script src="rc_clear_dog_list_photos.js"></script>
3) Load the app once. You will see an alert; it will reload.
4) Remove the script tag from index.html afterwards (important).

Alternative run:
- Open directly:
  https://clantonrock-byte.github.io/Dog-breeding-app/rc_clear_dog_list_photos.js
  (May be blocked by browser; script tag method is most reliable.)
