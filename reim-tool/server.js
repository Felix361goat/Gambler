// Backend des Reim-Tools.
// Nimmt die Eingabe vom Frontend entgegen, fragt die Claude API
// (Modell claude-sonnet-4-6) und gibt strukturierte Reim-Vorschläge zurück.
// Es gibt KEINE lokale Reim-Datenbank — alles wird live generiert.

import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import { STYLE_PROMPT } from "./stylePrompt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "\nFEHLER: Kein API-Key gefunden.\n" +
      "Lege eine Datei namens .env in diesem Ordner an mit dem Inhalt:\n\n" +
      "  ANTHROPIC_API_KEY=dein-key-hier\n"
  );
  process.exit(1);
}

const client = new Anthropic(); // liest ANTHROPIC_API_KEY aus der Umgebung

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Die vier Reim-Kategorien. Schlüssel = was Frontend und API-Antwort benutzen.
const KATEGORIEN = {
  mehrsilbig: "Mehrsilbige Reime (multisyllabic) — möglichst viele Silben matchen klanglich. Das Wichtigste.",
  doppelreime: "Doppelreime / zusammengesetzte Reime — ganze Phrasen, die sich aufeinander reimen.",
  assonanzen: "Assonanzen / Slant Rhymes — nur der Vokalklang sitzt, Konsonanten dürfen abweichen.",
  reineReime: "Reine Reime als Backup — klassisch sauber, aber trotzdem frisch und nicht abgedroschen.",
};

// JSON-Schema für die Antwort — nur die angefragten Kategorien werden verlangt.
function buildSchema(kategorien) {
  const vorschlag = {
    type: "object",
    properties: {
      wort: { type: "string", description: "Das Reimwort oder die Reimphrase" },
      silben: { type: "integer", description: "Silbenzahl des Worts/der Phrase" },
      flowHinweis: { type: "string", description: "Ein kurzer Satz, wie es im Flow sitzt" },
    },
    required: ["wort", "silben", "flowHinweis"],
    additionalProperties: false,
  };

  const properties = {};
  for (const k of kategorien) {
    properties[k] = { type: "array", items: vorschlag };
  }
  return {
    type: "object",
    properties,
    required: kategorien,
    additionalProperties: false,
  };
}

app.post("/api/reime", async (req, res) => {
  const eingabe = (req.body.eingabe || "").trim();
  let kategorien = Array.isArray(req.body.kategorien) ? req.body.kategorien : [];
  kategorien = kategorien.filter((k) => Object.hasOwn(KATEGORIEN, k));

  if (!eingabe) {
    return res.status(400).json({ error: "Keine Eingabe — gib ein Wort, eine Phrase oder eine Zeile ein." });
  }
  if (eingabe.length > 500) {
    return res.status(400).json({ error: "Eingabe zu lang (max. 500 Zeichen)." });
  }
  if (kategorien.length === 0) {
    kategorien = Object.keys(KATEGORIEN);
  }

  const kategorieListe = kategorien
    .map((k) => `- "${k}": ${KATEGORIEN[k]}`)
    .join("\n");

  // Zufalls-Nonce, damit auch bei identischer Eingabe jede Anfrage
  // anders aussieht und frische Vorschläge kommen.
  const nonce = Math.random().toString(36).slice(2, 8);

  const userPrompt = `Eingabe des Artists (Wort, Phrase oder ganze Zeile):

"${eingabe}"

Finde Reime auf das ENDE der Eingabe (bei einer ganzen Zeile: auf das letzte betonte Wort bzw. die letzten Silben).

Liefere für jede dieser Kategorien 5 bis 8 Vorschläge:
${kategorieListe}

Pro Vorschlag: wort (das Wort oder die Phrase), silben (Silbenzahl), flowHinweis (ein kurzer Satz, wie es im Flow sitzt).

WICHTIG: Überspringe die offensichtlichen Standard-Reime, die jedem sofort einfallen — liefere frische, unerwartete Alternativen. Deutsch-englische Kreuzreime sind ausdrücklich erwünscht.

(Session ${nonce} — generiere neue, andere Vorschläge als in früheren Runden.)`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      temperature: 0.9,
      system: STYLE_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: { type: "json_schema", schema: buildSchema(kategorien) },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) {
      return res.status(502).json({ error: "Die API hat keine verwertbare Antwort geliefert. Versuch es nochmal." });
    }

    let daten;
    try {
      daten = JSON.parse(textBlock.text);
    } catch {
      return res.status(502).json({ error: "Antwort der API war kein gültiges JSON. Einfach nochmal auf 'Nochmal' drücken." });
    }

    res.json({ eingabe, reime: daten });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: "API-Key ungültig. Check deine .env-Datei." });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "Rate-Limit erreicht — kurz warten und nochmal probieren." });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("API-Fehler:", error.status, error.message);
      return res.status(502).json({ error: "Die Claude API hat gerade nicht geantwortet. Versuch es gleich nochmal." });
    }
    console.error("Unerwarteter Fehler:", error);
    res.status(500).json({ error: "Unerwarteter Server-Fehler. Versuch es nochmal." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🎤 Reim-Tool läuft: http://localhost:${PORT}\n`);
});
