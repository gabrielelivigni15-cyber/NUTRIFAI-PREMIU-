"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import { Dumbbell, LogOut, Users, LineChart, Salad } from "lucide-react"

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [fatalError, setFatalError] = useState("")

  useEffect(() => {
    const load = async () => {
      setFatalError("")

      // 1) sessione (più affidabile per capire se sei loggato)
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (!session?.user) {
        router.replace("/login")
        return
      }

      const user = session.user

      // 2) prova a leggere profilo
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (profErr) {
        // QUI di solito è RLS (policy mancante) -> non fare loop sul login
        setFatalError(`Errore lettura profilo: ${profErr.message}`)
        return
      }

      // 3) se non esiste profilo, prova a crearlo (evita loop)
      if (!prof) {
        const { error: insErr } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            ruolo: "cliente" // cambia default se vuoi
          })

        if (insErr) {
          setFatalError(`Profilo mancante e non posso crearlo: ${insErr.message}`)
          return
        }

        const { data: prof2, error: prof2Err } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (prof2Err) {
          setFatalError(`Profilo creato ma non leggibile: ${prof2Err.message}`)
          return
        }

        setProfile(prof2)
        return
      }

      setProfile(prof)
    }

    load()
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  if (fatalError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-sm">
          <p className="font-semibold text-red-300 mb-2">Accesso ok, ma profilo bloccato</p>
          <p className="text-red-200/90">{fatalError}</p>
          <p className="text-red-200/70 mt-3">
            Quasi sempre è una policy RLS su Supabase o manca la riga in <b>profiles</b>.
          </p>
          <button
            onClick={logout}
            className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs hover:bg-white/15"
          >
            Esci
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        Caricamento area personale...
      </div>
    )
  }

  const isAdmin = profile.ruolo === "admin"
  const isCoach = profile.ruolo === "coach"
  const isCliente = profile.ruolo === "cliente"

  return (
    <div className="min-h-screen bg-nutriBg text-gray-100 flex">
      <aside className="hidden md:flex flex-col w-64 bg-black/40 border-r border-white/5 backdrop-blur-2xl p-5 gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-nutriPrimary to-nutriAccent flex items-center justify-center text-nutriBg">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-[0.18em]">Nutrifai</p>
            <p className="text-sm font-medium">Coach Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 text-sm">
          <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
            <LineChart className="w-4 h-4" />
            <span>Overview</span>
          </a>

          {isAdmin && (
            <>
              <a href="/dashboard/admin/utenti" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5">
                <Users className="w-4 h-4" />
                <span>Gestione utenti</span>
              </a>
              <a href="/dashboard/admin/schede" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5">
                <Dumbbell className="w-4 h-4" />
                <span>Schede allenamento</span>
              </a>
              <a href="/dashboard/admin/alimentazione" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5">
                <Salad className="w-4 h-4" />
                <span>Piani alimentari</span>
              </a>
            </>
          )}

          {isCoach && (
            <>
              <a href="/dashboard/coach/clienti" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5">
                <Users className="w-4 h-4" />
                <span>I miei clienti</span>
              </a>
              <a href="/dashboard/coach/schede" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5">
                <Dumbbell className="w-4 h-4" />
                <span>Schede create</span>
              </a>
            </>
          )}

          {isCliente && (
            <>
              <a href="/dashboard/user/allenamenti" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5">
                <Dumbbell className="w-4 h-4" />
                <span>I miei allenamenti</span>
              </a>
              <a href="/dashboard/user/alimentazione" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5">
                <Salad className="w-4 h-4" />
                <span>Il mio piano alimentare</span>
              </a>
            </>
          )}
        </nav>

        <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/5">
          <LogOut className="w-4 h-4" />
          Esci
        </button>
      </aside>

      <main className="flex-1 min-h-screen px-4 py-4 md:px-8 md:py-6">
        {children}
      </main>
    </div>
  )
}
