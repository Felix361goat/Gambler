// Frontend-Logik: Eingabe + gewählte Kategorien an /api/reime schicken,
// Antwort als Karten rendern. "Nochmal" schickt dieselbe Eingabe erneut —
// das Backend generiert dann frische, andere Vorschläge.

const KATEGORIE_TITEL = {
  mehrsilbig: "Mehrsilbige Reime",
  doppelreime: "Doppelreime / zusammengesetzte Reime",
  assonanzen: "Assonanzen / Slant Rhymes",
  reineReime: "Reine Reime (Backup)",
};

const eingabeFeld = document.getElementById("eingabe");
const losBtn = document.getElementById("los");
const nochmalBtn = document.getElementById("nochmal");
const statusBox = document.getElementById("status");
const ergebnisseBox = document.getElementById("ergebnisse");

let letzteEingabe = null;

// Kategorie-Buttons an-/abwählbar machen
document.querySelectorAll(".kat-btn").forEach((btn) => {
  btn.addEventListener("click", () => btn.classList.toggle("aktiv"));
});

function aktiveKategorien() {
  return [...document.querySelectorAll(".kat-btn.aktiv")].map((b) => b.dataset.kat);
}

function zeigeStatus(html, istFehler = false) {
  statusBox.hidden = false;
  statusBox.innerHTML = html;
  statusBox.classList.toggle("fehler", istFehler);
}

function versteckeStatus() {
  statusBox.hidden = true;
}

async function holeReime(eingabe) {
  const kategorien = aktiveKategorien();
  if (kategorien.length === 0) {
    zeigeStatus("Wähl mindestens eine Reim-Kategorie aus.", true);
    return;
  }

  losBtn.disabled = true;
  nochmalBtn.disabled = true;
  ergebnisseBox.innerHTML = "";
  zeigeStatus(
    '<span class="lade-balken"><span></span><span></span><span></span><span></span></span> Reime werden gekocht …'
  );

  try {
    const res = await fetch("/api/reime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eingabe, kategorien }),
    });

    const daten = await res.json();

    if (!res.ok) {
      zeigeStatus(daten.error || "Irgendwas ist schiefgelaufen. Versuch es nochmal.", true);
      return;
    }

    versteckeStatus();
    letzteEingabe = eingabe;
    rendereErgebnisse(daten.reime);
  } catch {
    zeigeStatus("Server nicht erreichbar — läuft `npm start` noch?", true);
  } finally {
    losBtn.disabled = false;
    nochmalBtn.disabled = letzteEingabe === null;
  }
}

function rendereErgebnisse(reime) {
  ergebnisseBox.innerHTML = "";

  for (const [kat, vorschlaege] of Object.entries(reime)) {
    if (!Array.isArray(vorschlaege) || vorschlaege.length === 0) continue;

    const block = document.createElement("section");
    block.className = "kategorie-block";

    const titel = document.createElement("h2");
    titel.textContent = KATEGORIE_TITEL[kat] || kat;
    block.appendChild(titel);

    const karten = document.createElement("div");
    karten.className = "karten";

    for (const v of vorschlaege) {
      const karte = document.createElement("div");
      karte.className = "karte";

      const wort = document.createElement("div");
      wort.className = "wort";
      wort.textContent = v.wort;

      const silben = document.createElement("span");
      silben.className = "silben";
      silben.textContent = `${v.silben} Silben`;

      const flow = document.createElement("div");
      flow.className = "flow";
      flow.textContent = v.flowHinweis;

      karte.append(wort, silben, flow);
      karten.appendChild(karte);
    }

    block.appendChild(karten);
    ergebnisseBox.appendChild(block);
  }

  if (!ergebnisseBox.children.length) {
    zeigeStatus("Keine Vorschläge bekommen — versuch es nochmal.", true);
  }
}

losBtn.addEventListener("click", () => {
  const eingabe = eingabeFeld.value.trim();
  if (!eingabe) {
    zeigeStatus("Gib erst ein Wort, eine Phrase oder eine Line ein.", true);
    return;
  }
  holeReime(eingabe);
});

// "Nochmal": dieselbe Eingabe, neue Vorschläge
nochmalBtn.addEventListener("click", () => {
  if (letzteEingabe) holeReime(letzteEingabe);
});

// Enter (ohne Shift) im Textfeld = abschicken
eingabeFeld.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    losBtn.click();
  }
});
