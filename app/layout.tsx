import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  maximumScale:       1,   // prevent iOS auto-zoom on input focus
  userScalable:       false,
  themeColor:         '#6F5CFF',
  viewportFit:        'cover', // respect iPhone notch / home indicator
}

export const metadata: Metadata = {
  title:         'Officely',
  description:   'Your office companion — tasks, attendance, leave & bookings',
  applicationName: 'Officely',
  appleWebApp: {
    capable:           true,
    title:             'Officely',
    statusBarStyle:    'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon:             '/icon.svg',
    apple:            '/icon.svg',
    shortcut:         '/icon.svg',
  },
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* iOS PWA full-screen */}
        <meta name="mobile-web-app-capable" content="yes" />
        {/* MS Tile */}
        <meta name="msapplication-TileColor" content="#6F5CFF" />
        <meta name="msapplication-TileImage" content="/icon.svg" />
      </head>
      <body className="min-h-screen bg-canvas font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
