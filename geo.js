/* =========================================================================
   Regional personalization
   Best-effort IP geolocation: if the visitor is in Newfoundland & Labrador,
   swap the Toronto defaults for the local (709) number and St. John's.
   No permission prompt (IP-based, not the browser Geolocation API), and any
   failure silently leaves the defaults — which is also what crawlers and
   no-JS visitors see.
   ========================================================================= */
(function () {
  const phoneEl = document.getElementById("card-phone");
  const locEl = document.getElementById("card-loc");
  if (!phoneEl && !locEl) return;

  const NL_PHONE_TEXT = "+1 709 691 2883";
  const NL_PHONE_HREF = "tel:+17096912883";
  const NL_LOCATION = "St. John's, NL, Canada";

  function applyNewfoundland() {
    if (phoneEl) {
      phoneEl.textContent = NL_PHONE_TEXT;
      phoneEl.setAttribute("href", NL_PHONE_HREF);
    }
    if (locEl) locEl.textContent = NL_LOCATION;
  }

  // Test override: append ?nl=1 to the URL to preview the NL variant anywhere.
  if (/[?&]nl=1\b/.test(window.location.search)) {
    applyNewfoundland();
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, 4000);

  fetch("https://ipwho.is/", { signal: controller.signal })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      if (!data || data.success === false) return;

      const inNewfoundland =
        (data.country_code === "CA" || /canada/i.test(data.country || "")) &&
        (data.region_code === "NL" || /newfoundland/i.test(data.region || ""));
      if (inNewfoundland) applyNewfoundland();
    })
    .catch(function () { /* offline / blocked / not-in-NL → keep defaults */ })
    .finally(function () { clearTimeout(timer); });
})();
