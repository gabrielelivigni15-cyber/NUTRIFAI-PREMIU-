"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import { Dumbbell, UserPlus, Loader2 } from "lucide-react"

export default function AdminUtentiPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profiles, setProfiles] = useState([])
  const [coaches, setCoaches] = useState([])

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    email: "",
    password: "",
    ruolo: "cliente",
    coach_id: "",
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    setLoading(true)
    setError("")
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      setError("Errore nel caricamento degli utenti.")
      setLoading(false)
      return
    }

    setProfiles(data || [])
    setCoaches((data || []).filter((p) => p.ruolo === "coach"))
    setLoading(false)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      // 1) Creo l'utente su Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nome: form.nome,
            cognome: form.cognome,
            ruolo: form.ruolo,
            coach_id: form.ruolo === "cliente" ? form.coach_id || null : null,
          },
        },
      })

      if (error) {
        console.error(error)
        setError(error.message || "Errore nella creazione dell'utente.")
        setSaving(false)
        return
      }

      // il trigger handle_new_user crea automaticamente la riga in profiles
      setSuccess("Utente creato correttamente.")
      setForm({
        nome: "",
        cognome: "",
        email: "",
        password: "",
        ruolo: "cliente",
        coach_id: "",
      })
      await loadProfiles()
    } catch (err) {
      console.error(err)
      setError("Errore imprevisto nella creazione dell'utente.")
    } finally {
      setSaving(false)
    }
  }

  const ruoliLabel = {
    admin: "Admin",
    coach: "Coach",
    cliente: "Cliente",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Gestione <span className="text-nutriPrimary">utenti</span>
          </h1>
          <p className="text-sm text-gray-400">
            Crea nuovi admin, coach e clienti e gestisci chi ha accesso alla piattaforma.
          </p>
        </div>
      </div>

      {/* Form nuovo utente */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-nutriPrimary to-nutriAccent flex items-center justify-center text-nutriBg">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Nuovo utente</p>
            <p className="text-xs text-gray-400">
              Compila i dati per creare un nuovo account.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-300">Nome</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-nutriPrimary/80"
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-300">Cognome</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-nutriPrimary/80"
              value={form.cognome}
              onChange={(e) => handleChange("cognome", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-300">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-nutriPrimary/80"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-300">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-nutriPrimary/80"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-300">Ruolo</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-nutriPrimary/80"
              value={form.ruolo}
              onChange={(e) => handleChange("ruolo", e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="coach">Coach</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>

          {form.ruolo === "cliente" && (
            <div className="space-y-1">
              <label className="text-xs text-gray-300">Coach assegnato</label>
              <select
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-nutriPrimary/80"
                value={form.coach_id}
                onChange={(e) => handleChange("coach_id", e.target.value)}
              >
                <option value="">— Nessun coach —</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.cognome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="md:col-span-2 flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-nutriPrimary to-nutriAccent text-nutriBg text-sm font-semibold px-4 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.6)] disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creazione in corso...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crea utente
                </>
              )}
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {success && <p className="text-xs text-emerald-400">{success}</p>}
          </div>
        </form>
      </div>

      {/* Lista utenti */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="w-4 h-4 text-nutriPrimary" />
          <p className="text-sm font-medium">Utenti registrati</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Caricamento utenti...
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-sm text-gray-400">Nessun utente trovato.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Ruolo</th>
                  <th className="py-2 pr-3">Coach</th>
                  <th className="py-2 pr-3">Attivo</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const coach = profiles.find((c) => c.id === p.coach_id)
                  return (
                    <tr key={p.id} className="border-b border-white/5">
                      <td className="py-2 pr-3">
                        {p.nome} {p.cognome}
                      </td>
                      <td className="py-2 pr-3 text-gray-300">
                        {p.email || "-"}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[11px] capitalize">
                          {ruoliLabel[p.ruolo] || p.ruolo}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        {coach ? `${coach.nome} ${coach.cognome}` : "-"}
                      </td>
                      <td className="py-2 pr-3">
                        {p.is_active ? "✅" : "❌"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
