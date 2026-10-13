# Alfis Startseite

Persönliche Browser-Startseite: https://walterhansi.github.io/start/

Dunkle Seite mit sechs Flächen. Fläche 1 zeigt Uhr, Datum und die Wettertabelle für die nächsten 24 Stunden (Moosburg). Die Flächen 2 bis 6 tragen je ein Thema mit Links.

## Links ändern

**Auf der Seite selbst:** Stift-Symbol unten rechts. Im Bearbeiten-Modus lassen sich Flächentitel und Links ändern, hinzufügen, löschen und verschieben. „Speichern“ schreibt die Datei `links.json` per GitHub-Schnittstelle ins Repo. Auf anderen Geräten ist die Änderung nach etwa einer Minute sichtbar (GitHub Pages braucht einen Moment).

Einmal pro Gerät und Browser wird ein GitHub-Token abgefragt:

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Repository access: nur `walterhansi/start`.
3. Repository permissions: **Contents: Read and write**.
4. Token kopieren und im Bearbeiten-Modus einfügen. Es liegt nur im `localStorage` dieses Browsers (nicht im Repo). „Token ändern“ in der Leiste ersetzt es.

**Von Hand:** `links.json` im Repo bearbeiten. Jede Linkzeile hat `text`, `url` und `knopf` (`{ "typ": "text", "inhalt": "clickTT" }` oder `{ "typ": "zeichnung", "inhalt": "auto" }`). Zeichnungen: `tischplatte`, `ball`, `auto`. Adressen müssen mit `http://` oder `https://` beginnen.

## Einstellungen

In **`config.js`**: Name, Ort, Grenzwerte der Wetter-Ampel und das Speicherziel für den Bearbeiten-Modus.

## Aufbau

- `index.html`, `style.css` – Seite und Design (Breiten: ab 1100 px drei Spalten, ab 600 px zwei, darunter eine)
- `config.js` – Einstellungen
- `links.json` – Flächentitel und Links
- `logik.js` – Auswertung der Wetterdaten (Stundenzuordnung, Regendauer, Ampel)
- `app.js` – Anzeige
- `editor.js` – Bearbeiten-Modus (Stift, Formulare, Speichern über die GitHub-Schnittstelle)

## Wetter

- Daten: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0), zuerst mit den ICON-Modellen des DWD, sonst Open-Meteo-Standard.
- Regenmenge und Regenwahrscheinlichkeit gelten bei Open-Meteo für die vorangegangene Stunde. Die Spalte „19“ (19 bis 20 Uhr) zeigt deshalb den Wert mit Zeitstempel 20:00.
- Regendauer: Anzahl der Viertelstunden mit mindestens `regenSchwelle` mm Regen mal 15, daher nur 0, 15, 30, 45 oder 60 Minuten.
- Ampel: rot gewinnt vor gelb, sonst grün. Die Regendauer zählt nicht mit.
