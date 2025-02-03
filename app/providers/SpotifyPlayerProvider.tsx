"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDebug } from './DebugProvider'
import Script from 'next/script'

type SpotifyPlayerContextType = {
  isReady: boolean
  deviceId: string | null
  play: (uri: string) => Promise<void>
  pause: () => Promise<void>
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextType | null>(null)

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext)
  if (!context) throw new Error('useSpotifyPlayer must be used within SpotifyPlayerProvider')
  return context
}

export function SpotifyPlayerProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { addLog } = useDebug()
  const [isReady, setIsReady] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [player, setPlayer] = useState<Spotify.Player | null>(null)

  // Set up SDK callback
  useEffect(() => {
    addLog('Setting up SDK callback', 'info')
    window.onSpotifyWebPlaybackSDKReady = () => {
      addLog('SDK Ready', 'info')
      initializePlayer()
    }
  }, [])

  // Initialize player when session changes
  const initializePlayer = () => {
    if (!window.Spotify || !session?.accessToken) {
      addLog('Cannot initialize player', 'info', {
        hasSpotify: !!window.Spotify,
        hasToken: !!session?.accessToken
      })
      return
    }

    addLog('Initializing player', 'info')
    const player = new window.Spotify.Player({
      name: 'Playlist Creator Web Player',
      getOAuthToken: cb => cb(session.accessToken as string)
    })

    player.addListener('ready', ({ device_id }) => {
      addLog('Player ready', 'info', { device_id })
      setDeviceId(device_id)
      setIsReady(true)
    })

    player.connect().then((success: boolean) => {
      addLog('Player connected', 'info', { success })
      if (success) setPlayer(player)
    })

    return () => {
      player.disconnect()
    }
  }

  useEffect(() => {
    if (session?.accessToken) initializePlayer()
  }, [session?.accessToken])

  const value = {
    isReady,
    deviceId,
    play: async (uri: string) => {
      if (!player || !deviceId) return
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [uri]
        })
      })
    },
    pause: async () => {
      if (!player || !deviceId) return
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        }
      })
    }
  }

  return (
    <SpotifyPlayerContext.Provider value={value}>
      {children}
      <Script 
        src="https://sdk.scdn.co/spotify-player.js"
        strategy="beforeInteractive"
        onLoad={() => addLog('Script loaded', 'info')}
      />
    </SpotifyPlayerContext.Provider>
  )
} 