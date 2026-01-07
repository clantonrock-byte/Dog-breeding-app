document.querySelectorAll('.tab').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hide'));
    document.getElementById('view'+b.dataset.tab.charAt(0).toUpperCase()+b.dataset.tab.slice(1)).classList.remove('hide');
  };
});