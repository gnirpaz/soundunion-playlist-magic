"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { renamePlaylist, getPlaylistDetails } from "@/app/utils/spotify"
import { useDebug } from "@/app/providers/DebugProvider"
import { Music, Clock, Share2, Copy, Check, Play, Pause, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import SpotifyPlayer from './SpotifyPlayer'
import { Track } from '@/app/types/spotify'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
    if (!session?.accessToken || !playlistName.trim()) return

    try {
      await renamePlaylist(session.accessToken, playlistId, playlistName.trim())
      addLog('Updated playlist name', 'info', { playlistId, name: playlistName })
      setShowNameDialog(false)      
    } catch (error) {
      addLog('Failed to update playlist name', 'error', { 
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
    <>
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-purple-900 to-black text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              {showNameDialog ? "Name Your Playlist" : "Edit Playlist Name"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter playlist name..."
              className="w-full px-4 py-2 bg-black/50 rounded-xl border border-purple-500/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-purple-300/30"
            />
            <Button 
              onClick={handleNameSubmit}
              disabled={!playlistName.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
            >
              Save Name
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        <SpotifyPlayer 
          trackUri={currentTrackUri}
          trackInfo={tracks.find(t => t.id === playingTrackId) ? {
            name: tracks.find(t => t.id === playingTrackId)!.name,
            artist: tracks.find(t => t.id === playingTrackId)!.artist,
            image: tracks.find(t => t.id === playingTrackId)!.image
          } : undefined}
          onPlay={() => {}}
          onPause={() => setPlayingTrackId(null)}
          onEnded={() => {
            setPlayingTrackId(null)
            setCurrentTrackUri(null)
          }}
        />
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
              {playlistName}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNameDialog(true)}
              className="text-purple-400 hover:text-purple-300"
            >
              <Pencil size={16} />
            </Button>
          </div>
          <p className="text-purple-300/60 font-light">Ready to share with the world</p>
        </div>

        {tracks.length > 0 && (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-25" />
            <div className="relative bg-black/50 rounded-xl overflow-hidden border border-purple-500/20">
              <div className="grid grid-cols-[auto,1fr,1fr,auto] gap-4 p-3 text-sm text-purple-300/60 border-b border-purple-300/10">
                <div className="w-8">#</div>
                <div>TITLE</div>
                <div>ALBUM</div>
                <div className="flex items-center"><Clock size={16} /></div>
              </div>
              {tracks.map((track, index) => (
                <div 
                  key={index}
                  className="grid grid-cols-[auto,1fr,1fr,auto] gap-4 p-3 hover:bg-purple-300/5 group"
                >
                  <div className="w-8 text-purple-300/60 group-hover:text-purple-300">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex items-center space-x-3">
                    <div className="relative group/play cursor-pointer">
                      {track.image ? (
                        <img src={track.image} alt="" className="w-10 h-10 rounded" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-purple-300/10 flex items-center justify-center">
                          <Music size={20} className="text-purple-300/40" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePlay(track)
                        }}
                        className={`absolute inset-0 flex items-center justify-center bg-black/40 
                          opacity-0 group-hover/play:opacity-100 transition-opacity rounded
                          hover:bg-black/60 ${!track.previewUrl ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        title={track.previewUrl ? 'Play preview' : 'No preview available'}
                      >
                        {playingTrackId === track.id ? (
                          <Pause size={20} className="text-white" />
                        ) : (
                          <Play size={20} className={`text-white ${!track.previewUrl ? 'opacity-50' : ''}`} />
                        )}
                      </button>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-white">{track.name}</div>
                      <div className="truncate text-purple-300/60">{track.artist}</div>
                    </div>
                  </div>
                  <div className="truncate text-purple-300/60 self-center">
                    {track.album}
                  </div>
                  <div className="text-purple-300/60 self-center">
                    {formatDuration(track.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {playlistUrl && (
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-25" />
              <div className="relative bg-black/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-purple-500/20 space-y-2 sm:space-y-0">
                <a
                  href={playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 truncate mb-2 sm:mb-0"
                >
                  {playlistUrl}
                </a>
                <Button
                  onClick={handleCopyLink}
                  variant="secondary"
                  className="bg-purple-500 hover:bg-purple-400 text-white w-full sm:w-auto"
                >
                  {copied ? (
                    <Check size={18} className="mr-2" />
                  ) : (
                    <Copy size={18} className="mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                onClick={() => window.open(playlistUrl, "_blank")}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400"
              >
                <Share2 size={20} className="mr-2" />
                Open in Spotify
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

