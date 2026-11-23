// Audio version of a blog post: play/pause, a seek bar with a tick at each
// chapter, and a label showing which section of the article is being read.
// Without JavaScript the native <audio controls> inside .listen is shown instead.
(function () {
  var boxes = document.querySelectorAll('.listen');
  [].forEach.call(boxes, function (box) {
    var audio = box.querySelector('audio');
    var btn = box.querySelector('.play');
    var track = box.querySelector('.track');
    var fill = box.querySelector('.fill');
    var time = box.querySelector('.listen-time');
    var label = box.querySelector('.listen-title');
    var idle = label.textContent;
    var chapters = (box.getAttribute('data-chapters') || '').split(',').map(Number);
    var names = ['Introduction'].concat([].map.call(document.querySelectorAll('.prose h2'), function (h) {
      return h.textContent;
    }));

    box.classList.add('js-ready');

    function dur() { return audio.duration || Number(box.getAttribute('data-duration')) || 0; }
    function fmt(s) {
      s = Math.max(0, Math.floor(s || 0));
      return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
    }
    function chapterAt(t) {
      var i = 0;
      chapters.forEach(function (c, k) { if (t >= c) i = k; });
      return i;
    }

    // one tick where each section starts (skip the intro at 0)
    chapters.forEach(function (c, i) {
      if (!i || !dur()) return;
      var tick = document.createElement('span');
      tick.className = 'tick';
      tick.style.left = (c / dur() * 100) + '%';
      track.appendChild(tick);
    });

    function render() {
      var d = dur(), t = audio.currentTime;
      fill.style.width = (d ? t / d * 100 : 0) + '%';
      time.textContent = t ? fmt(t) + ' / ' + fmt(d) : fmt(d);
      label.textContent = t ? (names[chapterAt(t)] || idle) : idle;
      track.setAttribute('aria-valuenow', Math.round(t));
      track.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(d));
    }

    btn.addEventListener('click', function () {
      if (audio.paused) audio.play(); else audio.pause();
    });
    audio.addEventListener('play', function () {
      box.classList.add('playing');
      btn.setAttribute('aria-label', 'Pause the audio version');
    });
    audio.addEventListener('pause', function () {
      box.classList.remove('playing');
      btn.setAttribute('aria-label', 'Play the audio version');
    });
    audio.addEventListener('timeupdate', render);
    audio.addEventListener('loadedmetadata', render);
    audio.addEventListener('ended', function () { audio.currentTime = 0; render(); });

    function seek(e) {
      var r = track.getBoundingClientRect();
      var x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
      audio.currentTime = x / r.width * dur();
      render();
    }
    track.addEventListener('pointerdown', function (e) {
      seek(e);
      track.setPointerCapture(e.pointerId);
      track.addEventListener('pointermove', seek);
    });
    track.addEventListener('pointerup', function () { track.removeEventListener('pointermove', seek); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(dur(), audio.currentTime + 5);
      else if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
      else if (e.key === ' ' || e.key === 'Enter') { btn.click(); }
      else return;
      e.preventDefault();
      render();
    });

    render();
  });
})();
