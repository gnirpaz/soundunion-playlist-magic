"use client"

import { useState, useEffect } from "react"
import SongInput from "./SongInput"
import ProcessingStep from "./ProcessingStep"
import ReviewAndShare from "./ReviewAndShare"

type Step = "input" | "processing" | "review"

type PlaylistCreationFlowProps = {
  onCreatePlaylist: () => void
}

export default function PlaylistCreationFlow({ onCreatePlaylist }: PlaylistCreationFlowProps) {
  const [step, setStep] = useState<Step>("input")
  const [songs, setSongs] = useState<string[]>([])
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)

  // Only reset songs when starting from input step
  useEffect(() => {
    if (step === "input") {
      setSongs([])
    }
  }, [step])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {step === "input" && (
        <SongInput onSubmit={(songs) => {
          setSongs(songs)
          setStep("processing")
        }}/>
      )}

      {step === "processing" && (
        <ProcessingStep
          songs={songs}
          onComplete={(playlistId) => {
            setCurrentPlaylistId(playlistId)
            setStep("review")
          }}
          onError={(error) => {
            console.error('Playlist creation error:', error)
            setStep("input")
          }}
        />
      )}

      {step === "review" && currentPlaylistId && (
        <ReviewAndShare
          playlistId={currentPlaylistId}
          onComplete={() => {
            onCreatePlaylist()
            setStep("input")
          }}
          onError={(error) => {
            console.error('Review error:', error)
          }}
        />
      )}
    </div>
  )
}

