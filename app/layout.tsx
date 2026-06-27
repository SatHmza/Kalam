export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Kalam — Gestion scolaire',
  description: 'Plateforme de gestion et communication pour les écoles privées au Maroc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
