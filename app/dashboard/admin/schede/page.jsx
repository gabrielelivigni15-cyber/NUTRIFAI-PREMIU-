"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../lib/supabaseClient"

export default function SchedeAdminPage() {
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

    setExNome(""); setExSerie(""); setExRip(""); setExRec(""); setExNote("")
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Schede allenamento</h1>
        <p className="text-sm text-gray-400 mt-1">
          Crea, modifica e gestisci le schede. (Admin/Coach)
        </p>
      </div>

      {(err || msg) && (
        <div className={`rounded-2xl border p-3 text-sm ${err ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"}`}>
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
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {s.descrizione && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.descrizione}</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <h2 className="text-sm font-semibold">
            {selected ? "Modifica scheda" : "Crea nuova scheda"}
          </h2>

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
                <input className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm" placeholder="Esercizio (es. Squat)" value={exNome} onChange={(e) => setExNome(e.target.value)} />
                <input className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm" placeholder="Serie (es. 4)" value={exSerie} onChange={(e) => setExSerie(e.target.value)} />
                <input className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm" placeholder="Ripetizioni (es. 8-10)" value={exRip} onChange={(e) => setExRip(e.target.value)} />
                <input className="rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm" placeholder="Recupero (es. 90s)" value={exRec} onChange={(e) => setExRec(e.target.value)} />
                <input className="md:col-span-2 rounded-2xl bg-black/30 border border-white/10 px-3 py-2 text-sm" placeholder="Note" value={exNote} onChange={(e) => setExNote(e.target.value)} />
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
                          <p className="font-medium truncate">{ex.ordine + 1}. {ex.nome}</p>
                          <p className="text-xs text-gray-400">
                            {ex.serie ? `Serie: ${ex.serie}` : "Serie: -"} · {ex.ripetizioni ? `Rep: ${ex.ripetizioni}` : "Rep: -"} · {ex.recupero ? `Rec: ${ex.recupero}` : "Rec: -"}
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
    </div>
  )
}
