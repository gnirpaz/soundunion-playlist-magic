import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import type React from "react" // Added import for React
import { DebugProvider } from "@/app/providers/DebugProvider"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DebugProvider>
          <SessionProvider>
            <div className="pr-[400px]"> {/* Add padding for debug panel */}
              {children}
            </div>
          </SessionProvider>
        </DebugProvider>
      </body>
    </html>
  )
}

