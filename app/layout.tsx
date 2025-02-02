import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import type React from "react"
import { DebugProvider } from "@/app/providers/DebugProvider"
import { SpotifyPlayerProvider } from '@/app/providers/SpotifyPlayerProvider'

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DebugProvider>
          <SessionProvider>
            <SpotifyPlayerProvider>
              {children}
            </SpotifyPlayerProvider>
          </SessionProvider>
        </DebugProvider>
      </body>
    </html>
  )
}

