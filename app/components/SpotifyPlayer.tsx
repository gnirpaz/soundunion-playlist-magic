"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDebug } from '@/app/providers/DebugProvider'
import Script from 'next/script'
import { Play, Pause, Volume2, SkipBack, SkipForward } from "lucide-react"

type PlayerProps = {
  trackUri?: string | null
  trackInfo?: {
    name: string
    artist: string
    image?: string
  }
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

export default function SpotifyPlayer({ trackUri, trackInfo, onPlay, onPause, onEnded }: PlayerProps) {
  const { data: session } = useSession()
  const { addLog } = useDebug()
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    addLog('Setting up SDK callback', 'info')
    window.onSpotifyWebPlaybackSDKReady = () => {
      addLog('SDK Ready - Initializing player', 'info')
    }
  }, [])

  useEffect(() => {
    if (!window.Spotify || !session?.accessToken) {
      addLog('Waiting for SDK and session', 'info', {
        hasSpotify: !!window.Spotify,
        hasToken: !!session?.accessToken
      })
      return
    }

    addLog('Creating player instance', 'info')
    const player = new window.Spotify.Player({
      name: 'Playlist Creator Web Player',
      getOAuthToken: cb => cb(session.accessToken as string)
    })

    player.addListener('initialization_error', ({ message }) => {
      addLog('Player initialization error', 'error', { message })
    })

    player.addListener('authentication_error', ({ message }) => {
      addLog('Player authentication error', 'error', { message })
    })

    player.addListener('account_error', ({ message }) => {
      addLog('Player account error', 'error', { message })
    })

    player.addListener('ready', ({ device_id }) => {
      addLog('Spotify player ready', 'info', { device_id })
      setDeviceId(device_id)
      setIsReady(true)
    })

    player.addListener('not_ready', ({ device_id }) => {
      addLog('Player not ready', 'info', { device_id })
      setIsReady(false)
    })

    // Add state listener for track end
    player.addListener('player_state_changed', state => {
      if (state?.track_window?.previous_tracks.length && 
          !state?.track_window?.next_tracks.length && 
          !state?.track_window?.current_track) {
        onEnded?.()
      }
    })

    player.connect().then(success => {
      addLog('Player connection attempt', 'info', { success })
      if (success) {
        setPlayer(player)
      }
    })

    return () => {
      player.disconnect()
    }
  }, [session?.accessToken])

  useEffect(() => {
    if (!isReady || !deviceId || !session?.accessToken) {
      addLog('Skipping playback effect', 'info', {
        isReady,
        hasDeviceId: !!deviceId,
        hasAccessToken: !!session?.accessToken
      })
      return
    }
    
    if (!trackUri) {
      if (isPlaying) {
        addLog('Attempting to pause', 'info')
        setIsPlaying(false)
        onPause?.()
      }
      return
    }

    addLog('Starting playback sequence', 'info', { trackUri, deviceId })

    fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false
      })
    })
    .then(response => {
      if (!response.ok) {
        addLog('Transfer failed', 'error', { status: response.status })
        throw new Error('Transfer failed')
      }
      addLog('Transfer successful', 'info')
      return fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      })
    })
    .then(response => {
      if (!response.ok) {
        addLog('Play request failed', 'error', { status: response.status })
        throw new Error('Play failed')
      }
      addLog('Play request successful', 'info')
      setIsPlaying(true)
      onPlay?.()
    })
    .catch(error => {
      addLog('Playback sequence failed', 'error', { error: String(error) })
    })
  }, [trackUri, deviceId, isReady, session?.accessToken])

  return (
    <>
      {(isReady && trackInfo) && (
        <div className={`fixed bottom-0 left-0 right-0 bg-black/95 border-t border-neutral-800 
          transform transition-transform duration-300 ${isPlaying ? 'translate-y-0' : 'translate-y-full'}`}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Track Info */}
              <div className="flex items-center space-x-4">
                {trackInfo.image && (
                  <img src={trackInfo.image} alt="" className="w-12 h-12 rounded" />
                )}
                <div>
                  <div className="text-sm font-medium text-white">{trackInfo.name}</div>
                  <div className="text-xs text-neutral-400">{trackInfo.artist}</div>
                </div>
              </div>

              {/* Center: Controls */}
              <div className="flex items-center space-x-6">
                <button className="text-neutral-400 hover:text-white">
                  <SkipBack size={20} />
                </button>
                <button 
                  className="p-2 bg-white rounded-full hover:scale-105 transition-transform"
                  onClick={() => {
                    if (!player || !deviceId || !session?.accessToken) return;
                    
                    if (isPlaying) {
                      fetch('https://api.spotify.com/v1/me/player/pause', {
                        method: 'PUT',
                        headers: {
                          'Authorization': `Bearer ${session.accessToken}`,
                        }
                      }).then(() => {
                        setIsPlaying(false);
                        onPause?.();
                      });
                    } else if (trackUri) {
                      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                        method: 'PUT',
                        headers: {
                          'Authorization': `Bearer ${session.accessToken}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ uris: [trackUri] })
                      }).then(() => {
                        setIsPlaying(true);
                        onPlay?.();
                      });
                    }
                  }}
                >
                  {isPlaying ? (
                    <Pause size={20} className="text-black" />
                  ) : (
                    <Play size={20} className="text-black ml-0.5" />
                  )}
                </button>
                <button className="text-neutral-400 hover:text-white">
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Right: Volume */}
              <div className="flex items-center space-x-4">
                <Volume2 className="w-4 h-4 text-neutral-400" />
                <div className="text-xs text-neutral-400">
                  Playing through Spotify Connect
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Script 
        src="https://sdk.scdn.co/spotify-player.js"
        strategy="beforeInteractive"
        onLoad={() => addLog('Script loaded', 'info')}
      />
    </>
  )
} 