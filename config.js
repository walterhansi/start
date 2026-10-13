/* =========================================================
   Alfis Startseite – Einstellungen
   Hier änderst du alles: Name, Ort, Ampel-Grenzen, Flächen und Links.

   Jede Linkzeile:  { text: "Text links", url: "https://…",
                      knopf: { typ: "text", inhalt: "Text im Knopf" } }
   oder mit Zeichnung:  knopf: { typ: "zeichnung", inhalt: "auto" }
   Zeichnungen: tischplatte, ball, auto
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

  // Fläche 1 (blau) ist fest: Uhr und Wetter.
  // Flächen 2 bis 6 in der Reihenfolge der Anordnung.
  flaechen: [
    {
      titel: "Tischtennis",
      links: [
        {
          text: "SG Moosburg 2",
          url: "https://www.mytischtennis.de/click-tt/ByTTV/26--27/ligen/Erwachsene_Bezirksklasse_C_Gruppe_4_ED--FS_West_(Bayerischer_TTV_-_Oberbayern-Nord)/gruppe/523835/tabelle/gesamt",
          knopf: { typ: "text", inhalt: "clickTT" }
        },
        {
          text: "SG Moosburg 3",
          url: "https://www.mytischtennis.de/click-tt/ByTTV/26--27/ligen/Bezirksklasse_D_Gruppe_5_ED--FS_Ost/gruppe/523944/tabelle/gesamt",
          knopf: { typ: "text", inhalt: "clickTT" }
        }
      ]
    },
    { titel: "Thema folgt", hinweis: "Fläche 3", links: [] },
    { titel: "Thema folgt", hinweis: "Fläche 4", links: [] },
    { titel: "Thema folgt", hinweis: "Fläche 5", links: [] },
    { titel: "Thema folgt", hinweis: "Fläche 6", links: [] }
  ]
};
