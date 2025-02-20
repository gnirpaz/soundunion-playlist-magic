"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { renamePlaylist, getPlaylistDetails } from "@/app/utils/spotify"
import { useDebug } from "@/app/providers/DebugProvider"
import { Music, Clock, Share2, Copy, Check, Play, Pause, Pencil, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import SpotifyPlayer from './SpotifyPlayer'
import { Track } from '@/app/types/spotify'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import RenamePlaylistDialog from './RenamePlaylistDialog'

type ReviewAndShareProps = {
  playlistId: string
  onComplete: () => void
  onError: (error: string) => void
}

export default function ReviewAndShare({ playlistId, onError }: ReviewAndShareProps) {
  const { data: session } = useSession()
  const { addLog } = useDebug()
  const [playlistUrl, setPlaylistUrl] = useState<string>()
  const [tracks, setTracks] = useState<Track[]>([])
  const [copied, setCopied] = useState(false)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [currentTrackUri, setCurrentTrackUri] = useState<string | null>(null)
  const [showNameDialog, setShowNameDialog] = useState(true)
  const [playlistName, setPlaylistName] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)

  // Load initial playlist details
  useEffect(() => {
    if (!session?.accessToken || !playlistId) return

    getPlaylistDetails(session.accessToken, playlistId)
      .then(({ name, url, tracks }) => {
        addLog('Got playlist details', 'info', { 
          url,
          name,
          trackCount: tracks.length,
        })
        setPlaylistName(name)
        setPlaylistUrl(url)
        setTracks(tracks)
      })
      .catch(error => {
        addLog('Failed to get playlist details', 'error', { 
          error: error instanceof Error ? error.message : String(error)
        })
        onError(error instanceof Error ? error.message : 'Failed to get playlist details')
      })
  }, [session?.accessToken, playlistId])

  // Handle playlist naming
  const handleNameSubmit = async () => {
    if (!session?.accessToken || !playlistName.trim() || !playlistId) return

    try {
      await renamePlaylist(session.accessToken, playlistId, playlistName.trim())
      addLog('Renamed playlist', 'info', { 
        playlistId,
        oldName: 'New Playlist (Untitled)',
        newName: playlistName.trim() 
      })
      setShowNameDialog(false)
      // Refresh playlist details to show new name
      const details = await getPlaylistDetails(session.accessToken, playlistId)
      setPlaylistName(details.name)
      setPlaylistUrl(details.url)
    } catch (error) {
      addLog('Failed to rename playlist', 'error', { 
        error: error instanceof Error ? error.message : String(error)
      })
      setShowNameDialog(false)
    }
  }

  const togglePlay = async (track: Track) => {
    addLog('Toggle play clicked', 'info', { 
      track: {
        id: track.id,
        name: track.name,
        artist: track.artist,
        hasPreview: !!track.previewUrl 
      }
    })
    
    if (playingTrackId === track.id) {
      setPlayingTrackId(null)
      setCurrentTrackUri(null)
    } else {
      setPlayingTrackId(track.id)
      setCurrentTrackUri(`spotify:track:${track.id}`)
    }
  }

  function formatDuration(ms: number) {
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

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
            {playlistName}
          </h2>
          <button
            onClick={() => setIsRenaming(true)}
            className="p-1.5 rounded-full hover:bg-purple-500/10 transition-colors"
          >
            <Pencil className="w-5 h-5 text-purple-400/60" />
          </button>
        </div>
        <p className="text-purple-300/60 font-light">Ready to share with the world</p>
      </div>

      <div className="bg-black/50 rounded-xl border border-purple-500/20 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto] px-6 py-3 border-b border-purple-500/10 text-sm text-purple-300/60">
          <div className="w-12">#</div>
          <div>TITLE</div>
          <div className="w-20 text-right">DURATION</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-purple-500/10">
          {tracks.map((track, index) => (
            <div 
              key={track.id}
              className="grid grid-cols-[auto_1fr_auto] px-6 py-3 items-center hover:bg-purple-500/5 group"
            >
              <div className="w-12 text-sm text-purple-300/60">{index + 1}</div>
              <div className="min-w-0">
                <div className="font-medium text-white truncate">{track.name}</div>
                <div className="text-sm text-purple-300/60 truncate">{track.artist}</div>
              </div>
              <div className="w-20 text-right text-sm text-purple-300/60">
                {formatDuration(track.duration)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-black/50 rounded-xl border border-purple-500/20">
          <div className="flex-1 text-purple-300/60 truncate">
            {playlistUrl}
          </div>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Copy Link
          </button>
        </div>

        <a
          href={playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          Open in Spotify
        </a>
      </div>

      {/* Keep all dialogs and player components */}
      {currentTrackUri && (
        <SpotifyPlayer
          trackUri={currentTrackUri}
          trackInfo={tracks.find(t => t.id === playingTrackId)!}
          onPlay={() => {}}
          onPause={() => setPlayingTrackId(null)}
          onEnded={() => setPlayingTrackId(null)}
        />
      )}

      {isRenaming && (
        <RenamePlaylistDialog
          playlistId={playlistId}
          currentName={playlistName}
          onClose={() => setIsRenaming(false)}
          onRename={(newName) => {
            setPlaylistName(newName)
            setIsRenaming(false)
          }}
        />
      )}
    </div>
  )
}

