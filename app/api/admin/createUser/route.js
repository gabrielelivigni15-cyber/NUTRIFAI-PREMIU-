"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import { UserPlus, Loader2 } from "lucide-react"

export default function CreaUtente() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coachList, setCoachList] = useState([])

  const [form, setForm] = useState({
    email: "",
    password: "",
    nome: "",
    cognome: "",
    ruolo: "cliente",
    coach_id: ""
  })

  useEffect(() => {
    loadCoaches()
  }, [])

  const loadCoaches = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome, cognome")
      .eq("ruolo", "coach")

    setCoachList(data || [])
  }

  const createUser = async () => {
    setLoading(true)

    const res = await fetch("/api/admin/createUser", {
      method: "POST",
      body: JSON.stringify(form)
    })

    const data = await res.json()

    setLoading(false)

    if (data.error) {
      alert("Errore: " + data.error)
      return
    }

    alert("Utente creato con successo!")
    router.push("/dashboard/admin/utenti")
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white/5 rounded-2xl shadow-xl backdrop-blur-xl border border-white/10">
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-nutriPrimary" />
        Crea nuovo utente
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <input
          className="bg-black/20 p-3 rounded-lg border border-white/10"
          placeholder="Nome"
          value={form.nome}
          onChange={e => setForm({ ...form, nome: e.target.value })}
        />

        <input
          className="bg-black/20 p-3 rounded-lg border border-white/10"
          placeholder="Cognome"
          value={form.cognome}
          onChange={e => setForm({ ...form, cognome: e.target.value })}
        />

        <input
          className="col-span-2 bg-black/20 p-3 rounded-lg border border-white/10"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />

        <input
          className="col-span-2 bg-black/20 p-3 rounded-lg border border-white/10"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <select
          className="col-span-2 bg-black/20 p-3 rounded-lg border border-white/10"
          value={form.ruolo}
          onChange={e => setForm({ ...form, ruolo: e.target.value })}
        >
          <option value="cliente">Cliente</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </select>

        {form.ruolo === "cliente" && (
          <select
            className="col-span-2 bg-black/20 p-3 rounded-lg border border-white/10"
            value={form.coach_id}
            onChange={e => setForm({ ...form, coach_id: e.target.value })}
          >
            <option value="">Seleziona coach</option>
            {coachList.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome} {c.cognome}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        onClick={createUser}
        disabled={loading}
        className="mt-6 w-full bg-nutriPrimary hover:bg-nutriAccent transition p-3 rounded-xl text-black font-semibold flex items-center justify-center"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Crea utente"}
      </button>
    </div>
  )
}
