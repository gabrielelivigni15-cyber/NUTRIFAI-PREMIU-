import OpenAI from "openai"

export const runtime = "nodejs"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function pickTextFromResponse(response) {
  // Varianti comuni del payload Responses API
  return (
    response?.output?.[0]?.content?.[0]?.text ||
    response?.output_text ||
    response?.output?.map((o) => o?.content?.map((c) => c?.text).join("")).join("\n") ||
    ""
  )
}

function cleanToJsonCandidate(text) {
  // toglie fence e roba extra
  return text
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim()
}

export async function POST(req) {
  try {
    console.log("🔥 /api/ai/genera-scheda HIT")

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { ok: false, error: "OPENAI_API_KEY mancante su Vercel" },
        { status: 500 }
      )
    }

    const body = await req.json()
    console.log("📩 BODY:", body)

    const {
      obiettivo = "ipertrofia",
      livello = "intermedio",
      giorni = 3,
      attrezzatura = "palestra completa",
      limitazioni = "nessuna",
      focus = "equilibrata",
      stileCoach = "tecnico ma umano",
      lingua = "it",
    } = body || {}

    const prompt = `
Sei un Head Coach e Program Designer. Genera una scheda di allenamento pratica e coerente.

CONTESTO:
- Obiettivo: ${obiettivo}
- Livello: ${livello}
- Giorni/settimana: ${giorni}
- Attrezzatura: ${attrezzatura}
- Limitazioni/infortuni: ${limitazioni}
- Focus: ${focus}
- Stile coach: ${stileCoach}
- Lingua: ${lingua}

OUTPUT: restituisci SOLO JSON valido con questa forma (nessun testo extra):

{
  "titolo": "string",
  "descrizione": "string",
  "split": "string",
  "motivazione": ["..."],
  "esercizi": [
    { "nome":"", "serie":"", "ripetizioni":"", "recupero":"", "note":"", "ordine":0 }
  ]
}

REGOLE:
- 6–12 esercizi totali (in base ai giorni)
- recuperi realistici
- note tecniche brevi
- ordine 0..N
`.trim()

    // 🔁 IMPORTANTISSIMO:
    // Se "gpt-5.2" ti dà errore, cambia in un modello che hai abilitato.
    // Esempi comuni: "gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: prompt }],
    })

    const raw = pickTextFromResponse(response)
    if (!raw) throw new Error("Nessun output dall'AI")

    const cleaned = cleanToJsonCandidate(raw)

    let data
    try {
      data = JSON.parse(cleaned)
    } catch (parseErr) {
      console.log("⚠️ JSON parse failed. RAW:", raw)
      console.log("⚠️ JSON parse failed. CLEANED:", cleaned)
      throw new Error("Risposta AI non è JSON valido (vedi log Vercel)")
    }

    // Validazione minima (così se manca qualcosa lo vedi subito)
    if (!data?.titolo || !Array.isArray(data?.esercizi)) {
      console.log("⚠️ JSON structure unexpected:", data)
      throw new Error("JSON AI non ha la struttura attesa")
    }

    return Response.json({ ok: true, data })
  } catch (e) {
    console.log("❌ AI ERROR:", e)
    return Response.json(
      { ok: false, error: e?.message || "Errore AI" },
      { status: 500 }
    )
  }
}
