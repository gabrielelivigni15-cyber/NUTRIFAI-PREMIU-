
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "../../lib/supabaseClient"
import { Dumbbell, ShieldCheck } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-5xl grid md:grid-cols-2 gap-10 items-center"
      >
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 border border-white/10 text-xs text-gray-300">
            <ShieldCheck className="w-3 h-3 text-nutriPrimary" />
            Area riservata Nutrifai Coach
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Trasforma i tuoi clienti
            <span className="block text-nutriPrimary">una sessione alla volta.</span>
          </h1>

          <p className="text-sm md:text-base text-gray-300 max-w-md">
            Gestisci schede di allenamento, piani alimentari e progressi da un&apos;unica
            piattaforma pensata per personal trainer esigenti.
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-nutriPrimary/80 border border-nutriBg" />
              <div className="w-7 h-7 rounded-full bg-nutriAccent/80 border border-nutriBg" />
              <div className="w-7 h-7 rounded-full bg-white/70 border border-nutriBg" />
            </div>
            <span>Clienti sempre connessi alla loro area personale.</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-nutriPrimary/40 via-nutriAccent/40 to-transparent blur-xl opacity-60" />
          <div className="relative rounded-3xl border border-white/10 bg-nutriCard/90 backdrop-blur-2xl px-6 py-7 md:px-8 md:py-9 shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Benvenuto
                </p>
                <p className="text-lg font-medium">Accedi alla console</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-nutriPrimary to-nutriAccent flex items-center justify-center text-nutriBg shadow-lg">
                <Dumbbell className="w-5 h-5" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none ring-0 focus:border-nutriPrimary/80"
                  placeholder="tuoindirizzo@mail.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none ring-0 focus:border-nutriPrimary/80"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/30 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-nutriPrimary to-nutriAccent text-nutriBg text-sm font-semibold py-2.5 mt-2 shadow-[0_16px_40px_rgba(0,0,0,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Accesso in corso..." : "Accedi"}
              </button>
            </form>

            <p className="mt-4 text-[11px] text-gray-400">
              Accesso riservato a trainer e clienti Nutrifai. Se non hai ancora un account,
              contatta il tuo coach.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
