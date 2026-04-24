import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'P4RS3LT0NGV3',
  description: 'Universal Text Translator & Steganography Tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/NotoSansSignWriting-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
