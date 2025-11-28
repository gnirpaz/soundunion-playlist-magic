"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import SongInput from "@/app/components/SongInput"
import ProcessingStep from "@/app/components/ProcessingStep"
import ErrorBoundary from "@/app/components/ErrorBoundary"

type Step = "input" | "processing"

export default function NewPlaylist() {
  const [step, setStep] = useState<Step>("input")
  const [songs, setSongs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleComplete = (playlistId: string, notFoundSongs?: string[]) => {
    // Store notFoundSongs in session storage to show in the review page
    if (notFoundSongs && notFoundSongs.length > 0) {
      sessionStorage.setItem(`playlist-${playlistId}-notfound`, JSON.stringify(notFoundSongs))
    }
    router.push(`/playlist/${playlistId}`)
  }

  const handleError = (errorMsg: string) => {
    console.error('Playlist creation error:', errorMsg)
    setError(errorMsg)
    setStep("input")
  }

  return (
    <ErrorBoundary>
      <div className="w-full max-w-2xl mx-auto">
        {error && (
          <div className="mx-8 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-300 text-xs hover:text-red-200 mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {step === "input" && (
          <SongInput onSubmit={(submittedSongs) => {
            setSongs(submittedSongs)
            setError(null)
            setStep("processing")
          }}/>
        )}

        {step === "processing" && (
          <ProcessingStep
            songs={songs}
            onComplete={handleComplete}
            onError={handleError}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
