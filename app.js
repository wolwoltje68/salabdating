/* ------------------------------------------------------------------
   Salab Dating — swipe demo
   Reads the profiles from /profiles (JSON) with the photos from /images.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  var PROFIELMAP   = "profiles/";
  var MANIFEST     = PROFIELMAP + "index.json";
  var ZICHTBAAR    = 3;    // aantal kaarten in de stapel
  var DREMPEL      = 105;  // px slepen voor een swipe
  var STANDAARDKANS = 0.5; // kans op een match als het profiel niets opgeeft

  var el = {
    stapel:      document.getElementById("stapel"),
    status:      document.getElementById("status"),
    teller:      document.getElementById("matchteller"),
    tellerAantal: document.getElementById("matchteller-aantal"),
    strip:       document.getElementById("matchstrip"),
    nope:        document.getElementById("knop-nope"),
    like:        document.getElementById("knop-like"),
    shuffle:     document.getElementById("knop-shuffle"),
    scherm:      document.getElementById("matchscherm"),
    schermSub:   document.getElementById("matchsub"),
    schermFoto:  document.getElementById("match-foto"),
    schermTekst: document.getElementById("matchbericht"),
    confetti:    document.getElementById("confetti"),
    verder:      document.getElementById("knop-verder"),
    bericht:     document.getElementById("knop-bericht"),
    toast:       document.getElementById("toast")
  };

  var alleProfielen = [];  // alles wat uit /profiles is geladen
  var stapel        = [];  // nog te beoordelen profielen (bovenste = laatste)
  var kaarten       = [];  // DOM-elementen, gelijk gesorteerd aan `stapel`
  var matches       = [];
  var bezig         = false;

  /* --- helpers ---------------------------------------------------- */

  function schud(lijst) {
    var kopie = lijst.slice();
    for (var i = kopie.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = kopie[i]; kopie[i] = kopie[j]; kopie[j] = t;
    }
    return kopie;
  }

  function toon(tekst) {
    el.toast.textContent = tekst;
    el.toast.classList.add("zichtbaar");
    clearTimeout(toon.timer);
    toon.timer = setTimeout(function () {
      el.toast.classList.remove("zichtbaar");
    }, 2200);
  }

  function status(html, isFout) {
    el.status.innerHTML = html;
    el.status.hidden = false;
    el.status.classList.toggle("status--fout", !!isFout);
    el.stapel.appendChild(el.status);
  }

  function knoppenAan(aan) {
    el.nope.disabled = el.like.disabled = !aan;
  }

  /* --- laden ------------------------------------------------------ */

  function laadProfielen() {
    return fetch(MANIFEST, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error(MANIFEST + " returned status " + r.status);
        return r.json();
      })
      .then(function (lijst) {
        var bestanden = Array.isArray(lijst) ? lijst : (lijst.bestanden || []);
        return Promise.all(bestanden.map(function (naam) {
          return fetch(PROFIELMAP + naam, { cache: "no-store" })
            .then(function (r) {
              if (!r.ok) throw new Error(naam + " returned status " + r.status);
              return r.json();
            })
            .catch(function (fout) {
              console.warn("Skipped profile:", naam, fout);
              return null;
            });
        }));
      })
      .then(function (profielen) {
        return profielen.filter(Boolean);
      });
  }

  /* --- kaart bouwen ----------------------------------------------- */

  function maakKaart(profiel) {
    var kaart = document.createElement("article");
    kaart.className = "kaart";

    var meta = [];
    if (profiel.city) meta.push("<b>" + veilig(profiel.city) + "</b>");
    if (profiel.distance != null) meta.push(profiel.distance + " km away");
    if (profiel.work) meta.push(veilig(profiel.work));

    var tags = (profiel.interests || []).map(function (i) {
      return "<li>" + veilig(i) + "</li>";
    }).join("");

    kaart.innerHTML =
      '<div class="kaart__foto">' +
        '<img src="' + veilig(profiel.image) + '" alt="Photo of ' + veilig(profiel.name) + '" draggable="false">' +
      "</div>" +
      '<div class="kaart__waas"></div>' +
      '<div class="stempel stempel--like">LIKE</div>' +
      '<div class="stempel stempel--nope">NOPE</div>' +
      '<div class="kaart__info">' +
        '<h2 class="kaart__naam">' + veilig(profiel.name) +
          (profiel.age ? " <span>" + profiel.age + "</span>" : "") + "</h2>" +
        '<p class="kaart__meta">' + meta.join(" · ") + "</p>" +
        (profiel.bio ? '<p class="kaart__bio">' + veilig(profiel.bio) + "</p>" : "") +
        (tags ? '<ul class="kaart__tags">' + tags + "</ul>" : "") +
      "</div>";

    kaart.profiel = profiel;
    kaart.stempelLike = kaart.querySelector(".stempel--like");
    kaart.stempelNope = kaart.querySelector(".stempel--nope");
    maakSleepbaar(kaart);
    return kaart;
  }

  function veilig(waarde) {
    return String(waarde == null ? "" : waarde)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* --- stapel tekenen --------------------------------------------- */

  function tekenStapel() {
    kaarten.forEach(function (k) { k.remove(); });
    kaarten = [];

    var vanaf = Math.max(0, stapel.length - ZICHTBAAR);
    for (var i = vanaf; i < stapel.length; i++) {
      var kaart = maakKaart(stapel[i]);
      el.stapel.appendChild(kaart);   // laatste in DOM = bovenste kaart
      kaarten.push(kaart);
    }
    positioneer();

    if (stapel.length === 0) {
      knoppenAan(false);
      toonEinde();
    } else {
      el.status.hidden = true;
      knoppenAan(true);
    }
  }

  function positioneer() {
    var top = kaarten.length - 1;
    kaarten.forEach(function (kaart, index) {
      var diepte = top - index;                       // 0 = bovenste kaart
      kaart.classList.add("kaart--soepel");
      kaart.style.transform = "translateY(" + (diepte * 10) + "px) scale(" + (1 - diepte * 0.04) + ")";
      kaart.style.opacity = diepte > 2 ? 0 : 1;
      kaart.style.zIndex = String(10 + index);
      kaart.style.pointerEvents = diepte === 0 ? "auto" : "none";
    });
  }

  function bovensteKaart() {
    return kaarten[kaarten.length - 1] || null;
  }

  /* --- slepen ------------------------------------------------------ */

  function maakSleepbaar(kaart) {
    var startX = 0, startY = 0, dx = 0, dy = 0, actief = false, pointerId = null;

    kaart.addEventListener("pointerdown", function (e) {
      if (bezig || kaart !== bovensteKaart() || e.button !== 0) return;
      actief = true;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      kaart.setPointerCapture(pointerId);
      kaart.classList.remove("kaart--soepel");
    });

    kaart.addEventListener("pointermove", function (e) {
      if (!actief || e.pointerId !== pointerId) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      kaart.style.transform =
        "translate(" + dx + "px, " + dy + "px) rotate(" + (dx * 0.055) + "deg)";
      var kracht = Math.min(1, Math.abs(dx) / DREMPEL);
      kaart.stempelLike.style.opacity = dx > 0 ? kracht : 0;
      kaart.stempelNope.style.opacity = dx < 0 ? kracht : 0;
    });

    function loslaten(e) {
      if (!actief || (e && e.pointerId !== pointerId)) return;
      actief = false;
      kaart.classList.add("kaart--soepel");
      if (Math.abs(dx) > DREMPEL) {
        beslis(dx > 0 ? "like" : "nope");
      } else {
        kaart.style.transform = "translateY(0) scale(1)";
        kaart.stempelLike.style.opacity = 0;
        kaart.stempelNope.style.opacity = 0;
      }
      dx = dy = 0;
    }

    kaart.addEventListener("pointerup", loslaten);
    kaart.addEventListener("pointercancel", loslaten);
  }

  /* --- beslissen --------------------------------------------------- */

  function beslis(richting) {
    var kaart = bovensteKaart();
    if (!kaart || bezig) return;
    bezig = true;
    knoppenAan(false);

    var profiel = kaart.profiel;
    var naarRechts = richting === "like";

    kaart.classList.add("kaart--soepel", "kaart--weg");
    kaart.stempelLike.style.opacity = naarRechts ? 1 : 0;
    kaart.stempelNope.style.opacity = naarRechts ? 0 : 1;
    kaart.style.transform =
      "translate(" + (naarRechts ? 620 : -620) + "px, 60px) rotate(" + (naarRechts ? 26 : -26) + "deg)";
    kaart.style.opacity = "0";

    // de kaart is beoordeeld: uit de stapel halen
    stapel.pop();
    kaarten.pop();
    positioneer();

    setTimeout(function () {
      kaart.remove();
      bezig = false;

      if (naarRechts && isMatch(profiel)) {
        vierMatch(profiel);
      } else if (naarRechts) {
        toon("No luck — " + profiel.name + " hasn't liked you back (yet)");
      } else {
        toon(profiel.name + " skipped");
      }

      // volgende kaart aanvullen zodat de stapel gevuld blijft
      var nogNietGetoond = stapel.length - kaarten.length;
      if (nogNietGetoond > 0) {
        var nieuw = maakKaart(stapel[stapel.length - kaarten.length - 1]);
        el.stapel.insertBefore(nieuw, kaarten[0] || null);
        kaarten.unshift(nieuw);
      }
      positioneer();

      if (stapel.length === 0) {
        knoppenAan(false);
        toonEinde();
      } else {
        knoppenAan(true);
      }
    }, 420);
  }

  /* Willekeurig: wordt dit een match of niet? */
  function isMatch(profiel) {
    var kans = typeof profiel.matchChance === "number" ? profiel.matchChance : STANDAARDKANS;
    return Math.random() < Math.max(0, Math.min(1, kans));
  }

  /* --- matchscherm -------------------------------------------------- */

  function vierMatch(profiel) {
    matches.push(profiel);
    el.tellerAantal.textContent = String(matches.length);
    el.teller.classList.remove("pulse");
    void el.teller.offsetWidth;
    el.teller.classList.add("pulse");
    vulStrip();

    el.schermSub.textContent = "You and " + profiel.name + " liked each other";
    el.schermFoto.src = profiel.image;
    el.schermFoto.alt = "Photo of " + profiel.name;
    el.schermTekst.textContent =
      profiel.matchText || (profiel.name + " has not left a message yet.");
    el.toast.classList.remove("zichtbaar");   // geen oude melding onder het matchscherm
    el.scherm.hidden = false;
    strooiConfetti();
    el.verder.focus();
  }

  function vulStrip() {
    if (!matches.length) {
      el.strip.innerHTML = '<span class="matchstrip__leeg">No matches yet — swipe right to like</span>';
      return;
    }
    el.strip.innerHTML = matches.map(function (p) {
      return '<img src="' + veilig(p.image) + '" alt="' + veilig(p.name) + '" title="' + veilig(p.name) + '">';
    }).join("");
  }

  function strooiConfetti() {
    var kleuren = ["#ff4d79", "#8b5cf6", "#22e0a1", "#ffd76e", "#ffffff"];
    var html = "";
    for (var i = 0; i < 40; i++) {
      html += '<i style="left:' + (Math.random() * 100).toFixed(2) + "%;" +
              "background:" + kleuren[i % kleuren.length] + ";" +
              "animation-duration:" + (1.6 + Math.random() * 1.6).toFixed(2) + "s;" +
              "animation-delay:" + (Math.random() * 0.5).toFixed(2) + 's"></i>';
    }
    el.confetti.innerHTML = html;
  }

  function sluitMatch() {
    el.scherm.hidden = true;
    el.confetti.innerHTML = "";
  }

  /* --- einde van de stapel ------------------------------------------ */

  function toonEinde() {
    var namen = matches.map(function (p) { return p.name; }).join(", ");
    status(
      "<h2>That's everyone</h2>" +
      "<p>You got <strong>" + matches.length + "</strong> " +
      (matches.length === 1 ? "match" : "matches") + " out of " + alleProfielen.length + " profiles." +
      (namen ? "<br>" + veilig(namen) : "") + "</p>" +
      '<button class="tekstknop tekstknop--primair" id="knop-opnieuw" type="button">Start over</button>'
    );
    var opnieuw = document.getElementById("knop-opnieuw");
    if (opnieuw) opnieuw.addEventListener("click", function () { start(true); });
  }

  /* --- starten ------------------------------------------------------- */

  function start(resetMatches) {
    if (resetMatches) {
      matches = [];
      el.tellerAantal.textContent = "0";
    }
    vulStrip();
    stapel = schud(alleProfielen);   // willekeurige volgorde
    el.status.hidden = true;
    tekenStapel();
  }

  /* --- gebeurtenissen ------------------------------------------------ */

  el.nope.addEventListener("click", function () { beslis("nope"); });
  el.like.addEventListener("click", function () { beslis("like"); });
  el.shuffle.addEventListener("click", function () {
    if (bezig) return;
    start(false);
    toon("Deck reshuffled");
  });
  el.verder.addEventListener("click", sluitMatch);
  el.bericht.addEventListener("click", function () {
    sluitMatch();
    toon("Message sent — this is a demo 😉");
  });

  document.addEventListener("keydown", function (e) {
    if (!el.scherm.hidden) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        sluitMatch();
      }
      return;
    }
    if (e.key === "ArrowLeft")  { e.preventDefault(); beslis("nope"); }
    if (e.key === "ArrowRight") { e.preventDefault(); beslis("like"); }
  });

  /* --- opstarten ------------------------------------------------------ */

  vulStrip();
  knoppenAan(false);

  laadProfielen()
    .then(function (profielen) {
      if (!profielen.length) throw new Error("No profiles found in " + PROFIELMAP);
      alleProfielen = profielen;
      start(true);
    })
    .catch(function (fout) {
      console.error(fout);
      var lokaalBestand = location.protocol === "file:";
      status(
        "<h2>Could not load the profiles</h2>" +
        "<p>" + veilig(fout.message) + "</p>" +
        (lokaalBestand
          ? "<p>Browsers block reading JSON files over <code>file://</code>.<br>" +
            "Start a small web server in the project folder:<br><code>python3 -m http.server 8000</code><br>" +
            "and open <code>http://localhost:8000</code>.</p>"
          : "<p>Check that the <code>profiles/</code> folder and its <code>index.json</code> were published.</p>"),
        true
      );
    });
})();
