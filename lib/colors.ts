// Shared color palette used across settings panels, task cards, etc.

export type AccentColor =
  | 'violet'
  | 'sky'
  | 'indigo'
  | 'coral'
  | 'emerald'
  | 'amber'

export const COLOR_OPTIONS: AccentColor[] = [
  'violet',
  'sky',
  'indigo',
  'coral',
  'emerald',
  'amber',
]

export const COLOR_TONE: Record<
  AccentColor,
  { bg: string; chip: string; bar: string; text: string }
> = {
  violet: {
    bg: 'bg-violet',
    chip: 'bg-violet/12 text-violet',
    bar: 'bg-violet',
    text: 'text-violet',
  },
  sky: {
    bg: 'bg-sky',
    chip: 'bg-sky/12 text-sky',
    bar: 'bg-sky',
    text: 'text-sky',
  },
  indigo: {
    bg: 'bg-indigo',
    chip: 'bg-indigo/12 text-indigo',
    bar: 'bg-indigo',
    text: 'text-indigo',
  },
  coral: {
    bg: 'bg-coral',
    chip: 'bg-coral/12 text-coral',
    bar: 'bg-coral',
    text: 'text-coral',
  },
  emerald: {
    bg: 'bg-emerald',
    chip: 'bg-emerald/12 text-emerald',
    bar: 'bg-emerald',
    text: 'text-emerald',
  },
  amber: {
    bg: 'bg-amber',
    chip: 'bg-amber/15 text-amber',
    bar: 'bg-amber',
    text: 'text-amber',
  },
}
