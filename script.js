// Show a placeholder frame until photo.jpg exists
(function () {
  var box = document.getElementById('portrait');
  var img = box && box.querySelector('img');
  if (!img) return;
  function missing() { box.classList.add('missing'); }
  if (img.complete && img.naturalWidth === 0) missing();
  img.addEventListener('error', missing);
})();
