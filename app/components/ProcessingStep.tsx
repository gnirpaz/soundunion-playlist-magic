"use client"

import { useEffect, useRef, useState } from "react"
import { useSession, signIn, getSession } from "next-auth/react"
import { createPlaylist, CreatePlaylistResult } from "@/app/utils/spotify"
import { useDebug } from "@/app/providers/DebugProvider"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

type ProcessingStepProps = {
  songs: string[]
  onComplete: (playlistId: string, notFoundSongs?: string[]) => void
  onError: (error: string) => void
}

export default function ProcessingStep({ songs, onComplete, onError }: ProcessingStepProps) {
  const { data: session, update: updateSession } = useSession()
  const { addLog } = useDebug()
  const isProcessing = useRef(false)
  const hasCompleted = useRef(false)
  const [processingStatus, setProcessingStatus] = useState<string>('Initializing...')
  const [processedCount, setProcessedCount] = useState(0)

  useEffect(() => {
    if (!session?.accessToken || !songs.length || isProcessing.current || hasCompleted.current) return
    
    const token = session.accessToken

    async function processWithRetry() {
      if (isProcessing.current || hasCompleted.current) return
      isProcessing.current = true
      setProcessingStatus('Searching for tracks...')
      
      // Create a wrapper logger that also updates UI
      const uiLogger = (message: string, type: 'info' | 'error', data?: Record<string, unknown>) => {
        addLog(message, type, data)
        if (message === 'Searching') {
          setProcessedCount(prev => prev + 1)
          setProcessingStatus(`Searching track ${processedCount + 1} of ${songs.length}...`)
        } else if (message === 'Creating playlist') {
          setProcessingStatus('Creating playlist...')
        } else if (message === 'Playlist created') {
          setProcessingStatus('Done!')
        }
      }
      
      try {
        const handleResult = (result: CreatePlaylistResult) => {
          hasCompleted.current = true
          onComplete(result.playlistId, result.notFoundSongs)
        }

        await createPlaylist(token, 'New Playlist (Untitled)', songs, uiLogger)
          .then(handleResult)
          .catch(async error => {
            if (error.message === 'Playlist creation already in progress') {
              return
            }
            if (error.message?.includes('token expired')) {
              setProcessingStatus('Refreshing session...')
              await updateSession()
              const newSession = await getSession()
              if (newSession?.accessToken) {
                return createPlaylist(newSession.accessToken, 'New Playlist (Untitled)', songs, uiLogger)
                  .then(handleResult)
              }
            }
            onError(error.message || 'An error occurred')
          })
      } catch (error) {
        if (error instanceof Error && error.message === 'Playlist creation already in progress') {
          return
        }
        onError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        isProcessing.current = false
      }
    }

    processWithRetry()
    
    return () => {
      isProcessing.current = false
    }
  }, [session?.accessToken, songs])

  if (session === null) {
    return (
      <div className="text-center space-y-6 p-8">
        <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-yellow-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
            Connect with Spotify
          </h2>
          <p className="text-purple-300/60">
            Please connect your Spotify account to create the playlist
          </p>
        </div>
        <Button
          onClick={() => signIn("spotify")}
          className="bg-[#1DB954] hover:bg-[#1ed760] text-white px-8 py-2 rounded-full"
        >
          Connect Spotify
        </Button>
      </div>
    )
  }

  const progress = songs.length > 0 ? (processedCount / songs.length) * 100 : 0

  return (
    <div className="text-center py-12 px-8">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
          Processing Tracks
        </h2>
        <p className="text-purple-300/60 font-light">Assembling your masterpiece</p>
      </div>

      <div className="relative w-32 h-32 mx-auto mb-8">
        {/* Multiple glowing rings */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-500 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-fuchsia-400 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_0.5s] opacity-20"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-300 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s] opacity-20"></div>

        {/* Center spinning circle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full blur opacity-75 animate-pulse" />
            <svg
              className="relative w-16 h-16 text-purple-400 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mx-auto mb-4">
        <div className="h-1 bg-purple-900/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="text-lg text-purple-300/60">{processingStatus}</p>
      <p className="text-sm text-purple-300/40 mt-2">
        {processedCount} of {songs.length} tracks processed
      </p>
    </div>
  )
}
