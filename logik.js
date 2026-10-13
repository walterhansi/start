/* Rechenlogik der Wettertabelle (ohne Bildschirm-Teile, deshalb einzeln testbar). */
(function (root) {
  "use strict";

  var TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  function tagKurz(zeit) {
    var t = zeit.slice(0, 10).split("-");
    return TAGE[new Date(Date.UTC(+t[0], +t[1] - 1, +t[2])).getUTCDay()];
  }

  function zahl(v) {
    return typeof v === "number" && isFinite(v) ? v : null;
  }

  function ampel(s, cfg) {
    var werte = [s.regenMm, s.regenProzent, s.windKmh, s.temp];
    if (werte.every(function (w) { return w === null; })) return null;
    function trifft(g) {
      return (s.regenMm !== null && s.regenMm >= g.regenMm) ||
             (s.regenProzent !== null && s.regenProzent >= g.regenProzent) ||
             (s.windKmh !== null && s.windKmh >= g.windKmh) ||
             (s.temp !== null && s.temp < g.tempUnter);
    }
    if (trifft(cfg.ampel.rot)) return "rot";
    if (trifft(cfg.ampel.gelb)) return "gelb";
    return "gruen";
  }

  /* Minuten mit Regen in der Stunde, die bei hourly.time[i] beginnt.
     Die 15-Minuten-Werte sind Summen der jeweils vorangegangenen 15 Minuten,
     also gehören die vier Einträge NACH dem Zeitstempel zu dieser Stunde. */
  function regenMinuten(m15, startZeit, schwelle) {
    if (!m15 || !m15.time || !m15.precipitation) return null;
    var j = m15.time.indexOf(startZeit);
    if (j < 0 || j + 4 >= m15.time.length) return null;
    var n = 0, bekannt = 0;
    for (var k = 1; k <= 4; k++) {
      var p = zahl(m15.precipitation[j + k]);
      if (p === null) continue;
      bekannt++;
      if (p >= schwelle - 1e-9) n++;
    }
    return bekannt === 0 ? null : n * 15;
  }

  function jetztAusDaten(daten) {
    if (daten.current && typeof daten.current.time === "string") return daten.current.time;
    var teile = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).format(new Date());
    return teile.replace(" ", "T");
  }

  /* Aus der Open-Meteo-Antwort die 24 Spalten ab der aktuellen Stunde bauen.
     Niederschlag und Regenwahrscheinlichkeit sind bei Open-Meteo Werte der
     vorangegangenen Stunde: für die Spalte „19 Uhr“ (19 bis 20 Uhr) gilt also
     der Eintrag mit dem Zeitstempel 20:00. */
  function baueSpalten(daten, cfg, anzahl) {
    anzahl = anzahl || 24;
    var h = daten && daten.hourly;
    if (!h || !h.time || !h.time.length) throw new Error("Keine Stundendaten in der Antwort");
    var jetzt = jetztAusDaten(daten);
    var stundeStart = jetzt.slice(0, 13) + ":00";
    var start = -1;
    for (var i = 0; i < h.time.length; i++) {
      if (h.time[i] >= stundeStart) { start = i; break; }
    }
    if (start < 0 || start + anzahl >= h.time.length) throw new Error("Zu wenige Stundendaten");

    var spalten = [];
    for (var n = 0; n < anzahl; n++) {
      var idx = start + n;
      var zeit = h.time[idx];
      var stunde = +zeit.slice(11, 13);
      var s = {
        zeit: zeit,
        stunde: stunde,
        label: n === 0 ? "Jetzt" : (stunde === 0 ? tagKurz(zeit) : ""),
        tagWechsel: stunde === 0 && n > 0,
        wolken: zahl(h.cloud_cover && h.cloud_cover[idx]),
        temp: zahl(h.temperature_2m && h.temperature_2m[idx]),
        regenProzent: zahl(h.precipitation_probability && h.precipitation_probability[idx + 1]),
        regenMm: zahl(h.precipitation && h.precipitation[idx + 1]),
        regenMin: regenMinuten(daten.minutely_15, zeit, cfg.regenSchwelle),
        windKmh: zahl(h.wind_speed_10m && h.wind_speed_10m[idx]),
        windGrad: zahl(h.wind_direction_10m && h.wind_direction_10m[idx])
      };
      s.ampel = ampel(s, cfg);
      spalten.push(s);
    }
    return { spalten: spalten, jetzt: jetzt };
  }

  function formatMm(v) {
    if (v === null) return "–";
    if (v === 0) return "0";
    var r = Math.round(v * 10) / 10;
    if (r === 0) return "<0,1";
    return String(r).replace(".", ",");
  }

  function formatGanz(v) {
    return v === null ? "–" : String(Math.round(v));
  }

  var api = {
    baueSpalten: baueSpalten, ampel: ampel, regenMinuten: regenMinuten,
    formatMm: formatMm, formatGanz: formatGanz, tagKurz: tagKurz
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Logik = api;
})(typeof window !== "undefined" ? window : this);
