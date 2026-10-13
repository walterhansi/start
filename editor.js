/* Alfis Startseite – Bearbeiten-Modus
   Links im Browser ändern und per GitHub-Schnittstelle in links.json speichern.
   Das GitHub-Token liegt nur im localStorage dieses Browsers, nicht im Repo. */
(function () {
  "use strict";

  var C = window.STARTSEITE;
  var S = window.Start;
  if (!C || !S || !C.github) return;

  var G = C.github;
  var TOKEN_KEY = "start-token";
  var API = "https://api.github.com/repos/" + G.besitzer + "/" + G.repo + "/contents/" + G.datei;
  var NS = "http://www.w3.org/2000/svg";

  var arbeit = null;   // Kopie der Links, die gerade bearbeitet wird
  var sha = null;      // Version von links.json auf GitHub (für das Speichern nötig)
  var aktiv = false;
  var stift, leiste, statusEl, knoepfe, tokenFeld, tokenZeile;

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function knopf(text, klasse, aktion, label) {
    var b = el("button", klasse || "", text);
    b.type = "button";
    if (label) b.setAttribute("aria-label", label);
    b.addEventListener("click", aktion);
    return b;
  }

  function kopie(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- Token ---------- */

  function leseToken() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } }
  function setzeToken(t) {
    try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (e) { /* egal */ }
  }

  /* ---------- GitHub-Schnittstelle ---------- */

  function ausBase64(b) {
    var bin = atob(b.replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function nachBase64(text) {
    var bytes = new TextEncoder().encode(text);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function api(methode, body) {
    var opt = {
      method: methode,
      headers: { "Accept": "application/vnd.github+json", "Authorization": "Bearer " + leseToken() }
    };
    if (body) {
      opt.body = JSON.stringify(body);
      opt.headers["Content-Type"] = "application/json";
    }
    var adresse = API + (methode === "GET" ? "?ref=" + encodeURIComponent(G.branch) : "");
    return fetch(adresse, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) {
          var e = new Error(d.message || ("HTTP " + r.status));
          e.status = r.status;
          throw e;
        }
        return d;
      });
    });
  }

  function fehlerText(e) {
    var s = e && e.status;
    if (s === 401) return "GitHub lehnt das Token ab (401). Bitte ein neues eintragen.";
    if (s === 403) return "Das Token darf hier nicht schreiben (403). Nötig: „Contents: Read and write“ für das Repo " + G.repo + ".";
    if (s === 404) return "Datei oder Repo nicht gefunden (404). Bei einem Token ohne Zugriff auf das Repo erscheint ebenfalls 404.";
    if (s === 409 || s === 422) return "links.json wurde inzwischen woanders geändert (" + s + "). Bitte Seite neu laden und es nochmal versuchen.";
    return "Fehler: " + (e && e.message ? e.message : "unbekannt");
  }

  /* ---------- Leiste unten ---------- */

  function status(text, fehler) {
    statusEl.textContent = text || "";
    statusEl.className = "estatus" + (fehler ? " fehler" : "");
  }

  function zeigeKnoepfe(modus) {
    // modus: "bearbeiten" | "token" | "nichts"
    knoepfe.hidden = modus !== "bearbeiten";
    tokenZeile.hidden = modus !== "token";
  }

  function baueLeiste() {
    stift = el("button", "stift");
    stift.type = "button";
    stift.setAttribute("aria-label", "Links bearbeiten");
    stift.title = "Links bearbeiten";
    var sv = document.createElementNS(NS, "svg");
    sv.setAttribute("viewBox", "0 0 24 24");
    sv.setAttribute("aria-hidden", "true");
    sv.innerHTML = '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>'; // feste Zeichnung
    stift.appendChild(sv);
    stift.addEventListener("click", starte);
    document.body.appendChild(stift);

    leiste = el("div", "eleiste");
    leiste.hidden = true;
    leiste.setAttribute("role", "region");
    leiste.setAttribute("aria-label", "Links bearbeiten");

    knoepfe = el("div", "ereihe");
    knoepfe.appendChild(knopf("Speichern", "primaer", speichern));
    knoepfe.appendChild(knopf("Abbrechen", "", abbrechen));
    knoepfe.appendChild(knopf("Token ändern", "", tokenAendern));

    tokenZeile = el("div", "ereihe");
    tokenFeld = el("input");
    tokenFeld.type = "password";
    tokenFeld.autocomplete = "off";
    tokenFeld.placeholder = "GitHub-Token";
    tokenFeld.setAttribute("aria-label", "GitHub-Token");
    tokenZeile.appendChild(tokenFeld);
    tokenZeile.appendChild(knopf("Prüfen", "primaer", tokenPruefen));
    tokenZeile.appendChild(knopf("Abbrechen", "", abbrechen));

    statusEl = el("p", "estatus");
    statusEl.setAttribute("role", "status");

    leiste.appendChild(knoepfe);
    leiste.appendChild(tokenZeile);
    leiste.appendChild(statusEl);
    document.body.appendChild(leiste);
    zeigeKnoepfe("nichts");
  }

  /* ---------- Ablauf ---------- */

  function starte() {
    aktiv = true;
    stift.hidden = true;
    leiste.hidden = false;
    document.body.classList.add("bearbeiten");
    if (!leseToken()) { fordereToken("Für das Speichern braucht dieser Browser einmal ein GitHub-Token."); return; }
    ladeAktuelle();
  }

  function fordereToken(text, fehler) {
    zeigeKnoepfe("token");
    status(text, fehler);
    tokenFeld.value = "";
    tokenFeld.focus();
  }

  function tokenAendern() {
    fordereToken("Neues GitHub-Token eintragen (Repo " + G.repo + ", Contents: Read and write).");
  }

  function tokenPruefen() {
    var t = tokenFeld.value.trim();
    if (!t) { status("Bitte das Token einfügen.", true); return; }
    setzeToken(t);
    tokenFeld.value = "";
    ladeAktuelle();
  }

  /* Aktuelle links.json direkt von GitHub holen (frisch, mit sha) */
  function ladeAktuelle() {
    zeigeKnoepfe("nichts");
    status("Lade aktuelle Links von GitHub …");
    api("GET").then(function (d) {
      var daten = JSON.parse(ausBase64(d.content));
      if (!daten || !Array.isArray(daten.flaechen)) throw new Error("links.json hat ein unerwartetes Format");
      sha = d.sha;
      arbeit = kopie(daten);
      zeigeFormulare();
      zeigeKnoepfe("bearbeiten");
      status("Ändern, dann „Speichern“. Sichtbar auf anderen Geräten nach ca. 1 Minute.");
    }).catch(function (e) {
      if (e && (e.status === 401)) { setzeToken(""); fordereToken(fehlerText(e), true); return; }
      zeigeKnoepfe("bearbeiten");
      knoepfe.firstChild.hidden = true; // ohne geladene Daten nicht speichern
      status(fehlerText(e), true);
    });
  }

  function beenden(daten) {
    aktiv = false;
    arbeit = null;
    leiste.hidden = true;
    stift.hidden = false;
    document.body.classList.remove("bearbeiten");
    knoepfe.firstChild.hidden = false;
    zeigeKnoepfe("nichts");
    status("");
    if (daten) S.zeigeFlaechen(daten.flaechen);
    else if (S.daten) S.zeigeFlaechen(S.daten.flaechen);
    else S.laden();
  }

  function abbrechen() { beenden(null); }

  /* ---------- Prüfen und Aufräumen ---------- */

  function pruefe(daten) {
    for (var i = 0; i < daten.flaechen.length; i++) {
      var f = daten.flaechen[i];
      for (var j = 0; j < f.links.length; j++) {
        var l = f.links[j];
        var wo = "Fläche " + (i + 2) + ", Link " + (j + 1) + ": ";
        if (!String(l.text || "").trim()) return wo + "Text fehlt.";
        if (!/^https?:\/\/\S+$/i.test(String(l.url || "").trim())) return wo + "Adresse muss mit http:// oder https:// beginnen.";
      }
    }
    return "";
  }

  function bereinige(daten) {
    return {
      flaechen: daten.flaechen.map(function (f) {
        var titel = String(f.titel || "").trim() || "Thema folgt";
        var links = f.links.map(function (l) {
          var k = l.knopf || {};
          var typ = k.typ === "zeichnung" && S.zeichnungen.indexOf(k.inhalt) >= 0 ? "zeichnung" : "text";
          var inhalt = typ === "zeichnung" ? k.inhalt : (String(k.inhalt || "").trim() || "Öffnen");
          return { text: String(l.text).trim(), url: String(l.url).trim(), knopf: { typ: typ, inhalt: inhalt } };
        });
        var neu = { titel: titel };
        // Platzhalter-Hinweis („Fläche 3“) nur behalten, solange die Fläche noch leer und unbenannt ist
        if (f.hinweis && !links.length && titel === "Thema folgt") neu.hinweis = f.hinweis;
        neu.links = links;
        return neu;
      })
    };
  }

  function speichern() {
    var fehler = pruefe(arbeit);
    if (fehler) { status(fehler, true); return; }
    var sauber = bereinige(arbeit);
    var text = JSON.stringify(sauber, null, 2) + "\n";
    zeigeKnoepfe("nichts");
    status("Speichere …");
    api("PUT", { message: "Links aktualisiert", content: nachBase64(text), sha: sha, branch: G.branch }).then(function () {
      S.merkeEigene(sauber);
      beenden(sauber);
      status("");
      zeigeHinweis("Gespeichert. Auf anderen Geräten in ca. 1 Minute sichtbar.");
    }).catch(function (e) {
      zeigeKnoepfe("bearbeiten");
      status(fehlerText(e), true);
    });
  }

  function zeigeHinweis(text) {
    var h = el("div", "ehinweis", text);
    h.setAttribute("role", "status");
    document.body.appendChild(h);
    setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 6000);
  }

  /* ---------- Formulare in den Flächen ---------- */

  function feld(wert, platzhalter, label, bei, typ) {
    var i = el("input");
    i.type = typ || "text";
    i.value = wert || "";
    i.placeholder = platzhalter;
    i.setAttribute("aria-label", label);
    i.autocomplete = "off";
    i.spellcheck = false;
    i.addEventListener("input", function () { bei(i.value); });
    return i;
  }

  function zeigeFormulare() {
    S.zeigeFlaechen(arbeit.flaechen); // sorgt dafür, dass alle fünf Flächen vorhanden sind
    arbeit.flaechen.slice(0, 5).forEach(function (f, i) {
      var sektion = document.querySelector("#raster .t" + (i + 2));
      if (sektion) baueFormular(sektion, f, i + 2);
    });
  }

  function baueFormular(sektion, f, nr) {
    sektion.textContent = "";
    sektion.classList.add("edit");
    sektion.setAttribute("aria-label", "Fläche " + nr + " bearbeiten");

    var kopf = el("div", "kopf");
    kopf.appendChild(feld(f.titel, "Titel", "Titel der Fläche " + nr, function (v) { f.titel = v; }));
    sektion.appendChild(kopf);

    f.links.forEach(function (l, j) {
      sektion.appendChild(baueZeile(sektion, f, nr, l, j));
    });

    sektion.appendChild(knopf("+ Link", "eplus", function () {
      f.links.push({ text: "", url: "https://", knopf: { typ: "text", inhalt: "Öffnen" } });
      baueFormular(sektion, f, nr);
    }));
  }

  function verschiebe(f, von, nach) {
    if (nach < 0 || nach >= f.links.length) return false;
    var l = f.links.splice(von, 1)[0];
    f.links.splice(nach, 0, l);
    return true;
  }

  function baueZeile(sektion, f, nr, l, j) {
    var z = el("div", "ezeile");
    if (!l.knopf) l.knopf = { typ: "text", inhalt: "Öffnen" };

    z.appendChild(feld(l.text, "Text, z. B. SG Moosburg 2", "Text von Link " + (j + 1), function (v) { l.text = v; }));
    z.appendChild(feld(l.url, "https://…", "Adresse von Link " + (j + 1), function (v) { l.url = v; }, "url"));

    var r = el("div", "ereihe");

    var typ = el("select");
    typ.setAttribute("aria-label", "Art der Schaltfläche");
    [["text", "Text"], ["zeichnung", "Zeichnung"]].forEach(function (o) {
      var op = el("option", "", o[1]);
      op.value = o[0];
      typ.appendChild(op);
    });
    typ.value = l.knopf.typ === "zeichnung" ? "zeichnung" : "text";
    typ.addEventListener("change", function () {
      l.knopf = typ.value === "zeichnung" ? { typ: "zeichnung", inhalt: S.zeichnungen[0] } : { typ: "text", inhalt: "Öffnen" };
      baueFormular(sektion, f, nr);
    });
    r.appendChild(typ);

    if (l.knopf.typ === "zeichnung") {
      var sel = el("select");
      sel.setAttribute("aria-label", "Zeichnung");
      S.zeichnungen.forEach(function (name) {
        var op = el("option", "", name);
        op.value = name;
        sel.appendChild(op);
      });
      sel.value = l.knopf.inhalt;
      sel.addEventListener("change", function () { l.knopf.inhalt = sel.value; });
      r.appendChild(sel);
    } else {
      r.appendChild(feld(l.knopf.inhalt, "Öffnen", "Text in der Schaltfläche", function (v) { l.knopf.inhalt = v; }));
    }

    r.appendChild(knopf("↑", "eknopf", function () { if (verschiebe(f, j, j - 1)) baueFormular(sektion, f, nr); }, "Nach oben"));
    r.appendChild(knopf("↓", "eknopf", function () { if (verschiebe(f, j, j + 1)) baueFormular(sektion, f, nr); }, "Nach unten"));
    r.appendChild(knopf("✕", "eknopf", function () { f.links.splice(j, 1); baueFormular(sektion, f, nr); }, "Link löschen"));
    z.appendChild(r);
    return z;
  }

  baueLeiste();
})();
