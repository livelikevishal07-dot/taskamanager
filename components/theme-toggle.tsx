'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === 'dark'

  return (
    <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors',
          !isDark && 'bg-canvas text-ink shadow-sm'
        )}
      >
        <Sun className="size-3.5" />
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors',
          isDark && 'bg-canvas text-ink shadow-sm'
        )}
      >
        <Moon className="size-3.5" />
        Dark
      </button>
    </div>
  )
}
