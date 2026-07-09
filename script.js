(function () {
  const card = document.getElementById("card");
  const shadow = document.querySelector(".card-shadow");
  const front = document.querySelector(".card-front");
  const back = document.querySelector(".card-back");
  const flipBtn = document.getElementById("flipBtn");
  const flipBackBtn = document.getElementById("flipBackBtn");

  // Initial 3D state. Only the front is visible; the back waits edge-on.
  gsap.set([front, back], { transformPerspective: 1600, transformOrigin: "50% 50%" });
  gsap.set(front, { rotationY: 0, autoAlpha: 1 });
  gsap.set(back, { rotationY: -90, autoAlpha: 0 });

  let isFlipped = false;
  let isAnimating = false;

  const HALF = 0.62;   // seconds per half-turn
  const ZOOM = 1.2;    // peak zoom at the edge-on midpoint
  const LIFT = 54;     // px the card rises toward you
  const DEPTH = 90;    // px each face pushes toward the viewer (real 3D)
  const TUMBLE = 7;    // deg of subtle X-axis tumble

  function flip() {
    if (isAnimating) return;
    isAnimating = true;

    // Direction alternates so flipping back spins the opposite way.
    const dir = isFlipped ? -1 : 1;
    const outgoing = isFlipped ? back : front;
    const incoming = isFlipped ? front : back;

    const tl = gsap.timeline({
      onComplete: function () { isAnimating = false; },
    });

    // --- Whole-card arc: lift up + zoom, then settle with a little weight ---
    tl.to(card, { y: -LIFT, scale: ZOOM, duration: HALF, ease: "power2.out" }, 0)
      .to(card, { y: 0, scale: 1, duration: HALF, ease: "back.out(1.25)" }, HALF);

    // --- Ground shadow reacts: spreads, drops away & fades as it lifts ---
    tl.to(shadow, { scale: 1.22, y: LIFT * 0.9, opacity: 0.14, duration: HALF, ease: "power2.out" }, 0)
      .to(shadow, { scale: 1, y: 0, opacity: 0.3, duration: HALF, ease: "power2.in" }, HALF);

    // --- Outgoing face: swings to edge-on, pushing toward you & tumbling ---
    tl.to(outgoing, {
        rotationY: 90 * dir,
        z: DEPTH,
        rotationX: TUMBLE,
        duration: HALF,
        ease: "power2.in",
      }, 0)
      .set(outgoing, { autoAlpha: 0, z: 0, rotationX: 0 });

    // --- Incoming face: appears edge-on, settles flat with an overshoot ---
    tl.set(incoming, { rotationY: -90 * dir, z: DEPTH, rotationX: TUMBLE, autoAlpha: 1 }, HALF)
      .to(incoming, {
        rotationY: 0,
        z: 0,
        rotationX: 0,
        duration: HALF,
        ease: "back.out(1.4)",
      }, HALF);

    isFlipped = !isFlipped;
  }

  flipBtn.addEventListener("click", flip);
  flipBackBtn.addEventListener("click", flip);

  // Spacebar / Enter also flips (unless a link is focused).
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.code === "Enter") {
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag !== "A") {
        e.preventDefault();
        flip();
      }
    }
  });
})();


/* =========================================================================
   Diagonal skill field (background) — single <canvas> renderer.
   The whole field is drawn on ONE canvas layer, rotated 24°, with each row
   drifting horizontally. Because it's a single compositor layer redrawn per
   frame (no per-row GPU layers, no CSS-animation loop boundaries), rows can't
   get evicted/flicker the way the DOM marquee did.
   ========================================================================= */
(function () {
  const canvas = document.getElementById("logoCanvas");
  const LOGOS = window.STACK_LOGOS || [];
  if (!canvas || !LOGOS.length) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  // Respect reduced-motion (CSS also hides the canvas, but skip work too).
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ROW_H = 112;                 // px per diagonal line
  const GAP = 48;                    // px between logos in a line
  const ANGLE = (24 * Math.PI) / 180;
  const COLOR = "#7a5f3a";           // warm sepia tint

  // Deterministic PRNG (mulberry32) → identical field on every load/rebuild.
  const SEED = 0x1a2b3c4d;
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Cache a Path2D per SVG logo (null for text-chip logos).
  const paths = LOGOS.map((d) => (d.d ? new Path2D(d.d) : null));

  let W = 0, H = 0, dpr = 1;
  let coverW = 0, coverH = 0;        // half-extents of the viewport in the rotated frame
  let rows = [];

  function chipFont(fs) { return "600 " + fs + "px Poppins, sans-serif"; }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    const c = Math.abs(Math.cos(ANGLE)), s = Math.abs(Math.sin(ANGLE));
    coverW = (W / 2) * c + (H / 2) * s;   // how far a row must extend left/right
    coverH = (W / 2) * s + (H / 2) * c;   // how far rows must extend up/down

    const rng = mulberry32(SEED);
    const rowCount = Math.ceil((coverH * 2) / ROW_H) + 2;
    const needW = coverW * 2 + 200;       // each row's tiling unit must span this

    rows = [];
    for (let r = 0; r < rowCount; r++) {
      const speed = 12 + rng() * 10;      // px/sec drift
      const items = [];
      let x = 0, guard = 0;
      // Lay logos (source order, deterministic per-cell size/opacity) until the
      // sequence is wide enough to tile seamlessly across the whole row.
      while (x < needW && guard++ < 5000) {
        for (let i = 0; i < LOGOS.length && x < needW; i++) {
          const data = LOGOS[i];
          const size = 34 + rng() * 30;   // 34–64px
          const opacity = 0.2 + rng() * 0.2;
          let w;
          if (data.d) {
            w = size;
          } else {
            const fs = size * 0.34;
            ctx.font = chipFont(fs);
            w = ctx.measureText(data.name).width + fs * 1.4 + 3; // ~0.7em padding + border
          }
          items.push({ i, size, opacity, x, w, text: data.d ? null : data.name });
          x += w + GAP;
        }
      }
      const phase = rng() * x;            // desync rows
      rows.push({ y: (r - (rowCount - 1) / 2) * ROW_H, items, seqW: x, speed, phase });
    }
  }

  function drawItem(it, dx, y) {
    ctx.globalAlpha = it.opacity;
    if (it.text === null) {
      ctx.save();
      ctx.translate(dx, y - it.size / 2);
      ctx.scale(it.size / 24, it.size / 24); // 24×24 viewBox → size px
      ctx.fillStyle = COLOR;
      ctx.fill(paths[it.i]);
      ctx.restore();
    } else {
      const fs = it.size * 0.34;
      const h = fs * 1.5;
      const padX = fs * 0.7;
      ctx.font = chipFont(fs);
      ctx.textBaseline = "middle";
      // pill outline
      const rr = h / 2;
      ctx.beginPath();
      ctx.moveTo(dx + rr, y - h / 2);
      ctx.arcTo(dx + it.w, y - h / 2, dx + it.w, y + h / 2, rr);
      ctx.arcTo(dx + it.w, y + h / 2, dx, y + h / 2, rr);
      ctx.arcTo(dx, y + h / 2, dx, y - h / 2, rr);
      ctx.arcTo(dx, y - h / 2, dx + it.w, y - h / 2, rr);
      ctx.closePath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLOR;
      ctx.stroke();
      ctx.fillStyle = COLOR;
      ctx.fillText(it.text, dx + padX, y + 0.5);
    }
  }

  let raf = 0;
  function frame(now) {
    const t = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(ANGLE);
    ctx.textAlign = "left";

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      // Run the offset backwards to drift the opposite way, but keep it in
      // [0, seqW) and keep the `- offset` shift so the three tile copies always
      // bracket zero — full edge-to-edge cover, no blank side.
      let offset = (row.phase - t * row.speed) % row.seqW;
      if (offset < 0) offset += row.seqW;
      for (let k = -1; k <= 1; k++) {
        const shift = k * row.seqW - offset;
        for (let j = 0; j < row.items.length; j++) {
          const it = row.items[j];
          const dx = it.x + shift;
          if (dx > coverW || dx + it.w < -coverW) continue; // cull off-screen
          drawItem(it, dx, row.y);
        }
      }
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  build();
  raf = requestAnimationFrame(frame);

  // Chip widths depend on the Poppins metrics; re-measure once it loads.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(build);
  }

  // Rebuild on resize (cheap + deterministic, so no visible reshuffle).
  let rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(build, 200);
  });
})();
