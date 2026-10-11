/* =========================================================
   Alfis Startseite – Einstellungen
   Hier änderst du alles: Name, Ort, Links, Trainingszeiten.
   Jeder Link braucht nur  { name: "…", url: "https://…" }.
   ========================================================= */

window.STARTSEITE = {
  name: "Alfi",

  // Ort für das Radwetter (Breiten- und Längengrad)
  ort: { name: "Moosburg", lat: 48.4706, lon: 11.9378 },

  // Ab wann das Radwetter als „gut“ gilt
  radwetter: {
    maxWind: 25,    // km/h Dauerwind
    maxRegen: 30,   // % Regenwahrscheinlichkeit
    minTemp: 8      // °C
  },

  // Links öffnen im selben Tab (false) oder in neuem Tab (true)
  neuerTab: false,

  rennrad: [
    { name: "Strava",  url: "https://www.strava.com/dashboard" },
    { name: "Komoot",  url: "https://www.komoot.com/de-de/discover" },
    { name: "Windy",   url: "https://www.windy.com/?48.471,11.938,10" },
    { name: "Rennrad Hoamat", url: "https://walterhansi.github.io/rennrad-hoamat/" }
  ],

  tischtennis: {
    links: [
      { name: "myTischtennis", url: "https://www.mytischtennis.de/" },
      { name: "BTTV",          url: "https://www.bttv.de/" }
    ],
    // Beispiel: { tag: "Dienstag", zeit: "19:00–21:00", ort: "Halle" }
    training: []
  },

  apps: [
    { name: "ao timer",  url: "https://walterhansi.github.io/timer/",     farbe: "#FF7A00" },
    { name: "ao Puls",   url: "https://walterhansi.github.io/intervals/", farbe: "#FF2E88" },
    { name: "ao Reader", url: "https://walterhansi.github.io/ao-reader/", farbe: "#FFB000" }
  ],

  // Link-Gruppen unten. farbe: blau, mint, violett, gelb, pink, orange
  gruppen: [
    {
      titel: "Google", farbe: "blau",
      links: [
        { name: "Gmail",     url: "https://mail.google.com/" },
        { name: "Kalender",  url: "https://calendar.google.com/" },
        { name: "Drive",     url: "https://drive.google.com/" },
        { name: "Keep",      url: "https://keep.google.com/" },
        { name: "Maps",      url: "https://maps.google.com/" }
      ]
    },
    {
      titel: "Nachrichten", farbe: "violett",
      links: [
        { name: "tagesschau", url: "https://www.tagesschau.de/" },
        { name: "BR24",       url: "https://www.br.de/nachrichten/" },
        { name: "heise",      url: "https://www.heise.de/" }
      ]
    },
    {
      titel: "Unterhaltung", farbe: "pink",
      links: [
        { name: "YouTube",     url: "https://www.youtube.com/" },
        { name: "ARD Mediathek", url: "https://www.ardmediathek.de/" },
        { name: "ZDF",         url: "https://www.zdf.de/" }
      ]
    },
    {
      titel: "Werkzeuge", farbe: "mint",
      links: [
        { name: "GitHub",  url: "https://github.com/walterhansi" },
        { name: "Claude",  url: "https://claude.ai/" },
        { name: "DeepL",   url: "https://www.deepl.com/translator" },
        { name: "Amazon",  url: "https://www.amazon.de/" }
      ]
    }
  ]
};
