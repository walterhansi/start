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

  /* ---------- Google Kalender ---------- */
  // Die Kalender-Adresse steht nicht in der öffentlichen config.js,
  // sondern wird pro Browser einmal eingegeben und nur dort gespeichert.
  const KAL = "kalender-adresse";
  const lies = () => { try { return localStorage.getItem(KAL) || ""; } catch (e) { return ""; } };
  const schreib = (v) => { try { v ? localStorage.setItem(KAL, v) : localStorage.removeItem(KAL); } catch (e) { /* egal */ } };
  if (C.neuerTab) $("kal-oeffnen").target = "_blank";

  function zeigeKalender() {
    const box = $("kalender");
    const ids = [...(C.kalender || []), ...lies().split(",")].map((x) => x.trim()).filter(Boolean);
    if (!ids.length) {
      box.innerHTML = `<form class="kal-form" id="kal-form">
          <p>Gib einmal die E-Mail-Adresse deines Google-Kontos ein. Sie bleibt nur in diesem Browser gespeichert und landet nicht im Internet.</p>
          <div><input type="email" id="kal-id" placeholder="name@gmail.com" required aria-label="Google-Adresse">
          <button type="submit">Kalender anzeigen</button></div></form>`;
      $("kal-form").addEventListener("submit", (e) => { e.preventDefault(); schreib($("kal-id").value.trim()); zeigeKalender(); });
      return;
    }
    const src = ids.map((id) => "src=" + encodeURIComponent(id)).join("&");
    const url = "https://calendar.google.com/calendar/embed?" + src +
      "&ctz=Europe%2FBerlin&hl=de&wkst=2&mode=AGENDA&showTitle=0&showPrint=0&showCalendars=0&showTz=0&showTabs=1&showNav=1";
    box.innerHTML = `<iframe src="${url}" title="Google Kalender" loading="lazy"></iframe>
      ${lies() ? '<button type="button" class="kal-aendern" id="kal-aendern">Andere Adresse eingeben</button>' : ""}`;
    const aendern = $("kal-aendern");
    if (aendern) aendern.addEventListener("click", () => { schreib(""); zeigeKalender(); });
  }
  zeigeKalender();

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

    // Index der aktuellen Stunde (nach der Uhr des Geräts, nicht nach dem Zeitstempel der Daten)
    const n = new Date();
    const zwei = (x) => String(x).padStart(2, "0");
    const jetzt = `${n.getFullYear()}-${zwei(n.getMonth() + 1)}-${zwei(n.getDate())}T${zwei(n.getHours())}`;
    let start = h.time.findIndex((t) => t.slice(0, 13) === jetzt);
    if (start < 0) start = 0;
    $("regen").textContent = (h.precipitation_probability[start] ?? 0) + " %";

    const heute = jetzt.slice(0, 10);
    const tagIdx = d.daily.time.indexOf(heute);
    const sonnenuntergang = d.daily.sunset[tagIdx >= 0 ? tagIdx : 0];
    $("sonne").textContent = uhrzeit(sonnenuntergang) + " Uhr";

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
    // Ampel für jetzt – mit Grund
    const regenJetzt = h.precipitation_probability[start] ?? 0;
    const tempJetzt = Math.round(c.temperature_2m);
    const gruende = [];
    if (c.temperature_2m < grenze.minTemp) gruende.push(`Zu kalt (${tempJetzt}°)`);
    if (regenJetzt > grenze.maxRegen) gruende.push(`Regen ${regenJetzt} %`);
    if (c.wind_speed_10m > grenze.maxWind) gruende.push(`Wind ${Math.round(c.wind_speed_10m)} km/h`);
    const spaeterHeute = bester && h.time[bester.von].slice(0, 10) === heute && bester.von > start;
    const ampel = $("ampel");
    let klasse, text;
    if (!c.is_day) { klasse = "dunkel"; text = "Dunkel draußen"; }
    else if (!gruende.length) { klasse = "gut"; text = "Gutes Radwetter"; }
    else if (spaeterHeute) { klasse = "mittel"; text = `${gruende[0]}, ab ${h.time[bester.von].slice(11, 13)} Uhr gut`; }
    else {
      const stark = c.temperature_2m < grenze.minTemp - 4 || regenJetzt > grenze.maxRegen + 30 || c.wind_speed_10m > grenze.maxWind + 10;
      klasse = stark ? "schlecht" : "mittel";
      text = gruende.join(", ");
    }
    ampel.className = "ampel " + klasse;
    ampel.textContent = text;

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
