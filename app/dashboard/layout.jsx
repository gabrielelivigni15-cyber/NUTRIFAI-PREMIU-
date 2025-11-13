"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import { Dumbbell, LogOut, Users, LineChart, Salad } from "lucide-react"

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!data) {
        router.push("/login")
        return
      }

      setProfile(data)
    }
    load()
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
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
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-black/40 border-r border-white/5 backdrop-blur-2xl p-5 gap-6">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-nutriPrimary to-nutriAccent flex items-center justify-center text-nutriBg">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-[0.18em]">Nutrifai</p>
            <p className="text-sm font-medium">Coach Console</p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 space-y-1 text-sm">

          {/* COMMON */}
          <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
            <LineChart className="w-4 h-4" />
            <span>Overview</span>
          </a>

          {/* ADMIN MENU */}
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

          {/* COACH MENU */}
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

          {/* CLIENTE MENU */}
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

        {/* LOGOUT */}
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
