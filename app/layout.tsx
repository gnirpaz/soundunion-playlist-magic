"use client"

import { Space_Grotesk, Outfit } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { DebugProvider } from "@/app/providers/DebugProvider"
import { SpotifyPlayerProvider } from '@/app/providers/SpotifyPlayerProvider'
import LayoutContent from "@/app/components/LayoutContent"

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: "--font-display"
})

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-body"
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${outfit.variable}`}>
      <body className="font-body">
        <DebugProvider>
          <SessionProvider>
            <SpotifyPlayerProvider>
              <LayoutContent>
                {children}
              </LayoutContent>
            </SpotifyPlayerProvider>
          </SessionProvider>
        </DebugProvider>
      </body>
    </html>
  )
}

