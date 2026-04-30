import { ChevronDown, Plus, Search } from 'lucide-react'

export function TeamsToolbar() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            placeholder="Search teams…"
            className="h-10 w-full rounded-xl border border-transparent bg-surface-2 pl-9 pr-4 text-sm placeholder:text-ink-soft focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div className="relative">
          <select
            defaultValue=""
            aria-label="Sort"
            className="h-10 appearance-none rounded-xl border border-border bg-surface pl-3 pr-9 text-sm font-medium text-ink hover:bg-surface-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Sort: Most active</option>
            <option>Sort: Largest team</option>
            <option>Sort: Newest</option>
            <option>Sort: A → Z</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
        </div>

        <button className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90">
          <Plus className="size-4" />
          Create team
        </button>
      </div>
    </div>
  )
}
