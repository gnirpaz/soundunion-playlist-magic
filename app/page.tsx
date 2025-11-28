"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Music, Sparkles, ListMusic, Share2, Search, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"

const features = [
  {
    icon: Search,
    title: "Search & Discover",
    description: "Search Spotify's massive library or add songs manually"
  },
  {
    icon: ListMusic,
    title: "Build Your List",
    description: "Drag to reorder, preview tracks, and curate your perfect mix"
  },
  {
    icon: Sparkles,
    title: "Auto-Match",
    description: "We find the best matching tracks on Spotify automatically"
  },
  {
    icon: Share2,
    title: "Share Anywhere",
    description: "Your playlist is saved directly to your Spotify account"
  }
]

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <div className="py-8 px-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 mb-4">
          <Music size={40} className="text-white" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold">
          <span className="bg-gradient-to-r from-white via-purple-200 to-fuchsia-200 bg-clip-text text-transparent">
            Turn Your Song List
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
            Into a Spotify Playlist
          </span>
        </h1>
        
        <p className="text-lg text-purple-200/70 max-w-md mx-auto">
          Got a list of songs from a party, a friend, or your own imagination? 
          We&apos;ll find them on Spotify and create a playlist in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          {status === "authenticated" ? (
            <Link href="/new">
              <Button className="text-lg px-8 py-6 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 rounded-xl">
                Create a Playlist
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          ) : (
            <Button 
              onClick={() => signIn("spotify", { callbackUrl: "/new" })}
              className="text-lg px-8 py-6 bg-[#1DB954] hover:bg-[#1ed760] rounded-xl"
            >
              <img src="/spotify-logo.png" alt="Spotify" className="w-6 h-6 mr-2 brightness-0 invert" />
              Connect with Spotify
            </Button>
          )}
          
          {status === "authenticated" && (
            <Link href="/playlists">
              <Button variant="outline" className="text-lg px-8 py-6 border-purple-500/30 text-purple-200 hover:bg-purple-500/10 rounded-xl">
                View My Playlists
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="group p-6 rounded-2xl bg-black/30 border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <feature.icon size={24} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-purple-300/60 text-sm">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-8">How It Works</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <Step number={1} text="Add your songs" />
          <Arrow />
          <Step number={2} text="We match on Spotify" />
          <Arrow />
          <Step number={3} text="Playlist created!" />
        </div>
      </div>

      {/* CTA */}
      {status !== "authenticated" && (
        <div className="mt-16 text-center">
          <p className="text-purple-300/60 text-sm">
            Free to use &bull; No signup required &bull; Just connect your Spotify
          </p>
        </div>
      )}
    </div>
  )
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
        {number}
      </div>
      <span className="text-purple-200">{text}</span>
    </div>
  )
}

function Arrow() {
  return (
    <ArrowRight className="hidden md:block text-purple-500/40" size={24} />
  )
}
