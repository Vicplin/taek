export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Logo mark */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white text-xl font-black">T</span>
        </div>
        <span className="text-3xl font-black text-surface tracking-tight">TAEK</span>
      </div>

      {/* Status */}
      <div className="text-center max-w-md">
        <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          ✓ Phase 0 — Skeleton Deployed
        </span>
        <h1 className="text-2xl font-bold text-surface mb-2">
          Taekwondo Registration &amp; Management Platform
        </h1>
        <p className="text-gray-500 text-sm">
          Malaysia / Southeast Asia · Coming Soon
        </p>
      </div>

      {/* Phase checklist */}
      <div className="mt-10 w-full max-w-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Build Progress</p>
        <ul className="space-y-2 text-sm">
          {[
            { label: 'Phase 0 — Setup & Deploy',         done: true  },
            { label: 'Phase 1 — Auth + Roles',            done: false },
            { label: 'Phase 2 — Core Profiles',           done: false },
            { label: 'Phase 3 — Event System',            done: false },
            { label: 'Phase 4 — Registration Engine',     done: false },
            { label: 'Phase 5 — Approval Workflow',       done: false },
            { label: 'Phase 6 — Payment System',          done: false },
            { label: 'Phase 7 — Polish & Pilot Launch',   done: false },
          ].map((phase) => (
            <li key={phase.label} className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                phase.done
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {phase.done ? '✓' : '○'}
              </span>
              <span className={phase.done ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                {phase.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-12 text-xs text-gray-300">
        Building the future of Taekwondo, one bout at a time.
      </p>
    </main>
  )
}
