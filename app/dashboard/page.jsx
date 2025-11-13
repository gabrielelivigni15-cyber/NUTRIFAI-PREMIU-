
export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold">
        Benvenuto nella tua <span className="text-nutriPrimary">dashboard</span>
      </h1>
      <p className="text-sm text-gray-300 max-w-xl">
        Qui in futuro vedrai riassunti veloci: allenamenti assegnati, progressi recenti,
        scadenze abbonamenti e notifiche dai tuoi coach.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm">
          <p className="text-xs text-gray-400 mb-1">Prossimo allenamento</p>
          <p className="font-medium">Da definire</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm">
          <p className="text-xs text-gray-400 mb-1">Piano alimentare</p>
          <p className="font-medium">Attivo</p>
        </div>
        <div className="rounded-2xl border border_WHITE/10 bg-black/40 px-4 py-3 text-sm">
          <p className="text-xs text-gray-400 mb-1">Stato abbonamento</p>
          <p className="font-medium">Da collegare a Supabase</p>
        </div>
      </div>
    </div>
  )
}
