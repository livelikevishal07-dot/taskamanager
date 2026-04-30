import { cn } from '@/lib/utils'

const AVATAR_PALETTE = [
  'bg-violet/15 text-violet',
  'bg-sky/15 text-sky',
  'bg-indigo/15 text-indigo',
  'bg-coral/15 text-coral',
  'bg-emerald/15 text-emerald',
  'bg-amber/15 text-amber',
] as const

function hashIndex(seed: string, mod: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h) % mod
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name, size = 'md', className }: Props) {
  const colour = AVATAR_PALETTE[hashIndex(name, AVATAR_PALETTE.length)]
  const sizeClass =
    size === 'sm'
      ? 'size-7 text-[10px]'
      : size === 'lg'
        ? 'size-12 text-sm'
        : 'size-9 text-xs'

  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-semibold tracking-wide',
        sizeClass,
        colour,
        className
      )}
    >
      {initialsOf(name)}
    </span>
  )
}

interface StackProps {
  names: string[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarStack({ names, max = 4, size = 'sm' }: StackProps) {
  const visible = names.slice(0, max)
  const overflow = names.length - visible.length
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((n) => (
        <Avatar
          key={n}
          name={n}
          size={size}
          className="ring-2 ring-surface"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-grid shrink-0 place-items-center rounded-full bg-surface-2 font-semibold text-ink-muted ring-2 ring-surface',
            size === 'sm'
              ? 'size-7 text-[10px]'
              : size === 'lg'
                ? 'size-12 text-sm'
                : 'size-9 text-xs'
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
