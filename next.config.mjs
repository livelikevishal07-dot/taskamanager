/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Service workers must be served with these headers:
        // - Service-Worker-Allowed: / → grants root scope even though file is at /sw.js
        // - Cache-Control: no-cache  → browser always revalidates so SW updates are picked up
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
}
export default nextConfig
