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
   Diagonal skill lines (background)
   The stack is laid into repeated rows; the whole grid is rotated so each
   row reads as a diagonal line. Every row is a seamless CSS marquee (two
   identical sequences translating -50%), giving an endless diagonal flow.
   ========================================================================= */
(function () {
  const field = document.getElementById("logoField");
  const LOGOS = window.STACK_LOGOS || [];
  if (!field || !LOGOS.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ROW_H = 112;   // px per line
  const GAP = 48;      // px between logos in a line

  // One logo cell (svg or text chip) with a randomized size + opacity.
  function makeItem(data) {
    const el = document.createElement("div");
    el.className = "logo-item";
    el.style.setProperty("--gap", GAP + "px");
    const size = 34 + Math.random() * 30; // 34–64px
    if (data.d) {
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.innerHTML =
        '<svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="' +
        data.d + '"/></svg>';
    } else {
      el.style.fontSize = size * 0.34 + "px";
      el.innerHTML = '<span class="logo-chip">' + data.name + "</span>";
    }
    el.style.opacity = (0.2 + Math.random() * 0.2).toFixed(3); // 20–40%
    return el;
  }

  let builtRowCount = 0;

  function build() {
    // Oversized (155vmax) rotated grid.
    const vmax = Math.max(window.innerWidth, window.innerHeight);
    const gridSize = vmax * 1.55;
    const rowCount = Math.ceil(gridSize / ROW_H) + 1;

    // Only (re)build when more rows are actually needed — i.e. the viewport's
    // larger dimension grew past what we've already covered. Ordinary resizes,
    // DevTools, and the mobile URL bar leave the existing pattern untouched.
    if (rowCount <= builtRowCount) return;
    builtRowCount = rowCount;

    field.textContent = "";
    const lines = document.createElement("div");
    lines.className = "logo-lines";
    field.appendChild(lines);

    for (let r = 0; r < rowCount; r++) {
      const line = document.createElement("div");
      line.className = "logo-line";
      line.style.setProperty("--row-h", ROW_H + "px");

      const track = document.createElement("div");
      track.className = "logo-track";
      // Vary pace & phase per line so rows don't march in lockstep.
      track.style.setProperty("--dur", (46 + Math.random() * 34).toFixed(1) + "s");
      track.style.setProperty("--delay", (-Math.random() * 40).toFixed(1) + "s");
      line.appendChild(track);
      lines.appendChild(line);

      // 1) Base sequence in the source order (sizes/opacity still vary per item).
      const base = LOGOS.map(makeItem);
      base.forEach((el) => track.appendChild(el));

      // 2) Repeat the base until one "unit" is wider than the line, so the
      //    marquee window is always full (no gaps → no disappearing rows).
      const seqW = track.scrollWidth || 1;
      const reps = Math.max(1, Math.ceil(gridSize / seqW));
      for (let i = 1; i < reps; i++) {
        base.forEach((el) => track.appendChild(el.cloneNode(true)));
      }

      // 3) Clone the whole unit once so the two halves are IDENTICAL, making
      //    the translateX(-50%) loop perfectly seamless.
      const unit = Array.prototype.slice.call(track.children);
      unit.forEach((el) => track.appendChild(el.cloneNode(true)));
    }
  }

  build();

  // Debounced: only grows the grid on a large enlargement / orientation jump.
  // The guard in build() makes this a no-op for everyday resizes.
  let rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(build, 250);
  });
})();
