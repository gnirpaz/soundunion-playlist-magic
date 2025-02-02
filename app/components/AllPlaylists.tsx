import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Playlist {
  id: string
  name: string
  songCount: number
  coverUrl: string
}

export default function AllPlaylists() {
  const initialPlaylists: Playlist[] = [
    { id: "1", name: "Summer Vibes", songCount: 15, coverUrl: "/placeholder.svg?height=400&width=400" },
    { id: "2", name: "Workout Mix", songCount: 20, coverUrl: "/placeholder.svg?height=400&width=400" },
    { id: "3", name: "Chill Evenings", songCount: 12, coverUrl: "/placeholder.svg?height=400&width=400" },
    { id: "4", name: "Road Trip Tunes", songCount: 25, coverUrl: "/placeholder.svg?height=400&width=400" },
    { id: "5", name: "Coding Focus", songCount: 18, coverUrl: "/placeholder.svg?height=400&width=400" },
    { id: "6", name: "Party Anthems", songCount: 30, coverUrl: "/placeholder.svg?height=400&width=400" },
  ]

  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const filteredPlaylists = initialPlaylists.filter((playlist) =>
      playlist.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setPlaylists(filteredPlaylists)
  }, [searchTerm])

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
          Your Playlists
        </h2>
        <p className="text-purple-300/60 font-light">Explore your musical universes</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
        <Input
          type="text"
          placeholder="Search playlists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-black/50 border-purple-500/20 text-purple-100 placeholder-purple-300/40 focus:border-purple-500 focus:ring-purple-500/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="relative group aspect-square overflow-hidden rounded-lg"
            style={{
              backgroundImage: `url(${playlist.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <h3 className="text-lg font-semibold truncate">{playlist.name}</h3>
              <p className="text-sm text-purple-300">{playlist.songCount} songs</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

