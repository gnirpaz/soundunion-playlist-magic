"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import SongInput from "@/app/components/SongInput"
import ProcessingStep from "@/app/components/ProcessingStep"


type Step = "input" | "processing"

export default function NewPlaylist() {
  const [step, setStep] = useState<Step>("input")
  const [songs, setSongs] = useState<string[]>([])
  const router = useRouter()

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
            router.push(`/playlist/${playlistId}`)
          }}
          onError={(error) => {
            console.error('Playlist creation error:', error)
            setStep("input")
          }}
        />
      )}
    </div>
  )
} 