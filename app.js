/* Alfis Startseite – Anzeige: Uhr, Flächen, Wettertabelle */
(function () {
  "use strict";

  var C = window.STARTSEITE;
  var L = window.Logik;
  var NS = "http://www.w3.org/2000/svg";
  var CACHE = "start-wetter-v1";
  var BASIS = "https://api.open-meteo.com/v1/forecast";
  var SPALTENBREITE = 54;

  /* ---------- kleine Helfer ---------- */

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function svgMit(innen) {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = innen; // nur feste Zeichnungen aus diesem Skript
    return s;
  }

  function symbol(pfad) { return svgMit('<path d="' + pfad + '"/>'); }

  var PFAD = {
    links: "M15 6l-6 6 6 6",
    rechts: "M9 6l6 6-6 6",
    gut: "M5 12l5 5L20 7",
    mittel: "M6 12h12",
    schlecht: "M6 6l12 12M18 6L6 18",
    pfeil: "M12 19V5M6 11l6-6 6 6",
    sonne: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
  };

  /* Strichzeichnungen für Schaltflächen (in config.js per Name auswählbar) */
  var ZEICHNUNG = {
    tischplatte: '<path d="M2.5 11h19M12 7.5V11M5.5 11l-1.2 7.5M18.5 11l1.2 7.5"/>',
    ball: '<circle cx="18" cy="6.5" r="2.6"/><path d="M3 18q7-13 12-9"/>',
    auto: '<path d="M3 15l2-6h14l2 6v3H3z"/><path d="M7 18v1.5M17 18v1.5"/><circle cx="7.5" cy="15" r=".7"/><circle cx="16.5" cy="15" r=".7"/>'
  };

  function zwei(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- Uhr, Datum, Begrüßung ---------- */

  var datumFormat = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  var letzteStunde = null;

  function gruss(h) {
    var g = h >= 5 && h < 11 ? "Guten Morgen" : h < 18 && h >= 11 ? "Guten Tag" : h >= 18 && h < 23 ? "Guten Abend" : "Gute Nacht";
    return g + ", " + C.name;
  }

  function tick() {
    var d = new Date();
    document.getElementById("uhr").textContent = zwei(d.getHours()) + ":" + zwei(d.getMinutes());
    document.getElementById("datum").textContent = datumFormat.format(d);
    document.getElementById("gruss").textContent = gruss(d.getHours());
    var stunde = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + "-" + d.getHours();
    if (letzteStunde !== null && stunde !== letzteStunde) ladeWetter();
    letzteStunde = stunde;
  }

  /* ---------- Flächen 2 bis 6 ---------- */

  /* Nur normale Webadressen als Link zulassen */
  function sicher(u) { return /^https?:\/\//i.test(u || "") ? u : "#"; }

  function baueFlaeche(f, nr) {
    var s = el("section", "t t" + nr);
    s.setAttribute("aria-label", f.titel + (f.hinweis ? " (" + f.hinweis + ")" : ""));
    var kopf = el("div", "kopf");
    kopf.appendChild(el("h2", "", f.titel));
    if (f.hinweis) kopf.appendChild(el("span", "hinweis", f.hinweis));
    s.appendChild(kopf);

    var links = f.links || [];
    links.forEach(function (l) {
      var z = el("div", "zeile");
      z.appendChild(el("span", "", l.text));
      var a = el("a", "knopf");
      a.href = sicher(l.url);
      a.setAttribute("aria-label", l.text + " öffnen");
      if (C.neuerTab) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      var k = l.knopf || { typ: "text", inhalt: "Öffnen" };
      if (k.typ === "zeichnung" && ZEICHNUNG[k.inhalt]) a.appendChild(svgMit(ZEICHNUNG[k.inhalt]));
      else a.textContent = k.inhalt;
      z.appendChild(a);
      s.appendChild(z);
    });
    if (!links.length) s.appendChild(el("div", "leer", "Noch keine Links"));
    return s;
  }

  function entferneFlaechen() {
    var raster = document.getElementById("raster");
    Array.prototype.slice.call(raster.querySelectorAll(".t:not(.t1)")).forEach(function (n) { raster.removeChild(n); });
    return raster;
  }

  function zeigeFlaechen(flaechen) {
    var raster = entferneFlaechen();
    (flaechen || []).slice(0, 5).forEach(function (f, i) { raster.appendChild(baueFlaeche(f, i + 2)); });
  }

  /* ---------- Links laden (links.json) ---------- */

  var LINKS_URL = "links.json";
  var LINKS_CACHE = "start-links-v1";
  // Frisch selbst gespeicherte Links haben so lange Vorrang vor der (evtl. noch alten) Datei von GitHub Pages
  var EIGENE_GUELTIG = 10 * 60 * 1000;

  function gueltig(d) { return !!d && Array.isArray(d.flaechen); }

  function leseLinksCache() {
    try {
      var c = JSON.parse(localStorage.getItem(LINKS_CACHE) || "null");
      if (c && gueltig(c.daten)) return c;
    } catch (e) { /* egal */ }
    return null;
  }

  function schreibeLinksCache(daten, eigen) {
    try { localStorage.setItem(LINKS_CACHE, JSON.stringify({ zeit: Date.now(), eigen: !!eigen, daten: daten })); } catch (e) { /* egal */ }
  }

  function ladeLinks() {
    return hole(LINKS_URL + "?v=" + Date.now()).then(function (d) {
      if (!gueltig(d)) throw new Error("links.json unlesbar");
      var c = leseLinksCache();
      if (c && c.eigen && Date.now() - c.zeit < EIGENE_GUELTIG) return c.daten;
      schreibeLinksCache(d, false);
      return d;
    }).catch(function (fehler) {
      var c = leseLinksCache();
      if (c) return c.daten;
      throw fehler;
    });
  }

  function zeigeLinksFehler(text) {
    var raster = entferneFlaechen();
    var s = el("section", "t t2");
    var m = el("p", "meldung", "Links gerade nicht erreichbar (" + text + ").");
    var b = el("button", "", "Neu laden");
    b.type = "button";
    b.addEventListener("click", startLinks);
    m.appendChild(b);
    s.appendChild(m);
    raster.appendChild(s);
  }

  function startLinks() {
    ladeLinks().then(function (d) {
      Start.daten = d;
      zeigeFlaechen(d.flaechen);
    }, function (e) {
      zeigeLinksFehler(e && e.message ? e.message : "unbekannt");
    });
  }

  /* Schnittstelle für den Bearbeiten-Modus (editor.js) */
  var Start = window.Start = {
    daten: null,
    zeichnungen: Object.keys(ZEICHNUNG),
    zeigeFlaechen: zeigeFlaechen,
    laden: startLinks,
    merkeEigene: function (d) { schreibeLinksCache(d, true); Start.daten = d; }
  };

  /* ---------- Wetter laden ---------- */

  var wetterBox = document.getElementById("wetter");
  var fuss = document.getElementById("fuss");
  var letzterAbruf = 0;
  var laedt = false;

  function url(mitModell) {
    return BASIS + "?latitude=" + C.ort.lat + "&longitude=" + C.ort.lon +
      "&hourly=temperature_2m,cloud_cover,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,sunshine_duration" +
      "&minutely_15=precipitation&current=temperature_2m" +
      (mitModell ? "&models=icon_seamless" : "") +
      "&timezone=Europe%2FBerlin&forecast_days=3&wind_speed_unit=kmh";
  }

  function hole(adresse) {
    var abbruch = new AbortController();
    var timer = setTimeout(function () { abbruch.abort(); }, 15000);
    return fetch(adresse, { signal: abbruch.signal }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (daten) {
        if (!r.ok || daten.error) throw new Error(daten.reason || ("HTTP " + r.status));
        return daten;
      });
    }).then(function (d) { clearTimeout(timer); return d; }, function (e) { clearTimeout(timer); throw e; });
  }

  function hatWahrscheinlichkeit(d) {
    var p = d && d.hourly && d.hourly.precipitation_probability;
    return !!p && p.some(function (v) { return typeof v === "number"; });
  }

  /* Zuerst mit den ICON-Modellen; fehlt dabei die Regenwahrscheinlichkeit,
     einmal ohne Modellwahl (Open-Meteo wählt dann selbst) versuchen. */
  function holeDaten() {
    return hole(url(true)).then(function (d) {
      if (hatWahrscheinlichkeit(d)) return d;
      return hole(url(false)).then(function (d2) { return hatWahrscheinlichkeit(d2) ? d2 : d; }, function () { return d; });
    });
  }

  function speichere(daten) {
    try { localStorage.setItem(CACHE, JSON.stringify({ zeit: Date.now(), daten: daten })); } catch (e) { /* egal */ }
  }

  function lies() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE) || "null");
      if (c && c.daten && Date.now() - c.zeit < 6 * 3600 * 1000) return c;
    } catch (e) { /* egal */ }
    return null;
  }

  function ladeWetter() {
    if (laedt) return;
    laedt = true;
    holeDaten().then(function (daten) {
      letzterAbruf = Date.now();
      speichere(daten);
      zeigeWetter(L.baueSpalten(daten, C, 24), false, new Date());
    }).catch(function (fehler) {
      var c = lies();
      if (c) {
        try { zeigeWetter(L.baueSpalten(c.daten, C, 24), true, new Date(c.zeit)); return; } catch (e) { /* weiter */ }
      }
      zeigeFehler(fehler && fehler.message ? fehler.message : "unbekannt");
    }).then(function () { laedt = false; }, function () { laedt = false; });
  }

  function zeigeFehler(text) {
    wetterBox.textContent = "";
    var m = el("p", "meldung", "Wetter gerade nicht erreichbar (" + text + ").");
    var b = el("button", "", "Neu laden");
    b.type = "button";
    b.addEventListener("click", ladeWetter);
    m.appendChild(b);
    wetterBox.appendChild(m);
  }

  /* ---------- Wettertabelle ---------- */

  function windZelle(s) {
    var f = document.createDocumentFragment();
    if (s.windGrad !== null) {
      var p = el("span", "pfeil");
      p.appendChild(symbol(PFAD.pfeil));
      p.style.transform = "rotate(" + Math.round(s.windGrad + 180) + "deg)";
      p.title = "Wind aus " + Math.round(s.windGrad) + "°";
      f.appendChild(p);
    }
    f.appendChild(document.createTextNode(L.formatGanz(s.windKmh)));
    return f;
  }

  function ampelZelle(s) {
    var klasse = s.ampel || "keine";
    var info = { top: ["besonders gut", PFAD.gut], gruen: ["gut", PFAD.gut], gelb: ["geht so", PFAD.mittel], rot: ["schlecht", PFAD.schlecht], keine: ["unbekannt", PFAD.mittel] }[klasse];
    var a = el("span", "am " + klasse);
    a.setAttribute("role", "img");
    a.setAttribute("aria-label", "Eignung: " + info[0]);
    a.title = info[0];
    a.appendChild(symbol(info[1]));
    return a;
  }

  var ZEILEN = [
    ["Sonne min", function (s) { return s.sonneMin === null ? "–" : String(s.sonneMin); }, PFAD.sonne],
    ["Wolken %", function (s) { return L.formatGanz(s.wolken); }],
    ["Temperatur °C", function (s) { return s.temp === null ? "–" : Math.round(s.temp) + "°"; }],
    ["Regen %", function (s) { return L.formatGanz(s.regenProzent); }],
    ["Regen mm", function (s) { return L.formatMm(s.regenMm); }],
    ["Regendauer min", function (s) { return s.regenMin === null ? "–" : String(s.regenMin); }],
    ["Wind km/h", windZelle],
    ["Eignung", ampelZelle]
  ];

  function zeigeWetter(res, gespeichert, stand) {
    var sp = res.spalten;
    var tabelle = el("table");
    tabelle.appendChild(el("caption", "sr", "Wetter in " + C.ort.name + " für die nächsten 24 Stunden"));

    var kopf = el("thead");
    var kz = el("tr");
    var eck = el("th", "zl", "Uhr");
    eck.scope = "col";
    kz.appendChild(eck);
    sp.forEach(function (s, i) {
      var th = el("th", (i === 0 ? "jetzt " : "") + (s.tagWechsel ? "tag" : ""));
      th.scope = "col";
      th.appendChild(document.createTextNode(String(s.stunde)));
      th.appendChild(el("small", "", s.label));
      kz.appendChild(th);
    });
    kopf.appendChild(kz);
    tabelle.appendChild(kopf);

    var koerper = el("tbody");
    ZEILEN.forEach(function (z) {
      var tr = el("tr");
      var th = el("th", "zl");
      th.scope = "row";
      if (z[2]) {
        var ic = el("span", "zi");
        ic.appendChild(symbol(z[2]));
        th.appendChild(ic);
      }
      th.appendChild(document.createTextNode(z[0]));
      tr.appendChild(th);
      sp.forEach(function (s, i) {
        var td = el("td", (i === 0 ? "jetzt " : "") + (s.tagWechsel ? "tag" : ""));
        var inhalt = z[1](s);
        if (typeof inhalt === "string") td.textContent = inhalt;
        else td.appendChild(inhalt);
        tr.appendChild(td);
      });
      koerper.appendChild(tr);
    });
    tabelle.appendChild(koerper);

    wetterBox.textContent = "";
    wetterBox.appendChild(tabelle);

    fuss.textContent = "";
    fuss.appendChild(document.createTextNode(C.ort.name + " · Wetterdaten: "));
    var a = el("a", "", "Open-Meteo.com");
    a.href = "https://open-meteo.com/";
    if (C.neuerTab) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    fuss.appendChild(a);
    fuss.appendChild(document.createTextNode(" · Stand " + zwei(stand.getHours()) + ":" + zwei(stand.getMinutes()) + (gespeichert ? " (gespeichert, offline)" : "")));
  }

  /* ---------- Start ---------- */

  function start() {
    var l = document.getElementById("links");
    var r = document.getElementById("rechts");
    l.appendChild(symbol(PFAD.links));
    r.appendChild(symbol(PFAD.rechts));
    l.addEventListener("click", function () { wetterBox.scrollBy({ left: -SPALTENBREITE * 6, behavior: "smooth" }); });
    r.addEventListener("click", function () { wetterBox.scrollBy({ left: SPALTENBREITE * 6, behavior: "smooth" }); });

    startLinks();

    wetterBox.appendChild(el("p", "meldung", "Wetter lädt …"));
    tick();
    setInterval(tick, 1000);
    ladeWetter();
    setInterval(ladeWetter, 15 * 60 * 1000);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && Date.now() - letzterAbruf > 10 * 60 * 1000) ladeWetter();
    });
  }

  start();
})();
