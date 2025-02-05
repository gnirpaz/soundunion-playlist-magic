"use client"

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signIn, signOut } from "next-auth/react"

export function UserAvatar() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback>...</AvatarFallback>
      </Avatar>
    )
  }

  if (!session) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => signIn('spotify')}
        className="gap-2"
      >
        <img src="/spotify-logo.svg" alt="Spotify" className="h-4 w-4" />
        Sign in
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
          <AvatarFallback>{session.user?.name?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 