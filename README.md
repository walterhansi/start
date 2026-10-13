# Alfis Startseite

Persönliche Browser-Startseite: https://walterhansi.github.io/start/

Dunkle Seite mit sechs Flächen. Fläche 1 zeigt Uhr, Datum und die Wettertabelle für die nächsten 24 Stunden (Moosburg). Die Flächen 2 bis 6 tragen je ein Thema mit Links.

## Ändern

Alles Einstellbare steht in **`config.js`**: Name, Ort, Grenzwerte der Wetter-Ampel und die Links der Flächen. Jede Linkzeile hat einen frei wählbaren Text und eine Schaltfläche (Text im Rahmen oder eine Strichzeichnung).

## Aufbau

- `index.html`, `style.css` – Seite und Design (Breiten: ab 1100 px drei Spalten, ab 600 px zwei, darunter eine)
- `config.js` – Einstellungen und Links
- `logik.js` – Auswertung der Wetterdaten (Stundenzuordnung, Regendauer, Ampel)
- `app.js` – Anzeige

## Wetter

- Daten: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0), zuerst mit den ICON-Modellen des DWD, sonst Open-Meteo-Standard.
- Regenmenge und Regenwahrscheinlichkeit gelten bei Open-Meteo für die vorangegangene Stunde. Die Spalte „19“ (19 bis 20 Uhr) zeigt deshalb den Wert mit Zeitstempel 20:00.
- Regendauer: Anzahl der Viertelstunden mit mindestens `regenSchwelle` mm Regen mal 15, daher nur 0, 15, 30, 45 oder 60 Minuten.
- Ampel: rot gewinnt vor gelb, sonst grün. Die Regendauer zählt nicht mit.
