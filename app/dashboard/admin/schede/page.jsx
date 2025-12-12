"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [schede, setSchede] = useState([])
  const [selected, setSelected] = useState(null)
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")

  // form scheda
  const [titolo, setTitolo] = useState("")
  const [descrizione, setDescrizione] = useState("")

  // esercizi
  const [esercizi, setEsercizi] = useState([])
  const [exNome, setExNome] = useState("")
  const [exSerie, setExSerie] = useState("")
  const [exRip, setExRip] = useState("")
  const [exRec, setExRec] = useState("")
  const [exNote, setExNote] = useState("")

  const resetAlerts = () => {
    setMsg("")
    setErr("")
  }

  const loadSchede = async () => {
    resetAlerts()
    setLoading(true)

    const { data, error } = await supabase
      .from("schede_allenamento")
      .select("id,titolo,descrizione,coach_id,created_at,updated_at")
      .order("created_at", { ascending: false })

    if (error) setErr(error.message)
    setSchede(data ?? [])
    setLoading(false)
  }

  const loadEsercizi = async (schedaId) => {
    const { data, error } = await supabase
      .from("scheda_esercizi")
      .select("id,nome,serie,ripetizioni,recupero,note,ordine,created_at")
      .eq("scheda_id", schedaId)
      .order("ordine", { ascending: true })

    if (error) setErr(error.message)
    setEsercizi(data ?? [])
  }

  useEffect(() => {
    loadSchede()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectScheda = async (s) => {
    resetAlerts()
    setSelected(s)
    setTitolo(s.titolo ?? "")
    setDescrizione(s.descrizione ?? "")
    await loadEsercizi(s.id)
  }

  const createScheda = async () => {
    resetAlerts()
    if (!titolo.trim()) return setErr("Inserisci un titolo.")

    const { data: sessionData } = await supabase.auth.getSession()
    const uid = sessionData?.session?.user?.id
    if (!uid) return setErr("Sessione non valida. Rifai login.")

    const { data, error } = await supabase
      .from("schede_allenamento")
      .insert({ titolo: titolo.trim(), descrizione: descrizione.trim() || null, coach_id: uid })
      .select()
      .single()

    if (error) return setErr(error.message)

    setMsg("Scheda creata ✅")
    await loadSchede()
    await selectScheda(data)
  }

  const saveScheda = async () => {
    resetAlerts()
    if (!selected) return
    if (!titolo.trim()) return setErr("Titolo obbligatorio.")

    const { error } = await supabase
      .from("schede_allenamento")
      .update({ titolo: titolo.trim(), descrizione: descrizione.trim() || null })
      .eq("id", selected.id)

    if (error) return setErr(error.message)

    setMsg("Scheda aggiornata ✅")
    await loadSchede()
  }

  const deleteScheda = async () => {
    resetAlerts()
    if (!selected) return
    if (!confirm("Eliminare questa scheda?")) return

    const { error } = await supabase.from("schede_allenamento").delete().eq("id", selected.id)
    if (error) return setErr(error.message)

    setMsg("Scheda eliminata ✅")
    setSelected(null)
    setTitolo("")
    setDescrizione("")
    setEsercizi([])
    await loadSchede()
  }

  const addEsercizio = async () => {
    resetAlerts()
    if (!selected) return setErr("Seleziona una scheda.")
    if (!exNome.trim()) return setErr("Nome esercizio obbligatorio.")

    const ordine = (esercizi?.[esercizi.length - 1]?.ordine ?? -1) + 1

    const { error } = await supabase.from("scheda_esercizi").insert({
      scheda_id: selected.id,
      nome: exNome.trim(),
      serie: exSerie.trim() || null,
      ripetizioni: exRip.trim() || null,
      recupero: exRec.trim() || null,
      note: exNote.trim() || null,
      ordine,
    })

    if (error) return setErr(error.message)

    setExNome("")
    setExSerie("")
    setExRip("")
    setExRec("")
    setExNote("")
    setMsg("Esercizio aggiunto ✅")
    await loadEsercizi(selected.id)
  }

  const removeEsercizio = async (id) => {
    resetAlerts()
    const { error } = await supabase.from("scheda_esercizi").delete().eq("id", id)
    if (error) return setErr(error.message)
    setMsg("Esercizio rimosso ✅")
    await loadEsercizi(selected.id)
  }

  // =========================
  // 🤖 AI STUDIO – STATE
  // =========================
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiErr, setAiErr] = useState("")
  const [aiDraft, setAiDraft] = useState(null)

  const [aiForm, setAiForm] = useState({
    obiettivo: "ipertrofia",
    livello: "intermedio",
    giorni: 3,
    attrezzatura: "palestra completa",
    limitazioni: "",
    focus: "equilibrata",
    stileCoach: "tecnico ma umano",
    lingua: "it",
  })

  const generateWithAI = async () => {
    console.log("AI GENERATE CLICK")

    setAiErr("")
    setAiDraft(null)
    setAiLoading(true)

    try {
      const res = await fetch("/api/ai/genera-scheda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiForm),
      })

      const json = await res.json()
      console.log("AI RESPONSE:", json)

      if (!res.ok || !json?.ok) throw new Error(json?.error || "Errore generazione AI")

      setAiDraft(json.data)
    } catch (e) {
      console.error("AI ERROR:", e)
      setAiErr(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const applyAIDraftToDB = async () => {
    resetAlerts()
    setErr("")
    setMsg("")

    if (!aiDraft) return setAiErr("Nessuna bozza AI da applicare.")

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData?.session?.user?.id
      if (!uid) throw new Error("Sessione non valida. Rifai login.")

      // 1) crea scheda
      const { data: scheda, error: schedaErr } = await supabase
        .from("schede_allenamento")
        .insert({
          titolo: (aiDraft.titolo || "Scheda AI").trim(),
          descrizione: (aiDraft.descrizione || "").trim() || null,
          coach_id: uid,
        })
        .select()
        .single()

      if (schedaErr) throw schedaErr

      // 2) crea esercizi
      const rows = (aiDraft.esercizi || [])
        .slice(0, 50)
        .map((ex, i) => ({
          scheda_id: scheda.id,
          nome: (ex.nome || "").trim(),
          serie: (ex.serie || "").toString(),
          ripetizioni: (ex.ripetizioni || "").toString(),
          recupero: (ex.recupero || "").toString(),
          note: (ex.note || "").toString(),
          ordine: Number.isFinite(ex.ordine) ? ex.ordine : i,
        }))
        .filter((r) => r.nome)

      if (rows.length) {
        const { error: exErr } = await supabase.from("scheda_esercizi").insert(rows)
        if (exErr) throw exErr
      }

      setMsg("Scheda AI creata ✅ (ora puoi modificarla)")
      await loadSchede()
      await selectScheda(scheda)

      setAiOpen(false)
      setAiDraft(null)
      setAiErr("")
    } catch (e) {
      console.error(e)
      setErr(e.message || "Errore applicazione bozza AI")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Schede allenamento</h1>
          <p className="text-sm text-gray-400 mt-1">
            Crea, modifica e gestisci le schede. (Admin/Coach)
          </p>
        </div>

        <button
          onClick={() => {
            console.log("AI STUDIO OPEN")
            setAiOpen(true)
            setAiErr("")
            setAiDraft(null)
          }}
          className="rounded-2xl bg-white/15 hover:bg-white/20 px-4 py-2 text-sm"
        >
          ✨ AI Studio
        </button>
      </div>

      {(err || msg) && (
        <div
          className={`rounded-2xl border p-3 text-sm ${
            err
              ? "border-red-500/30 bg-red-500/5 text-red-200"
              : "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
          }`}
        >
          {err || msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Le tue schede</h2>
            <button
              onClick={loadSchede}
              className="text-xs rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2"
            >
              Aggiorna
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Caricamento…</p>
          ) : schede.length === 0 ? (
            <p className="text-sm text-gray-400">Nessuna scheda trovata.</p>
          ) : (
            <div className="space-y-2">
              {schede.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectScheda(s)}
                  className={`w-full text-left rounded-2xl border p-3 hover:bg-white/5 ${
                    selected?.id === s.id ? "border-white/20 bg-white/5" : "border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{s.titolo}</p>
                    <span className="text-xs text-gray-400">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  {s.descrizione && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.descrizione}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <h2 className="text-sm font-semibold">{selected ? "Modifica scheda" : "Crea nuova scheda"}</h2>

          <div className="space-y-2">
            <label className="text-xs text-gray-400">Titolo</label>
            <input
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              placeholder="Es. Full Body A"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400">Descrizione</label>
            <textarea
              className="w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm min-h-[90px]"
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Note, focus, progressioni…"
            />
          </div>

          <div className="flex gap-2">
            {!selected ? (
              <button
                onClick={createScheda}
                className="rounded-2xl bg-white/15 hover:bg-white/20 px-4 py-2 text-sm"
              >
                Crea scheda
              </button>
            ) : (
              <>
                <button
                  onClick={saveScheda}
                  className="rounded-2xl bg-white/15 hover:bg-white/20 px-4 py-2 text-sm"
                >
                  Salva
                </button>
                <button
                  onClick={deleteScheda}
                  className="rounded-2xl bg-red-500/15 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 text-sm"
                >
                  Elimina
                </button>
              </>
            )}
          </div>

          {/* Esercizi */}
          {selected && (
            <div className="pt-2 border-t border-white/10 space-y-3">
              <h3 className="text-sm font-semibold">Esercizi</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                  placeholder="Esercizio (es. Squat)"
                  value={exNome}
                  onChange={(e) => setExNome(e.target.value)}
                />
                <input
                  className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                  placeholder="Serie (es. 4)"
                  value={exSerie}
                  onChange={(e) => setExSerie(e.target.value)}
                />
                <input
                  className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                  placeholder="Ripetizioni (es. 8-10)"
                  value={exRip}
                  onChange={(e) => setExRip(e.target.value)}
                />
                <input
                  className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                  placeholder="Recupero (es. 90s)"
                  value={exRec}
                  onChange={(e) => setExRec(e.target.value)}
                />
                <input
                  className="md:col-span-2 rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                  placeholder="Note"
                  value={exNote}
                  onChange={(e) => setExNote(e.target.value)}
                />
              </div>

              <button
                onClick={addEsercizio}
                className="rounded-2xl bg-white/15 hover:bg-white/20 px-4 py-2 text-sm"
              >
                Aggiungi esercizio
              </button>

              {esercizi.length === 0 ? (
                <p className="text-sm text-gray-400">Nessun esercizio inserito.</p>
              ) : (
                <div className="space-y-2">
                  {esercizi.map((ex) => (
                    <div key={ex.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {ex.ordine + 1}. {ex.nome}
                          </p>
                          <p className="text-xs text-gray-400">
                            {ex.serie ? `Serie: ${ex.serie}` : "Serie: -"} ·{" "}
                            {ex.ripetizioni ? `Rep: ${ex.ripetizioni}` : "Rep: -"} ·{" "}
                            {ex.recupero ? `Rec: ${ex.recupero}` : "Rec: -"}
                          </p>
                          {ex.note && <p className="text-xs text-gray-400 mt-1">{ex.note}</p>}
                        </div>
                        <button
                          onClick={() => removeEsercizio(ex.id)}
                          className="text-xs rounded-xl bg-red-500/15 hover:bg-red-500/20 border border-red-500/20 px-3 py-2"
                        >
                          Rimuovi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 pt-1">
                Prossimo step: assegnazione a clienti + vista cliente.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =========================
          ✨ AI STUDIO OVERLAY
         ========================= */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-nutriBg p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-[0.18em]">Nutrifai AI Studio</p>
                <h2 className="text-xl font-semibold mt-1">Genera una scheda “coach-grade”</h2>
                <p className="text-sm text-gray-400 mt-1">
                  L’AI propone. Tu controlli. Poi confermi e salvi.
                </p>
              </div>

              <button
                onClick={() => setAiOpen(false)}
                className="rounded-2xl bg-white/10 hover:bg-white/15 px-3 py-2 text-sm"
              >
                Chiudi
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
              {/* LEFT: input */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-sm font-semibold">Brief rapido</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <select
                    className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                    value={aiForm.obiettivo}
                    onChange={(e) => setAiForm((s) => ({ ...s, obiettivo: e.target.value }))}
                  >
                    <option value="ipertrofia">Ipertrofia</option>
                    <option value="forza">Forza</option>
                    <option value="dimagrimento">Dimagrimento</option>
                    <option value="performance">Performance</option>
                    <option value="ricondizionamento">Ricondizionamento</option>
                  </select>

                  <select
                    className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                    value={aiForm.livello}
                    onChange={(e) => setAiForm((s) => ({ ...s, livello: e.target.value }))}
                  >
                    <option value="base">Base</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzato">Avanzato</option>
                  </select>

                  <select
                    className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                    value={aiForm.giorni}
                    onChange={(e) => setAiForm((s) => ({ ...s, giorni: Number(e.target.value) }))}
                  >
                    {[2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} giorni
                      </option>
                    ))}
                  </select>

                  <select
                    className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                    value={aiForm.attrezzatura}
                    onChange={(e) => setAiForm((s) => ({ ...s, attrezzatura: e.target.value }))}
                  >
                    <option value="palestra completa">Palestra completa</option>
                    <option value="casa manubri">Casa (manubri)</option>
                    <option value="casa corpo libero">Casa (corpo libero)</option>
                    <option value="mista">Mista</option>
                  </select>
                </div>

                <input
                  className="w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                  placeholder="Focus (es. glutei, schiena, squat...)"
                  value={aiForm.focus}
                  onChange={(e) => setAiForm((s) => ({ ...s, focus: e.target.value }))}
                />

                <input
                  className="w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                  placeholder="Limitazioni/infortuni (es. lombare, spalla...)"
                  value={aiForm.limitazioni}
                  onChange={(e) => setAiForm((s) => ({ ...s, limitazioni: e.target.value }))}
                />

                <select
                  className="w-full rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm"
                  value={aiForm.stileCoach}
                  onChange={(e) => setAiForm((s) => ({ ...s, stileCoach: e.target.value }))}
                >
                  <option value="tecnico ma umano">Tecnico ma umano</option>
                  <option value="motivazionale ma serio">Motivazionale ma serio</option>
                  <option value="minimal e diretto">Minimal e diretto</option>
                </select>

                {aiErr && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-200">
                    {aiErr}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={generateWithAI}
                    disabled={aiLoading}
                    className="rounded-2xl bg-white/15 hover:bg-white/20 px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {aiLoading ? "Generazione…" : "⚡ Genera"}
                  </button>

                  <button
                    onClick={() => {
                      setAiDraft(null)
                      setAiErr("")
                    }}
                    className="rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-2 text-sm"
                  >
                    Reset
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Tip: se vuoi “wow”, scrivi focus e limitazioni in modo realistico.
                </p>
              </div>

              {/* RIGHT: preview */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                {!aiDraft ? (
                  <div className="text-sm text-gray-400">
                    Premi <b>Genera</b> e qui comparirà la bozza.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-400">Titolo</p>
                      <p className="text-lg font-semibold">{aiDraft.titolo}</p>
                      <p className="text-xs text-gray-400 mt-2">Descrizione</p>
                      <p className="text-sm text-gray-200/90 whitespace-pre-wrap">
                        {aiDraft.descrizione}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <p className="text-sm font-semibold">Esercizi</p>
                      <div className="mt-2 space-y-2">
                        {(aiDraft.esercizi || []).slice(0, 12).map((ex) => (
                          <div
                            key={ex.ordine}
                            className="rounded-2xl border border-white/10 bg-white/5 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                {Number.isFinite(ex.ordine) ? ex.ordine + 1 : "•"} {ex.nome}
                              </p>
                              <p className="text-xs text-gray-400">{ex.recupero}</p>
                            </div>
                            <p className="text-xs text-gray-300 mt-1">
                              Serie: {ex.serie} · Rep: {ex.ripetizioni}
                            </p>
                            {ex.note && <p className="text-xs text-gray-400 mt-1">{ex.note}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={applyAIDraftToDB}
                        className="rounded-2xl bg-white/15 hover:bg-white/20 px-4 py-2 text-sm"
                      >
                        ✅ Conferma e crea in app
                      </button>
                    </div>

                    <p className="text-xs text-gray-500">
                      Dopo la creazione puoi modificarla normalmente a destra.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
