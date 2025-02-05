"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PlaylistResultProps {
  link: string
  name: string
  tracks: Array<{
    id: string
    title: string
    artist: string
    album: string
    duration: string
    image?: string
  }>
}

export default function PlaylistResult({ link, name, tracks }: PlaylistResultProps) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl bg-black/50 border border-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)] overflow-hidden">
      <div className="p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-purple-100">{name}</h1>
          <p className="text-purple-300">Ready to share with the world</p>
        </div>

        <div className="mt-4 p-4 bg-green-100 rounded-lg">
          <h2 className="text-xl font-bold mb-2 text-green-800">Your Playlist is Ready!</h2>
          <p className="mb-4">
            Your playlist has been created successfully. You can now open it in Spotify and start listening!
          </p>
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-[3rem_1fr_1fr_auto] gap-4 px-4 py-2 text-sm text-purple-300 border-b border-purple-500/10">
            <span className="flex items-center justify-center">#</span>
            <span className="flex items-center">TITLE</span>
            <span className="flex items-center justify-start">ALBUM</span>
            <span className="flex items-center justify-end pr-2">⏱</span>
          </div>

          <div className="divide-y divide-purple-500/10">
            {tracks.map((track, index) => (
              <div 
                key={track.id}
                className="grid grid-cols-[3rem_1fr_1fr_auto] gap-4 px-4 py-3 hover:bg-purple-500/5"
              >
                <span className="flex items-center justify-center text-purple-300">{index + 1}</span>
                <div className="flex items-center gap-3">
                  {track.image && (
                    <img src={track.image} alt="" className="w-10 h-10 rounded" />
                  )}
                  <div>
                    <div className="text-purple-100">{track.title}</div>
                    <div className="text-sm text-purple-300">{track.artist}</div>
                  </div>
                </div>
                <span className="flex items-center justify-start text-purple-300">{track.album}</span>
                <span className="flex items-center justify-end text-purple-300 pr-2 w-[4rem]">{track.duration}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-3 p-4 bg-purple-500/5 rounded-lg border border-purple-500/10">
            <input
              type="text"
              value={link}
              readOnly
              className="flex-1 bg-transparent text-purple-100 text-sm outline-none"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="bg-purple-500 hover:bg-purple-400 text-white flex items-center gap-2"
                  onClick={copyLink}
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy Link"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end"
                className="bg-black/90 border-purple-500/20"
              >
                <DropdownMenuItem 
                  className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/10 cursor-pointer gap-2"
                  onClick={() => window.open(link, '_blank')}
                >
                  <Share2 className="h-4 w-4" />
                  Open in Spotify
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

