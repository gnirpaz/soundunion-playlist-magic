"use client"

import { Session } from "next-auth"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

type UserMenuProps = {
  session: Session | null
  status: "loading" | "authenticated" | "unauthenticated"
}

export default function UserMenu({ session, status }: UserMenuProps) {
  if (status === "authenticated" && session?.user) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-purple-300">{session.user.name}</span>
        <Button variant="ghost" onClick={() => signOut()} className="text-purple-300 hover:text-purple-100">
          <User size={20} />
        </Button>
      </div>
    )
  }
  return null
} 