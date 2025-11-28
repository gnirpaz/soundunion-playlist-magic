"use client"

import { Session } from "next-auth"
import { signIn, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type UserMenuProps = {
  session: Session | null
  status: "loading" | "authenticated" | "unauthenticated"
}

export default function UserMenu({ session, status }: UserMenuProps) {
  if (status === "loading") {
    return (
      <Avatar className="h-8 w-8 bg-transparent border-2 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
        <AvatarFallback className="text-purple-300">...</AvatarFallback>
      </Avatar>
    )
  }

  if (!session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-8 w-8 cursor-pointer bg-transparent border-2 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <AvatarFallback className="text-purple-300 bg-transparent">
              <User className="h-4 w-4 text-purple-100" />
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-[200px] bg-black/90 border border-purple-500/20 p-0"
        >
          <button
            onClick={() => signIn('spotify')}
            className="w-full px-4 py-3 flex items-center gap-2 text-purple-200 hover:text-purple-100 hover:bg-purple-500/10 transition-colors"
          >
            <img src="/spotify-logo.png" alt="Spotify" className="h-5 w-5" />
            <span className="text-base">Sign in with Spotify</span>
          </button>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer bg-transparent border-2 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
          <AvatarFallback className="text-purple-300 bg-transparent">
            {session.user?.name?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[200px] bg-black/90 border-purple-500/20"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-purple-100">{session.user?.name}</p>
            <p className="text-xs leading-none text-purple-300">{session.user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-purple-500/20" />
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="cursor-pointer text-purple-300 hover:text-purple-100 hover:bg-purple-500/10"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 