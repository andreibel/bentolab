const MOCK = [
  { name: 'Alex Kim',    initials: 'AK', color: '#3B82F6', commits: 12, issuesClosed: 5, comments: 18 },
  { name: 'Sara Chen',   initials: 'SC', color: '#8B5CF6', commits: 8,  issuesClosed: 3, comments: 24 },
  { name: 'Mike Ross',   initials: 'MR', color: '#10B981', commits: 15, issuesClosed: 7, comments: 9  },
  { name: 'Lena Park',   initials: 'LP', color: '#F59E0B', commits: 6,  issuesClosed: 8, comments: 12 },
  { name: 'David Nolan', initials: 'DN', color: '#EF4444', commits: 3,  issuesClosed: 2, comments: 6  },
]

const maxScore = Math.max(...MOCK.map((m) => m.issuesClosed * 3 + m.comments + m.commits))

export function TeamActivityWidget({ boardId: _ }: { boardId: string }) {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="mb-1 grid grid-cols-4 gap-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        <span className="col-span-2">Member</span>
        <span className="text-center">Closed</span>
        <span className="text-center">Comments</span>
      </div>
      {MOCK.sort((a, b) => (b.issuesClosed * 3 + b.comments) - (a.issuesClosed * 3 + a.comments)).map((m) => {
        const score = m.issuesClosed * 3 + m.comments + m.commits
        const pct   = (score / maxScore) * 100
        return (
          <div key={m.name} className="grid grid-cols-4 items-center gap-2">
            <div className="col-span-2 flex items-center gap-2">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-text-primary">{m.name}</p>
                <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: m.color }} />
                </div>
              </div>
            </div>
            <span className="text-center text-xs font-semibold text-text-primary">{m.issuesClosed}</span>
            <span className="text-center text-xs font-semibold text-text-primary">{m.comments}</span>
          </div>
        )
      })}
    </div>
  )
}
