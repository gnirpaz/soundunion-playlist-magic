"use client"

import { useRouter } from "next/navigation"
import ReviewAndShare from "@/app/components/ReviewAndShare"


type Props = {
  params: {
    id: string
  }
}

export default function PlaylistPage({ params }: Props) {
  const router = useRouter()
  const playlistId = params.id

  return (

      <div className="w-full max-w-2xl mx-auto">
        <ReviewAndShare
          playlistId={playlistId}          
          onError={(error) => {
            console.error('Review error:', error)
          }}
        />
      </div>

  )
} 