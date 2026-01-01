// Scanner disclosure toggles (UI only)
$("#btnScanGrow")?.addEventListener("click", ()=>{
  $("#scanGrowMore")?.classList.toggle("hide");
});

$("#btnScanParticipate")?.addEventListener("click", ()=>{
  alert("Thanks for helping shape this thoughtfully.");
  $("#scanGrowMore")?.classList.add("hide");
});

$("#btnScanNotNow")?.addEventListener("click", ()=>{
  alert("No problem — scanning works the same either way.");
  $("#scanGrowMore")?.classList.add("hide");
});
