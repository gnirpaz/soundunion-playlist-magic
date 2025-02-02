"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Navigation from "./components/Navigation"
import PlaylistCreationFlow from "./components/PlaylistCreationFlow"
import AllPlaylists from "./components/AllPlaylists"
import AuthDialog from "./components/AuthDialog"

export default function Home() {
  const { data: session, status } = useSession()
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(true)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)

  const handleViewAllPlaylists = () => {
    setIsCreatingPlaylist(false)
  }

  const handleStartCreatingPlaylist = () => {
    setIsCreatingPlaylist(true)
  }

  const handleCreatePlaylist = () => {
    if (!session) {
      setIsAuthDialogOpen(true)
    } else {
      // Proceed with playlist creation
      console.log("Creating playlist...")
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-sans">
      {/* Ambient background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4b006912_1px,transparent_1px),linear-gradient(to_bottom,#4b006912_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      <div className="relative p-8">
        <Navigation
          onViewAllPlaylists={handleViewAllPlaylists}
          onStartCreatingPlaylist={handleStartCreatingPlaylist}
          session={session}
          status={status}
        />
        <div className="container mx-auto px-4 py-6 sm:py-12">
          <div className="max-w-5xl mx-auto">
            <div className="relative p-8">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-3xl blur-xl opacity-75" />

              {/* Main content */}
              <div className="relative">
                <div className="bg-gradient-to-b from-purple-900 to-black rounded-3xl shadow-2xl border border-purple-500/10 backdrop-blur-xl">
                  <div className="">
                    {isCreatingPlaylist ? (
                      <PlaylistCreationFlow onCreatePlaylist={handleCreatePlaylist} />
                    ) : (
                      <AllPlaylists />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AuthDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </div>
  )
}

