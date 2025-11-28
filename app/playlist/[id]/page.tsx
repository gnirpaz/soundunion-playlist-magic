"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  getPlaylistDetails, 
  removeTracksFromPlaylist, 
  updatePlaylistDetails,
  deletePlaylist,
  searchSpotify,
  addTracksToPlaylist
} from "@/app/utils/spotify"
import { useDebug } from "@/app/providers/DebugProvider"
import { 
  Music, Clock, Share2, Copy, Check, Play, Pause, Pencil, Trash2, 
  Plus, X, GripVertical, Search, ExternalLink, ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SpotifyPlayer from '@/app/components/SpotifyPlayer'
import { Track } from '@/app/types/spotify'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Link from "next/link"

type Props = {
  params: {
    id: string
  }
}

export default function PlaylistPage({ params }: Props) {
  const playlistId = params.id
  const { data: session } = useSession()
  const { addLog } = useDebug()
  const router = useRouter()
  
  const [playlistName, setPlaylistName] = useState("")
  const [playlistUrl, setPlaylistUrl] = useState<string>()
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI states
  const [copied, setCopied] = useState(false)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [currentTrackUri, setCurrentTrackUri] = useState<string | null>(null)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editName, setEditName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Add tracks dialog
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{id: string; name: string; artist: string; image: string}>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null)

  // Load playlist details
  useEffect(() => {
    if (!session?.accessToken || !playlistId) return

    loadPlaylist()
  }, [session?.accessToken, playlistId])

  const loadPlaylist = async () => {
    if (!session?.accessToken) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { name, url, tracks: playlistTracks } = await getPlaylistDetails(session.accessToken, playlistId)
      setPlaylistName(name)
      setEditName(name)
      setPlaylistUrl(url)
      setTracks(playlistTracks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist')
      addLog('Failed to get playlist details', 'error', { 
        error: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle playlist rename
  const handleNameSubmit = async () => {
    if (!session?.accessToken || !editName.trim() || !playlistId) return

    try {
      await updatePlaylistDetails(session.accessToken, playlistId, { name: editName.trim() })
      setPlaylistName(editName.trim())
      setShowNameDialog(false)
      addLog('Renamed playlist', 'info', { newName: editName.trim() })
    } catch (err) {
      addLog('Failed to rename playlist', 'error', { 
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  // Handle track removal
  const handleRemoveTrack = async (trackId: string) => {
    if (!session?.accessToken) return
    
    try {
      await removeTracksFromPlaylist(session.accessToken, playlistId, [`spotify:track:${trackId}`])
      setTracks(prev => prev.filter(t => t.id !== trackId))
      addLog('Removed track', 'info', { trackId })
    } catch (err) {
      addLog('Failed to remove track', 'error', { 
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  // Handle playlist deletion
  const handleDelete = async () => {
    if (!session?.accessToken) return
    
    setIsDeleting(true)
    try {
      await deletePlaylist(session.accessToken, playlistId)
      addLog('Deleted playlist', 'info', { playlistId })
      router.push('/playlists')
    } catch (err) {
      addLog('Failed to delete playlist', 'error', { 
        error: err instanceof Error ? err.message : String(err)
      })
      setIsDeleting(false)
    }
  }

  // Search for tracks to add
  const handleSearch = useCallback(async (query: string) => {
    if (!session?.accessToken || query.length < 2) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    try {
      const results = []
      // Search for multiple results
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
        {
          headers: { 'Authorization': `Bearer ${session.accessToken}` }
        }
      )
      const data = await response.json()
      
      if (data.tracks?.items) {
        for (const track of data.tracks.items) {
          results.push({
            id: track.id,
            name: track.name,
            artist: track.artists[0]?.name || 'Unknown',
            image: track.album?.images?.[0]?.url || ''
          })
        }
      }
      setSearchResults(results)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }, [session?.accessToken])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        handleSearch(searchTerm)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, handleSearch])

  // Add track to playlist
  const handleAddTrack = async (trackId: string) => {
    if (!session?.accessToken) return
    
    setAddingTrackId(trackId)
    try {
      await addTracksToPlaylist(session.accessToken, playlistId, [`spotify:track:${trackId}`])
      // Reload playlist to get updated tracks
      await loadPlaylist()
      setSearchTerm("")
      setSearchResults([])
      addLog('Added track', 'info', { trackId })
    } catch (err) {
      addLog('Failed to add track', 'error', { 
        error: err instanceof Error ? err.message : String(err)
      })
    } finally {
      setAddingTrackId(null)
    }
  }

  const togglePlay = (track: Track) => {
    if (playingTrackId === track.id) {
      setPlayingTrackId(null)
      setCurrentTrackUri(null)
    } else {
      setPlayingTrackId(track.id)
      setCurrentTrackUri(`spotify:track:${track.id}`)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleCopyLink = () => {
    if (playlistUrl) {
      navigator.clipboard.writeText(playlistUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-purple-900/30 rounded w-1/3 mx-auto" />
          <div className="h-4 bg-purple-900/30 rounded w-1/4 mx-auto" />
          <div className="space-y-2 mt-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-purple-900/20 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-400">{error}</p>
        <Button onClick={loadPlaylist} className="bg-purple-500 hover:bg-purple-400">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Rename Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-purple-900 to-black text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              Rename Playlist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter playlist name..."
              className="bg-black/50 border-purple-500/20 text-white"
            />
            <Button 
              onClick={handleNameSubmit}
              disabled={!editName.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
            >
              Save Name
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-purple-900 to-black text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-red-400">
              Delete Playlist?
            </DialogTitle>
            <DialogDescription className="text-center text-purple-300/60">
              This will remove &quot;{playlistName}&quot; from your Spotify library. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 p-4">
            <Button 
              onClick={() => setShowDeleteDialog(false)}
              variant="outline"
              className="flex-1 border-purple-500/20 text-purple-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-500"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Tracks Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-purple-900 to-black text-white max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              Add Tracks
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for songs..."
                className="pl-10 bg-black/50 border-purple-500/20 text-white"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
              {isSearching ? (
                <p className="text-center text-purple-300/60 py-4">Searching...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <div 
                    key={result.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-500/10 transition-colors"
                  >
                    {result.image ? (
                      <img src={result.image} alt="" className="w-10 h-10 rounded" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-purple-900/50 flex items-center justify-center">
                        <Music size={18} className="text-purple-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{result.name}</p>
                      <p className="text-purple-300/60 text-sm truncate">{result.artist}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddTrack(result.id)}
                      disabled={addingTrackId === result.id || tracks.some(t => t.id === result.id)}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
                    >
                      {tracks.some(t => t.id === result.id) ? (
                        <Check size={16} />
                      ) : addingTrackId === result.id ? (
                        '...'
                      ) : (
                        <Plus size={16} />
                      )}
                    </Button>
                  </div>
                ))
              ) : searchTerm.length >= 2 ? (
                <p className="text-center text-purple-300/60 py-4">No results found</p>
              ) : (
                <p className="text-center text-purple-300/60 py-4">Type to search for songs</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 p-8">
        {/* Back link */}
        <Link href="/playlists" className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors">
          <ArrowLeft size={18} className="mr-2" />
          Back to Playlists
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
              {playlistName}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNameDialog(true)}
              className="text-purple-400 hover:text-purple-300"
            >
              <Pencil size={16} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-purple-600 hover:bg-purple-500"
            >
              <Plus size={18} className="mr-2" />
              Add Tracks
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        </div>

        <p className="text-purple-300/60">{tracks.length} tracks</p>

        {/* Player */}
        <SpotifyPlayer 
          trackUri={currentTrackUri}
          trackInfo={tracks.find(t => t.id === playingTrackId) ? {
            name: tracks.find(t => t.id === playingTrackId)!.name,
            artist: tracks.find(t => t.id === playingTrackId)!.artist,
            image: tracks.find(t => t.id === playingTrackId)!.image
          } : undefined}
          onPause={() => setPlayingTrackId(null)}
          onEnded={() => {
            setPlayingTrackId(null)
            setCurrentTrackUri(null)
          }}
          tracks={tracks}
          currentIndex={tracks.findIndex(t => t.id === playingTrackId)}
          onTrackChange={(index) => {
            const track = tracks[index]
            if (track) {
              setPlayingTrackId(track.id)
              setCurrentTrackUri(`spotify:track:${track.id}`)
            }
          }}
        />

        {/* Track List */}
        {tracks.length > 0 ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-25" />
            <div className="relative bg-black/50 rounded-xl overflow-hidden border border-purple-500/20">
              <div className="grid grid-cols-[auto,1fr,auto,auto] gap-4 p-3 text-sm text-purple-300/60 border-b border-purple-300/10">
                <div className="w-8">#</div>
                <div>TITLE</div>
                <div className="hidden sm:block"><Clock size={16} /></div>
                <div className="w-8"></div>
              </div>
              {tracks.map((track, index) => (
                <div 
                  key={`${track.id}-${index}`}
                  className="grid grid-cols-[auto,1fr,auto,auto] gap-4 p-3 hover:bg-purple-300/5 group/row items-center"
                >
                  <div className="w-8 text-purple-300/60 group-hover/row:text-purple-300">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex items-center space-x-3">
                    <div className="relative group/play cursor-pointer flex-shrink-0">
                      {track.image ? (
                        <img src={track.image} alt="" className="w-10 h-10 rounded" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-purple-300/10 flex items-center justify-center">
                          <Music size={20} className="text-purple-300/40" />
                        </div>
                      )}
                      <button
                        onClick={() => togglePlay(track)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 
                          opacity-0 group-hover/play:opacity-100 transition-opacity rounded"
                      >
                        {playingTrackId === track.id ? (
                          <Pause size={18} className="text-white" />
                        ) : (
                          <Play size={18} className="text-white" />
                        )}
                      </button>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-white">{track.name}</div>
                      <div className="truncate text-purple-300/60 text-sm">{track.artist}</div>
                    </div>
                  </div>
                  <div className="text-purple-300/60 hidden sm:block">
                    {formatDuration(track.duration)}
                  </div>
                  <div className="w-8">
                    <button
                      onClick={() => handleRemoveTrack(track.id)}
                      className="p-1 text-purple-500/40 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                      title="Remove from playlist"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <Music size={48} className="mx-auto text-purple-400/50" />
            <p className="text-purple-300/60">This playlist is empty</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-purple-600 hover:bg-purple-500"
            >
              <Plus size={18} className="mr-2" />
              Add Tracks
            </Button>
          </div>
        )}

        {/* Share section */}
        {playlistUrl && (
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-25" />
              <div className="relative bg-black/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-purple-500/20 gap-3">
                <a
                  href={playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 truncate max-w-full"
                >
                  {playlistUrl}
                </a>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleCopyLink}
                    variant="secondary"
                    className="flex-1 sm:flex-none bg-purple-500 hover:bg-purple-400 text-white"
                  >
                    {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    onClick={() => window.open(playlistUrl, "_blank")}
                    className="flex-1 sm:flex-none bg-[#1DB954] hover:bg-[#1ed760]"
                  >
                    <ExternalLink size={18} className="mr-2" />
                    Open in Spotify
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
