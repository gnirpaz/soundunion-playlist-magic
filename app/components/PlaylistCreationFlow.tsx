"use client"

import { useState } from "react"
import SongInput from "./SongInput"
import ProcessingStep from "./ProcessingStep"
import PlaylistNameInput from "./PlaylistNameInput"
import ReviewAndShare from "./ReviewAndShare"

type Step = "input" | "processing" | "naming" | "review"

type PlaylistCreationFlowProps = {
  onCreatePlaylist: () => void
}

export default function PlaylistCreationFlow({ onCreatePlaylist }: PlaylistCreationFlowProps) {
  const [step, setStep] = useState<Step>("input")
  const [songs, setSongs] = useState<string[]>([])
  const [playlistId, setPlaylistId] = useState<string>("")
  const [playlistName, setPlaylistName] = useState<string>("")

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
          onComplete={(tracks) => {
            setPlaylistId(tracks[0])
            setStep("naming")  // Go to naming step instead of review
          }}
          onError={(error) => {
            console.error('Playlist creation error:', error)
          }}
        />
      )}

      {step === "naming" && (
        <PlaylistNameInput
          onSubmit={(name) => {
            setPlaylistName(name)
            setStep("review")
          }}
        />
      )}

      {step === "review" && (
        <ReviewAndShare
          playlistId={playlistId}
          playlistName={playlistName}
          onComplete={() => {
            onCreatePlaylist()
          }}
          onError={(error) => {
            console.error('Playlist creation error:', error)
          }}
        />
      )}
    </div>
  )
}

