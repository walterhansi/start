/* =========================================================
   Alfis Startseite – Einstellungen
   Hier änderst du: Name, Ort, Ampel-Grenzen und das Ziel für das Speichern.
   Die Links der Flächen stehen in links.json und lassen sich auf der Seite
   selbst ändern (Stift-Symbol unten rechts).
   ========================================================= */

window.STARTSEITE = {
  name: "Alfi",

  // Ort für die Wettertabelle (85368 Moosburg an der Isar)
  ort: { name: "Moosburg", lat: 48.47, lon: 11.94 },

  // Links im selben Tab (false) oder in neuem Tab (true) öffnen
  neuerTab: false,

  // Regen: ab dieser Menge pro Viertelstunde zählt sie als Regenzeit (mm)
  regenSchwelle: 0.1,

  // Eignung für draußen. Rot gewinnt vor gelb, sonst grün.
  ampel: {
    rot:  { regenMm: 1,   regenProzent: 60, windKmh: 35, tempUnter: 5 },
    gelb: { regenMm: 0.3, regenProzent: 30, windKmh: 25, tempUnter: 10 }
  },

  // „Besonders geeignet“ (dunkelgrüner Haken): nur wenn die Stunde grün ist UND
  // Sonne mindestens so viele Minuten, Regen höchstens so viel mm, Regendauer höchstens so viele Minuten.
  ampelTop: { sonneMinMin: 60, regenMmMax: 0, regenMinMax: 0 },

  // Wohin der Bearbeiten-Modus die Links speichert (GitHub-Repo, Datei links.json)
  github: { besitzer: "walterhansi", repo: "start", branch: "main", datei: "links.json" }
};
