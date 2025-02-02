"use client"

import Link from "next/link"
import { Session } from "next-auth"
import UserMenu from "@/app/components/UserMenu"

type NavigationProps = {
  session: Session | null
  status: "loading" | "authenticated" | "unauthenticated"
}

export default function Navigation({ session, status }: NavigationProps) {
  return (
    <nav className="bg-black/50 backdrop-blur-md border-b border-purple-500/10 mb-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 space-y-4 sm:space-y-0">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
            Playlist Creator
          </Link>
          <div className="flex space-x-4 items-center">
            <Link href="/new" className="text-purple-300 hover:text-purple-100">
              Create New
            </Link>
            <Link href="/playlists" className="text-purple-300 hover:text-purple-100">
              My Playlists
            </Link>
            <UserMenu session={session} status={status} />
          </div>
        </div>
      </div>
    </nav>
  )
}

