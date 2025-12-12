"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import { Dumbbell, LogOut, Users, LineChart, Salad } from "lucide-react"

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState("cliente")
  const [fatalError, setFatalError] = useState("")

  // ✅ Active helpers (fix: Overview non deve essere attivo su /dashboard/...)
  const isExact = (href) => pathname === href
  const isSection = (href) => pathname.startsWith(href + "/")

  useEffect(() => {
    const load = async () => {
      setFatalError("")

      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (!session?.user) {
        router.replace("/login")
        return
      }

      const user = session.user

      // ruolo da user_roles
      const { data: roleRow, error: roleErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()

      if (roleErr) {
        setFatalError(`Errore lettura ruolo: ${roleErr.message}`)
        return
      }
      setRole(roleRow?.role ?? "cliente")

      // profilo
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (profErr) {
        setFatalError(`Errore lettura profilo: ${profErr.message}`)
        return
      }

      // se manca, prova a crearlo
      if (!prof) {
        const { error: insErr } = await supabase
          .from("profiles")
          .insert({ id: user.id, email: user.email })

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
          <p className="font-semibold text-red-300 mb-2">Errore accesso dashboard</p>
          <p className="text-red-200/90">{fatalError}</p>
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

  const isAdmin = role === "admin"
  const isCoach = role === "coach"
  const isCliente = role === "cliente"

  const baseLink =
    "flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"

  const linkCls = (active) =>
    `${baseLink} ${active ? "bg-white/5" : "hover:bg-white/5"}`

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
          {/* ✅ Overview SOLO exact */}
          <a href="/dashboard" className={linkCls(isExact("/dashboard"))}>
            <LineChart className="w-4 h-4" />
            <span>Overview</span>
          </a>

          {isAdmin && (
            <>
              <a
                href="/dashboard/admin/utenti"
                className={linkCls(isSection("/dashboard/admin/utenti") || isExact("/dashboard/admin/utenti"))}
              >
                <Users className="w-4 h-4" />
                <span>Gestione utenti</span>
              </a>

              <a
                href="/dashboard/admin/schede"
                className={linkCls(isSection("/dashboard/admin/schede") || isExact("/dashboard/admin/schede"))}
              >
                <Dumbbell className="w-4 h-4" />
                <span>Schede allenamento</span>
              </a>

              <a
                href="/dashboard/admin/alimentazione"
                className={linkCls(isSection("/dashboard/admin/alimentazione") || isExact("/dashboard/admin/alimentazione"))}
              >
                <Salad className="w-4 h-4" />
                <span>Piani alimentari</span>
              </a>
            </>
          )}

          {isCoach && (
            <>
              <a
                href="/dashboard/coach/clienti"
                className={linkCls(isSection("/dashboard/coach/clienti") || isExact("/dashboard/coach/clienti"))}
              >
                <Users className="w-4 h-4" />
                <span>I miei clienti</span>
              </a>

              <a
                href="/dashboard/coach/schede"
                className={linkCls(isSection("/dashboard/coach/schede") || isExact("/dashboard/coach/schede"))}
              >
                <Dumbbell className="w-4 h-4" />
                <span>Schede create</span>
              </a>
            </>
          )}

          {isCliente && (
            <>
              <a
                href="/dashboard/user/allenamenti"
                className={linkCls(isSection("/dashboard/user/allenamenti") || isExact("/dashboard/user/allenamenti"))}
              >
                <Dumbbell className="w-4 h-4" />
                <span>I miei allenamenti</span>
              </a>

              <a
                href="/dashboard/user/alimentazione"
                className={linkCls(isSection("/dashboard/user/alimentazione") || isExact("/dashboard/user/alimentazione"))}
              >
                <Salad className="w-4 h-4" />
                <span>Il mio piano alimentare</span>
              </a>
            </>
          )}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/5"
        >
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
