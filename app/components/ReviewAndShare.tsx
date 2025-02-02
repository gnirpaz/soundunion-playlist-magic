"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getPlaylistUrl, getPlaylistTracks } from "@/app/utils/spotify"
import { useDebug } from "@/app/providers/DebugProvider"
import { Music, Clock, Share2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

type ReviewAndShareProps = {
  playlistId: string
  playlistName: string
  onComplete: () => void
  onError: (error: string) => void
}

type Track = {
  name: string
  artist: string
  album: string
  duration: number
  image: string
}

export default function ReviewAndShare({ playlistId, playlistName, onComplete, onError }: ReviewAndShareProps) {
  const { data: session } = useSession()
  const { addLog } = useDebug()
  const [playlistUrl, setPlaylistUrl] = useState<string>()
  const [tracks, setTracks] = useState<Track[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!session?.accessToken || !playlistId) return

    Promise.all([
      getPlaylistUrl(session.accessToken, playlistId),
      getPlaylistTracks(session.accessToken, playlistId)
    ])
      .then(([url, playlistTracks]) => {
        if (url) {
          addLog('Got playlist URL', 'info', { url })
          setPlaylistUrl(url)
          setTracks(playlistTracks)
          onComplete()
        } else {
          throw new Error('No playlist URL returned')
        }
      })
      .catch(error => {
        addLog('Failed to get playlist details', 'error', { error: String(error) })
        onError(error instanceof Error ? error.message : 'Failed to get playlist details')
      })
  }, [session?.accessToken, playlistId])

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
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
          {playlistName}
        </h2>
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
                  {track.image ? (
                    <img src={track.image} alt="" className="w-10 h-10 rounded" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-purple-300/10 flex items-center justify-center">
                      <Music size={20} className="text-purple-300/40" />
                    </div>
                  )}
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
  )
}

