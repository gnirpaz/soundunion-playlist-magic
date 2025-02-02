"use client"

import { useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { createPlaylist } from "@/app/utils/spotify"
import { useDebug } from "@/app/providers/DebugProvider"
import { Button } from "@/components/ui/button"

type ProcessingStepProps = {
  songs: string[]
  onComplete: (tracks: string[]) => void
  onError: (error: string) => void
}

export default function ProcessingStep({ songs, onComplete, onError }: ProcessingStepProps) {
  const { data: session, update: updateSession } = useSession()
  const { addLog } = useDebug()

  useEffect(() => {
    if (!session?.accessToken || !songs.length) return

    async function processWithRetry() {
      try {
        await createPlaylist(session.accessToken, 'My Playlist', songs, addLog)
          .then(result => {
            onComplete([result.playlistId])
          })
          .catch(async error => {
            if (error.message?.includes('token expired')) {
              await updateSession()
              const newSession = await new Promise(resolve => {
                const checkSession = setInterval(async () => {
                  const session = await getSession()
                  if (session?.accessToken) {
                    clearInterval(checkSession)
                    resolve(session)
                  }
                }, 500)
              })
              
              if (newSession?.accessToken) {
                return createPlaylist(newSession.accessToken, 'My Playlist', songs, addLog)
                  .then(result => onComplete([result.playlistId]))
              }
            }
            onError(error.message || 'An error occurred')
          })
      } catch (error) {
        onError(error instanceof Error ? error.message : 'An error occurred')
      }
    }

    processWithRetry()
  }, [session?.accessToken, songs, addLog, updateSession])

  if (session === null) {
    return (
      <div className="text-center space-y-6">
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

  return (
    <div className="text-center py-12">
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

      <p className="text-lg text-purple-300/60 animate-pulse">Creating your playlist...</p>
    </div>
  )
}

