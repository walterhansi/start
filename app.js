/* Alfis Startseite – Logik */
(function () {
  "use strict";
  const C = window.STARTSEITE || {};
  const $ = (id) => document.getElementById(id);
  const ziel = C.neuerTab ? ' target="_blank" rel="noopener"' : "";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function favicon(url, name) {
    let host = "";
    try { host = new URL(url).hostname; } catch (e) { /* ungültige Adresse */ }
    const buchstabe = esc((name || "?").trim().charAt(0).toUpperCase());
    if (!host) return `<span class="fav">${buchstabe}</span>`;
    const src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
    return `<span class="fav"><img src="${src}" alt="" loading="lazy" onerror="this.parentNode.textContent='${buchstabe}'"></span>`;
  }
  const link = (l) => `<li><a href="${esc(l.url)}"${ziel}>${favicon(l.url, l.name)}${esc(l.name)}</a></li>`;

  /* ---------- Uhr und Begrüßung ---------- */
  const fmtDatum = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  function tick() {
    const d = new Date();
    const h = d.getHours();
    const gruss = h < 5 ? "Gute Nacht" : h < 11 ? "Guten Morgen" : h < 18 ? "Guten Tag" : h < 23 ? "Guten Abend" : "Gute Nacht";
    $("gruss").textContent = `${gruss}, ${C.name || ""}`.replace(/, $/, "");
    $("uhr").textContent = `${String(h).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    $("datum").textContent = fmtDatum.format(d);
    markiereTraining(d);
  }

  /* ---------- Kacheln füllen ---------- */
  $("rennrad").innerHTML = (C.rennrad || []).map(link).join("");
  const tt = C.tischtennis || {};
  $("tischtennis").innerHTML = (tt.links || []).map(link).join("");
  const training = tt.training || [];
  if (training.length) {
    $("training").innerHTML = training.map((t) =>
      `<li data-tag="${esc(t.tag)}"><span>${esc(t.tag)}</span><span>${esc(t.zeit)}${t.ort ? " · " + esc(t.ort) : ""}</span></li>`).join("");
  } else {
    $("training").remove();
  }
  function markiereTraining(d) {
    const heute = d.toLocaleDateString("de-DE", { weekday: "long" }).toLowerCase();
    document.querySelectorAll("#training li").forEach((li) =>
      li.classList.toggle("heute", (li.dataset.tag || "").toLowerCase() === heute));
  }

  $("apps").innerHTML = (C.apps || []).map((a) => {
    const kurz = esc(a.name.replace(/^ao\s*/i, "").charAt(0).toUpperCase());
    return `<li><a href="${esc(a.url)}"${ziel}><span class="logo" style="background:${esc(a.farbe || "#FF7A00")}">ao${kurz}</span>${esc(a.name)}</a></li>`;
  }).join("");

  const farben = { blau: "#2F6BFF", mint: "#00C9A7", violett: "#7B3FF2", gelb: "#FFD000", pink: "#FF2E88", orange: "#FF7A00" };
  $("gruppen").innerHTML = (C.gruppen || []).map((g) =>
    `<section class="kachel gruppe" style="--farbe:${esc(farben[g.farbe] || g.farbe || farben.blau)}">
      <h2>${esc(g.titel)}</h2><ul>${(g.links || []).map(link).join("")}</ul></section>`).join("");

  tick();
  setInterval(tick, 1000 * 15);

  // Suchfeld nur am Computer automatisch aktivieren (auf dem Handy würde sonst die Tastatur aufspringen)
  if (window.matchMedia("(pointer: fine)").matches) document.querySelector(".suche input").focus();

  /* ---------- Radwetter (Open-Meteo, ohne Anmeldung) ---------- */
  const ort = C.ort || { name: "", lat: 48.47, lon: 11.94 };
  const grenze = Object.assign({ maxWind: 25, maxRegen: 30, minTemp: 8 }, C.radwetter || {});
  $("ort").textContent = ort.name ? "· " + ort.name : "";

  const richtungen = ["Nord", "Nordost", "Ost", "Südost", "Süd", "Südwest", "West", "Nordwest"];
  const ausRichtung = (grad) => richtungen[Math.round(grad / 45) % 8];
  const uhrzeit = (iso) => iso.slice(11, 16);

  async function ladeWetter() {
    const speicher = "radwetter-v2";
    let daten = null;
    try {
      const alt = JSON.parse(localStorage.getItem(speicher) || "null");
      if (alt && alt.lat === ort.lat && alt.lon === ort.lon && Date.now() - alt.zeit < 20 * 60 * 1000) daten = alt.daten;
    } catch (e) { /* kein Speicher verfügbar */ }

    if (!daten) {
      const url = "https://api.open-meteo.com/v1/forecast?latitude=" + ort.lat + "&longitude=" + ort.lon +
        "&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,is_day" +
        "&hourly=temperature_2m,precipitation_probability,precipitation,cloud_cover,wind_speed_10m,wind_gusts_10m,is_day" +
        "&daily=sunrise,sunset&timezone=Europe%2FBerlin&forecast_days=2&wind_speed_unit=kmh";
      const antwort = await fetch(url);
      if (!antwort.ok) throw new Error("HTTP " + antwort.status);
      daten = await antwort.json();
      try { localStorage.setItem(speicher, JSON.stringify({ zeit: Date.now(), lat: ort.lat, lon: ort.lon, daten })); } catch (e) { /* egal */ }
    }
    zeigeWetter(daten);
  }

  function stundeOk(t, regen, wind, tag) {
    return tag && t >= grenze.minTemp && regen <= grenze.maxRegen && wind <= grenze.maxWind;
  }

  function zeigeWetter(d) {
    const c = d.current, h = d.hourly;
    $("temp").textContent = Math.round(c.temperature_2m) + "°";
    $("wind").textContent = Math.round(c.wind_speed_10m) + " km/h aus " + ausRichtung(c.wind_direction_10m);
    $("windpfeil").style.transform = `rotate(${(c.wind_direction_10m + 180) % 360}deg)`;
    $("boeen").textContent = Math.round(c.wind_gusts_10m) + " km/h";

    // Index der aktuellen Stunde
    const jetzt = c.time.slice(0, 13);
    let start = h.time.findIndex((t) => t.slice(0, 13) === jetzt);
    if (start < 0) start = 0;
    $("regen").textContent = (h.precipitation_probability[start] ?? 0) + " %";

    const heute = c.time.slice(0, 10);
    const tagIdx = d.daily.time.indexOf(heute);
    const sonnenuntergang = d.daily.sunset[tagIdx >= 0 ? tagIdx : 0];
    $("sonne").textContent = uhrzeit(sonnenuntergang) + " Uhr";

    // Ampel für jetzt
    const regenJetzt = h.precipitation_probability[start] ?? 0;
    const ampel = $("ampel");
    let klasse, text;
    if (!c.is_day) { klasse = "dunkel"; text = "Dunkel draußen"; }
    else if (stundeOk(c.temperature_2m, regenJetzt, c.wind_speed_10m, true)) { klasse = "gut"; text = "Gutes Radwetter"; }
    else {
      const fehler = [c.temperature_2m < grenze.minTemp - 4, regenJetzt > grenze.maxRegen + 30, c.wind_speed_10m > grenze.maxWind + 10].filter(Boolean).length;
      klasse = fehler ? "schlecht" : "mittel";
      text = fehler ? "Eher nicht" : "Geht so";
    }
    ampel.className = "ampel " + klasse;
    ampel.textContent = text;

    // Bestes Zeitfenster in den nächsten 24 Stunden (mind. 2 Stunden am Stück)
    let bester = null, lauf = null;
    for (let i = start; i < Math.min(start + 24, h.time.length); i++) {
      const ok = stundeOk(h.temperature_2m[i], h.precipitation_probability[i] ?? 0, h.wind_speed_10m[i], h.is_day[i]);
      if (ok) { lauf = lauf ? { von: lauf.von, bis: i } : { von: i, bis: i }; }
      if ((!ok || i === Math.min(start + 24, h.time.length) - 1) && lauf) {
        if (!bester || lauf.bis - lauf.von > bester.bis - bester.von) bester = lauf;
        lauf = null;
      }
    }
    const fenster = $("fenster");
    if (bester && bester.bis - bester.von >= 1) {
      const tagText = h.time[bester.von].slice(0, 10) === heute ? "Heute" : "Morgen";
      const bis = new Date(h.time[bester.bis]); bis.setHours(bis.getHours() + 1);
      fenster.innerHTML = `Bestes Fenster: <b>${tagText} ${uhrzeit(h.time[bester.von])}–${String(bis.getHours()).padStart(2, "0")}:00 Uhr</b>`;
    } else {
      fenster.textContent = "In den nächsten 24 Stunden kein Fenster mit gutem Radwetter.";
    }

    // Stundenleiste
    const li = [];
    const ende = Math.min(start + 12, h.time.length);
    const mengen = h.precipitation.slice(start, ende).map((m) => m || 0);
    const skala = Math.max(2, ...mengen); // Säule voll = mindestens 2 mm
    const mm = (m) => m >= 10 ? Math.round(m) : m.toFixed(1).replace(".", ",");
    for (let i = start; i < ende; i++) {
      const regen = h.precipitation_probability[i] ?? 0;
      const menge = h.precipitation[i] || 0;
      const wolken = h.cloud_cover[i] ?? 0;
      const ok = stundeOk(h.temperature_2m[i], regen, h.wind_speed_10m[i], h.is_day[i]);
      li.push(`<li class="${ok ? "ok" : ""} ${h.is_day[i] ? "" : "nacht"}" title="${uhrzeit(h.time[i])} Uhr: ${Math.round(h.temperature_2m[i])}°, Regen ${mm(menge)} mm (${regen} %), Wolken ${wolken} %, Wind ${Math.round(h.wind_speed_10m[i])} km/h">
        <span class="h">${h.time[i].slice(11, 13)}</span>
        <span class="t">${Math.round(h.temperature_2m[i])}°</span>
        <span class="saeule"><i style="height:${menge > 0 ? Math.max(menge / skala * 100, 6) : 0}%"></i><b class="${menge / skala > .8 ? "hell" : ""}">${menge > 0 ? mm(menge) : "–"}</b></span>
        <span class="p">${regen}</span>
        <span class="c"><span class="wolke" style="--w:${wolken}%"></span>${wolken}</span>
        <span class="w">${Math.round(h.wind_speed_10m[i])}</span></li>`);
    }
    $("stunden").innerHTML = li.join("");
  }

  function wetterLaden() {
    ladeWetter().catch(() => {
      $("ampel").className = "ampel";
      $("ampel").textContent = "Wetter nicht erreichbar";
      $("fenster").textContent = "Neuer Versuch in 10 Minuten.";
    });
  }
  wetterLaden();
  setInterval(wetterLaden, 10 * 60 * 1000);

  /* ---------- Offline-Unterstützung ---------- */
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
