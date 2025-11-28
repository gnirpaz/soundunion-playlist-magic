"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Search, Music, Plus, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getUserPlaylists, UserPlaylist } from "@/app/utils/spotify"
import Link from "next/link"

export default function PlaylistsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [filteredPlaylists, setFilteredPlaylists] = useState<UserPlaylist[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/new")
      return
    }

    if (session?.accessToken) {
      loadPlaylists()
    }
  }, [session?.accessToken, status])

  useEffect(() => {
    if (searchTerm) {
      const filtered = playlists.filter((playlist) =>
        playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPlaylists(filtered)
    } else {
      setFilteredPlaylists(playlists)
    }
  }, [searchTerm, playlists])

  async function loadPlaylists() {
    if (!session?.accessToken) return

    setIsLoading(true)
    setError(null)

    try {
      const { playlists: userPlaylists } = await getUserPlaylists(session.accessToken)
      setPlaylists(userPlaylists)
      setFilteredPlaylists(userPlaylists)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlists")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-8 p-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
            Your Playlists
          </h2>
          <p className="text-purple-300/60 font-light">Loading your musical universes...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-purple-900/20 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 p-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
            Something went wrong
          </h2>
          <p className="text-red-400">{error}</p>
          <Button onClick={loadPlaylists} className="bg-purple-500 hover:bg-purple-400">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
          Your Playlists
        </h2>
        <p className="text-purple-300/60 font-light">Explore your musical universes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
          <Input
            type="text"
            placeholder="Search playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/50 border-purple-500/20 text-purple-100 placeholder-purple-300/40 focus:border-purple-500 focus:ring-purple-500/20"
          />
        </div>
        <Link href="/new">
          <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400">
            <Plus size={20} className="mr-2" />
            Create New
          </Button>
        </Link>
      </div>

      {filteredPlaylists.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-24 h-24 mx-auto bg-purple-900/30 rounded-full flex items-center justify-center">
            <Music size={40} className="text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-purple-200">
            {searchTerm ? "No playlists found" : "No playlists yet"}
          </h3>
          <p className="text-purple-300/60 max-w-md mx-auto">
            {searchTerm
              ? "Try a different search term"
              : "Create your first playlist to get started!"}
          </p>
          {!searchTerm && (
            <Link href="/new">
              <Button className="mt-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400">
                <Plus size={20} className="mr-2" />
                Create Your First Playlist
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlaylists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
            >
              {playlist.images[0]?.url ? (
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-fuchsia-900 flex items-center justify-center">
                  <Music size={48} className="text-purple-300/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-semibold truncate">{playlist.name}</h3>
                <p className="text-sm text-purple-300">{playlist.tracks.total} songs</p>
              </div>
              <a
                href={playlist.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ExternalLink size={16} className="text-white" />
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

