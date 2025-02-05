"use client"

import Link from "next/link"
import { Session } from "next-auth"
import UserMenu from "@/app/components/UserMenu"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type NavigationProps = {
  session: Session | null
  status: "loading" | "authenticated" | "unauthenticated"
}

export default function Navigation({ session, status }: NavigationProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/new') {
      return pathname === '/new'
    }
    if (path === '/playlists') {
      return pathname === '/playlists' || pathname.startsWith('/playlist/')
    }
    return false
  }

  return (
    <nav className="bg-black/50 backdrop-blur-md border-b border-purple-500/10 mb-8">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              Playlist Creator
            </Link>
            <div className="flex space-x-4">
              <Link 
                href="/new" 
                className={cn(
                  "text-purple-300 hover:text-purple-100 relative py-1",
                  isActive('/new') && "text-purple-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-500 after:rounded-full"
                )}
              >
                Create New
              </Link>
              <Link 
                href="/playlists" 
                className={cn(
                  "text-purple-300 hover:text-purple-100 relative py-1",
                  isActive('/playlists') && "text-purple-100 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-purple-500 after:rounded-full"
                )}
              >
                My Playlists
              </Link>
            </div>
          </div>
          <UserMenu session={session} status={status} />
        </div>
      </div>
    </nav>
  )
}

