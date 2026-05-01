export default function OfflinePage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Officely — You're offline</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            min-height: 100svh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background: #f8f7ff;
            font-family: system-ui, -apple-system, sans-serif;
            padding: 24px;
            text-align: center;
          }
          .icon {
            width: 72px; height: 72px;
            background: #6F5CFF;
            border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
          }
          .icon svg { width: 40px; height: 40px; }
          h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; }
          p  { font-size: 14px; color: #6b7280; max-width: 300px; line-height: 1.6; }
          a  {
            margin-top: 8px;
            display: inline-flex; align-items: center; gap: 6px;
            background: #6F5CFF; color: white;
            padding: 10px 20px; border-radius: 12px;
            font-size: 14px; font-weight: 600; text-decoration: none;
          }
        `}</style>
      </head>
      <body>
        <div className="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h1>You&apos;re offline</h1>
        <p>No internet connection. Please check your network and try again.</p>
        <a href="/employee">
          ↩ Go back to app
        </a>
      </body>
    </html>
  )
}
