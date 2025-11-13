"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import { Dumbbell, Loader2 } from "lucide-react"

export default function UserAllenamentiPage() {
  const router = useRouter()
  const [profilo, setProfilo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error || !data) {
        setError("Profilo non trovato.")
        setLoading(false)
        return
      }

      if (data.ruolo !== "cliente") {
        setError("Questa pagina è riservata ai clienti.")
        setLoading(false)
        return
      }

      setProfilo(data)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Caricamento allenamenti...
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="w-4 h-4 text-nutriPrimary" />
        <h1 className="text-lg md:text-2xl font-semibold">
          I miei <span className="text-nutriPrimary">allenamenti</span>
        </h1>
      </div>

      <p className="text-sm text-gray-300">
        Ciao {profilo.nome || ""}, qui vedrai la tua scheda di allenamento,
        divisa per giorni e gruppi muscolari. Questa sezione la colleghiamo
        alle tabelle delle schede nella prossima fase.
      </p>

      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-gray-400">
        Nessuna scheda ancora collegata.  
        Parla con il tuo coach per farti assegnare un programma.
      </div>
    </div>
  )
}
