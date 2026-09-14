(function () {
  function reveal() {
    document.body.classList.remove("is-loading");
  }
  const resumeEl = document.getElementById("card-resume");
  const phoneEl = document.getElementById("card-phone");
  const locEl = document.getElementById("card-loc");
  if (!phoneEl && !locEl) {
    reveal();
    return;
  }

  const NL_PHONE_TEXT = "+1 709 691 2883";
  const NL_PHONE_HREF = "tel:+17096912883";
  const NL_LOCATION = "St. John's, NL, Canada";
  const STJOHNS_RESUME = "assets/files/Amir_Gholizad_Resume_2.pdf";

  function applyNewfoundland() {
    if (phoneEl) {
      phoneEl.textContent = NL_PHONE_TEXT;
      phoneEl.setAttribute("href", NL_PHONE_HREF);
    }

    if (locEl) {
      locEl.textContent = NL_LOCATION;
    }

    if (resumeEl) {
      resumeEl.href = STJOHNS_RESUME;
    }
  }

  if (/[?&]nl=1\b/.test(window.location.search)) {
    applyNewfoundland();
    reveal();
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, 3500);

  fetch("https://ipwho.is/", { signal: controller.signal })
    .then(function (r) {
      return r.ok ? r.json() : Promise.reject();
    })
    .then(function (data) {
      if (!data || data.success === false) return;

      const inNewfoundland =
        (data.country_code === "CA" || /canada/i.test(data.country || "")) &&
        (data.region_code === "NL" || /newfoundland/i.test(data.region || ""));
      if (inNewfoundland) applyNewfoundland();
    })
    .catch(function () {})
    .finally(function () {
      clearTimeout(timer);
      reveal();
    });
})();
