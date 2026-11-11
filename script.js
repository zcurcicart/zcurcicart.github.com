(function () {
  "use strict";

  /* ---------- Nakon osvježavanja stranica uvijek počinje na vrhu / Always start at the top after reload ---------- */
  if ("scrollRestoration" in history) { history.scrollRestoration = "manual"; }
  window.scrollTo(0, 0);

  function clearHash() {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  /* Klik na izbornik: skrolaj do odjeljka, ali ne ostavljaj #sidro u adresi,
     inače bi svako osvježavanje skočilo na taj odjeljak (npr. Monografije). */
  document.addEventListener("click", function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) { return; }
    var target = document.getElementById(link.getAttribute("href").slice(1));
    if (!target) { return; }
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
    clearHash();
  });

  var restored = false;
  function restoreScroll() {
    if (restored) { return; }
    restored = true;
    if (window.location.hash) {
      /* Poveznica izvana na odjeljak (npr. .../#gallery): poštuj je jednom, pa makni sidro. */
      var target = document.getElementById(window.location.hash.slice(1));
      if (target) { target.scrollIntoView({ behavior: "instant" }); }
      clearHash();
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  /* ---------- Slike kojih nema se ne prikazuju / Hide missing images ---------- */
  function removeFigure(img) {
    var figure = img.closest("figure.optional");
    var gallery = img.closest(".gallery");
    if (figure) { figure.remove(); } else { img.remove(); }
    if (gallery && !gallery.querySelector("figure")) {
      gallery.style.display = "none";
    }
  }

  /* Poziciju vraćamo tek kad je raspored konačan: slike provjerene I pisma učitana.
     Inače se zamjenom pisama tekst pomakne i stranica pri svakom osvježavanju "klizne" niže. */
  var imagesDone = false;
  var fontsDone = false;
  function maybeRestore() {
    if (imagesDone && fontsDone) { restoreScroll(); }
  }

  var pending = 0;
  function settled() {
    pending -= 1;
    if (pending === 0) { imagesDone = true; maybeRestore(); }
  }

  document.querySelectorAll("img[data-optional]").forEach(function (img) {
    if (img.complete) {
      if (img.naturalWidth === 0) { removeFigure(img); }
      return;
    }
    pending += 1;
    img.addEventListener("load", settled, { once: true });
    img.addEventListener("error", function () { removeFigure(img); settled(); }, { once: true });
  });
  if (pending === 0) { imagesDone = true; }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { fontsDone = true; maybeRestore(); });
  } else {
    fontsDone = true;
  }
  maybeRestore();
  setTimeout(restoreScroll, 3000); /* sigurnosna mreža ako se nešto ne učita */

  /* ---------- Povećanje slike / Lightbox ---------- */
  var box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(box);
  var boxImg = box.querySelector("img");
  var boxCap = box.querySelector("figcaption");

  document.addEventListener("click", function (event) {
    var img = event.target.closest(".gallery img, .hero img, .book img, .exhibition-photos img");
    if (!img) { return; }
    var caption = img.parentElement.querySelector("figcaption");
    boxImg.src = img.src;
    boxImg.alt = img.alt;
    boxCap.textContent = caption ? caption.textContent : img.alt;
    box.classList.add("open");
  });

  function closeBox() { box.classList.remove("open"); }
  box.addEventListener("click", closeBox);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") { closeBox(); }
  });

  /* ---------- Godina u podnožju / Footer year ---------- */
  var year = document.getElementById("year");
  if (year) { year.textContent = String(new Date().getFullYear()); }
})();
