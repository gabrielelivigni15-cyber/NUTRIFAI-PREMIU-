import OpenAI from "openai"

export const runtime = "nodejs"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req) {
  try {
    const body = await req.json()

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

OUTPUT: restituisci SOLO JSON valido con questa forma:

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
`

    const response = await client.responses.create({
      model: "gpt-5.2",
      input: [{ role: "user", content: prompt }],
    })

    const text =
      response.output?.[0]?.content?.[0]?.text ||
      response.output_text ||
      ""

    if (!text) throw new Error("Nessun output dall'AI")

    // LLM a volte mette backticks: li togliamo
    const cleaned = text.replace(/```json|```/g, "").trim()
    const data = JSON.parse(cleaned)

    return Response.json({ ok: true, data })
  } catch (e) {
    return Response.json(
      { ok: false, error: e?.message || "Errore AI" },
      { status: 500 }
    )
  }
}
