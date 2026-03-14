const MOCK_MEMBERS = [
  { name: 'Alex Kim',    initials: 'AK', color: '#3B82F6', open: 7, inProgress: 3, done: 12 },
  { name: 'Sara Chen',   initials: 'SC', color: '#8B5CF6', open: 4, inProgress: 2, done: 8  },
  { name: 'Mike Ross',   initials: 'MR', color: '#10B981', open: 9, inProgress: 4, done: 5  },
  { name: 'Lena Park',   initials: 'LP', color: '#F59E0B', open: 2, inProgress: 1, done: 15 },
  { name: 'David Nolan', initials: 'DN', color: '#EF4444', open: 6, inProgress: 5, done: 3  },
]

const HIGH_LOAD = 6

export function WorkloadWidget({ boardId: _ }: { boardId: string }) {
  const maxTotal = Math.max(...MOCK_MEMBERS.map((m) => m.open + m.inProgress + m.done))

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Open issues per member</p>
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-primary/40" /> Open</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-primary" /> In Progress</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {MOCK_MEMBERS.map((m) => {
          const total    = m.open + m.inProgress + m.done
          const openPct  = (m.open / maxTotal) * 100
          const inPct    = (m.inProgress / maxTotal) * 100
          const overloaded = m.open >= HIGH_LOAD

          return (
            <div key={m.name} className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.initials}
              </div>

              {/* Name */}
              <span className="w-24 shrink-0 truncate text-xs text-text-primary">{m.name}</span>

              {/* Bar */}
              <div className="flex flex-1 items-center gap-1">
                <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full bg-primary/40 transition-all"
                    style={{ width: `${openPct}%` }}
                    title={`Open: ${m.open}`}
                  />
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${inPct}%` }}
                    title={`In Progress: ${m.inProgress}`}
                  />
                </div>
              </div>

              {/* Count + overload badge */}
              <div className="flex w-16 shrink-0 items-center justify-end gap-1.5">
                <span className="text-xs font-semibold text-text-primary">{m.open + m.inProgress}</span>
                {overloaded && (
                  <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">
                    High
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-auto border-t border-surface-border pt-2">
        <p className="text-[11px] text-text-muted">
          {MOCK_MEMBERS.filter((m) => m.open >= HIGH_LOAD).length} member(s) with high load (≥{HIGH_LOAD} open issues)
        </p>
      </div>
    </div>
  )
}
