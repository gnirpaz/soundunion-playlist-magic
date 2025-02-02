import { useState } from "react"
import { AudioWaveformIcon as Waveform } from "lucide-react"

interface PlaylistNameInputProps {
  onSubmit: (name: string) => void
}

export default function PlaylistNameInput({ onSubmit }: PlaylistNameInputProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-center mb-8">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full blur opacity-75 group-hover:opacity-100 animate-pulse transition duration-1000" />
          <div className="relative flex items-center justify-center w-20 h-20 bg-black rounded-full border border-purple-500/20">
            <Waveform size={40} className="text-purple-400" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
          Name Your Playlist
        </h2>
        <p className="text-purple-300/60 font-light">Create something legendary</p>
      </div>

      <div className="space-y-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your playlist name"
            required
            className="relative w-full px-4 py-3 bg-black rounded-xl border border-purple-500/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-purple-300/30 transition-all duration-300"
          />
        </div>

        <button type="submit" disabled={!name.trim()} className="relative w-full sm:w-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className="relative flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-xl text-white font-bold transition-all duration-300 hover:from-purple-400 hover:to-fuchsia-400 disabled:opacity-50 disabled:hover:from-purple-500 disabled:hover:to-fuchsia-500">
            Continue
          </div>
        </button>
      </div>
    </form>
  )
}

