"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import { Users, Loader2 } from "lucide-react"

export default function CoachClientiPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clienti, setClienti] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")

      // prendo l'utente loggato
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // prendo il profilo
      const { data: profilo, error: errProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (errProfile || !profilo) {
        setError("Profilo non trovato.")
        setLoading(false)
        return
      }

      if (profilo.ruolo !== "coach") {
        setError("Non sei un coach, non puoi vedere questa pagina.")
        setLoading(false)
        return
      }

      // prendo i clienti che hanno questo coach_id
      const { data: clienti, error: errClienti } = await supabase
        .from("profiles")
        .select("*")
        .eq("coach_id", profilo.id)
        .eq("ruolo", "cliente")
        .order("cognome", { ascending: true })

      if (errClienti) {
        console.error(errClienti)
        setError("Errore nel caricamento dei clienti.")
        setLoading(false)
        return
      }

      setClienti(clienti || [])
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Caricamento clienti...
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-nutriPrimary" />
        <h1 className="text-lg md:text-2xl font-semibold">
          I miei <span className="text-nutriPrimary">clienti</span>
        </h1>
      </div>

      {clienti.length === 0 ? (
        <p className="text-sm text-gray-400">
          Non hai ancora clienti assegnati.
        </p>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <table className="w-full text-xs md:text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Stato</th>
              </tr>
            </thead>
            <tbody>
              {clienti.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="py-2 pr-3">
                    {c.nome} {c.cognome}
                  </td>
                  <td className="py-2 pr-3 text-gray-300">
                    {c.email || "-"}
                  </td>
                  <td className="py-2 pr-3">
                    {c.is_active ? "✅ Attivo" : "❌ Disattivato"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
