"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useDebug } from '@/app/providers/DebugProvider'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react"

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
  tracks?: Array<{ id: string; name: string; artist: string; image?: string }>
  currentIndex?: number
  onTrackChange?: (index: number) => void
}

export default function SpotifyPlayer({ 
  trackUri, 
  trackInfo, 
  onPlay, 
  onPause, 
  onEnded,
  tracks = [],
  currentIndex = 0,
  onTrackChange
}: PlayerProps) {
  const { data: session } = useSession()
  const { addLog } = useDebug()
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(0.5)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const playerRef = useRef<Spotify.Player | null>(null)

  // Initialize player when SDK is ready
  useEffect(() => {
    const initPlayer = () => {
      if (!window.Spotify || !session?.accessToken) {
        return
      }

      addLog('Creating player instance', 'info')
      const newPlayer = new window.Spotify.Player({
        name: 'Playlist Creator Web Player',
        getOAuthToken: cb => cb(session.accessToken as string),
        volume: 0.5
      })

      newPlayer.addListener('initialization_error', ({ message }) => {
        addLog('Player initialization error', 'error', { message })
      })

      newPlayer.addListener('authentication_error', ({ message }) => {
        addLog('Player authentication error', 'error', { message })
      })

      newPlayer.addListener('account_error', ({ message }) => {
        addLog('Player account error', 'error', { message })
      })

      newPlayer.addListener('playback_error', ({ message }) => {
        addLog('Player playback error', 'error', { message })
      })

      newPlayer.addListener('ready', ({ device_id }) => {
        addLog('Spotify player ready', 'info', { device_id })
        setDeviceId(device_id)
        setIsReady(true)
      })

      newPlayer.addListener('not_ready', ({ device_id }) => {
        addLog('Player not ready', 'info', { device_id })
        setIsReady(false)
      })

      newPlayer.addListener('player_state_changed', (state) => {
        if (!state) return
        
        setIsPlaying(!state.paused)
        setProgress(state.position)
        setDuration(state.duration)
        
        // Track ended - check if we reached the end
        if (state.paused && state.position === 0 && 
            state.track_window.previous_tracks.length > 0 &&
            state.track_window.next_tracks.length === 0) {
          onEnded?.()
        }
      })

      newPlayer.connect().then(success => {
        addLog('Player connection attempt', 'info', { success })
        if (success) {
          setPlayer(newPlayer)
          playerRef.current = newPlayer
          // Get initial volume
          newPlayer.getVolume().then(vol => {
            setVolume(vol)
          })
        }
      })
    }

    // Check if SDK is already loaded
    if (window.Spotify) {
      initPlayer()
    } else {
      // Wait for SDK to be ready
      window.onSpotifyWebPlaybackSDKReady = initPlayer
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect()
      }
    }
  }, [session?.accessToken])

  // Poll for accurate progress (SDK doesn't emit continuous position updates)
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      progressInterval.current = setInterval(async () => {
        const state = await playerRef.current?.getCurrentState()
        if (state) {
          setProgress(state.position)
          setDuration(state.duration)
        }
      }, 500)
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
    
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [isPlaying])

  // Handle track changes - need API to start playback on specific URI
  useEffect(() => {
    if (!isReady || !deviceId || !session?.accessToken || !trackUri) {
      return
    }

    // Transfer playback to our device and start the track
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
      if (!response.ok && response.status !== 204) {
        throw new Error('Transfer failed')
      }
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
      if (!response.ok && response.status !== 204) {
        throw new Error('Play failed')
      }
      setIsPlaying(true)
      setProgress(0)
      onPlay?.()
    })
    .catch(error => {
      addLog('Playback failed', 'error', { error: String(error) })
    })
  }, [trackUri, deviceId, isReady, session?.accessToken])

  // Native SDK control: Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!playerRef.current) return
    
    try {
      await playerRef.current.togglePlay()
      // State will be updated via player_state_changed listener
      if (isPlaying) {
        onPause?.()
      } else {
        onPlay?.()
      }
    } catch (error) {
      addLog('Toggle play failed', 'error', { error: String(error) })
    }
  }, [isPlaying, onPause, onPlay, addLog])

  // Native SDK control: Seek
  const handleSeek = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const seekPosition = Math.floor(percent * duration)
    
    try {
      await playerRef.current.seek(seekPosition)
      setProgress(seekPosition)
    } catch (error) {
      addLog('Seek failed', 'error', { error: String(error) })
    }
  }, [duration, addLog])

  // Native SDK control: Volume
  const handleVolumeChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return
    
    const newVolume = parseFloat(e.target.value) / 100
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    
    try {
      await playerRef.current.setVolume(newVolume)
    } catch (error) {
      addLog('Volume change failed', 'error', { error: String(error) })
    }
  }, [addLog])

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (!playerRef.current) return
    
    try {
      if (isMuted) {
        await playerRef.current.setVolume(previousVolume)
        setVolume(previousVolume)
        setIsMuted(false)
      } else {
        setPreviousVolume(volume)
        await playerRef.current.setVolume(0)
        setVolume(0)
        setIsMuted(true)
      }
    } catch (error) {
      addLog('Mute toggle failed', 'error', { error: String(error) })
    }
  }, [isMuted, volume, previousVolume, addLog])

  // Skip controls - use onTrackChange for playlist navigation
  const skipPrevious = useCallback(() => {
    if (tracks.length > 0 && currentIndex > 0 && onTrackChange) {
      onTrackChange(currentIndex - 1)
    }
  }, [tracks.length, currentIndex, onTrackChange])

  const skipNext = useCallback(() => {
    if (tracks.length > 0 && currentIndex < tracks.length - 1 && onTrackChange) {
      onTrackChange(currentIndex + 1)
    }
  }, [tracks.length, currentIndex, onTrackChange])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isReady || !trackInfo) return null

  const canSkipPrevious = tracks.length > 0 && currentIndex > 0
  const canSkipNext = tracks.length > 0 && currentIndex < tracks.length - 1

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-black/95 border-t border-purple-500/20 
      transform transition-transform duration-300 z-50 ${trackUri ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="container mx-auto px-4 py-3">
        {/* Progress bar */}
        <div 
          className="w-full h-1 bg-neutral-800 rounded-full cursor-pointer mb-3 group"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full relative transition-all duration-100"
            style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Left: Track Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {trackInfo.image && (
              <img src={trackInfo.image} alt="" className="w-12 h-12 rounded shadow-lg" />
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{trackInfo.name}</div>
              <div className="text-xs text-purple-300/60 truncate">{trackInfo.artist}</div>
            </div>
          </div>

          {/* Center: Controls */}
          <div className="flex flex-col items-center space-y-1 flex-1">
            <div className="flex items-center space-x-6">
              <button 
                className={`text-neutral-400 transition-colors ${canSkipPrevious ? 'hover:text-white' : 'opacity-50 cursor-not-allowed'}`}
                onClick={skipPrevious}
                disabled={!canSkipPrevious}
                title="Previous track"
              >
                <SkipBack size={20} />
              </button>
              <button 
                className="p-2 bg-white rounded-full hover:scale-105 transition-transform shadow-lg"
                onClick={togglePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={20} className="text-black" />
                ) : (
                  <Play size={20} className="text-black ml-0.5" />
                )}
              </button>
              <button 
                className={`text-neutral-400 transition-colors ${canSkipNext ? 'hover:text-white' : 'opacity-50 cursor-not-allowed'}`}
                onClick={skipNext}
                disabled={!canSkipNext}
                title="Next track"
              >
                <SkipForward size={20} />
              </button>
            </div>
            <div className="text-xs text-neutral-500">
              {formatTime(progress)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right: Volume */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <button 
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
