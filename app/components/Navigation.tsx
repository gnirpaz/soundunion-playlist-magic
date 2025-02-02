import { List, PlusCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Session } from "next-auth"
import { signOut } from "next-auth/react"

interface NavigationProps {
  onViewAllPlaylists: () => void
  onStartCreatingPlaylist: () => void
  session: Session | null
  status: "loading" | "authenticated" | "unauthenticated"
}

export default function Navigation({ onViewAllPlaylists, onStartCreatingPlaylist, session, status }: NavigationProps) {
  return (
    <nav className="bg-black/50 backdrop-blur-md border-b border-purple-500/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
            Playlist Creator
          </h1>
          <div className="flex space-x-4 items-center">
            <Button variant="ghost" onClick={onViewAllPlaylists} className="text-purple-300 hover:text-purple-100">
              <List size={20} className="mr-2" />
              <span className="hidden sm:inline">View All Playlists</span>
              <span className="sm:hidden">All</span>
            </Button>
            <Button variant="ghost" onClick={onStartCreatingPlaylist} className="text-purple-300 hover:text-purple-100">
              <PlusCircle size={20} className="mr-2" />
              <span className="hidden sm:inline">Create Playlist</span>
              <span className="sm:hidden">Create</span>
            </Button>
            {status === "authenticated" && session?.user && (
              <div className="flex items-center space-x-2">
                <span className="text-purple-300">{session.user.name}</span>
                <Button variant="ghost" onClick={() => signOut()} className="text-purple-300 hover:text-purple-100">
                  <User size={20} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

