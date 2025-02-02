import { AirplayIcon as Spotify, Music } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoginScreenProps {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] text-center px-4">
      <div className="mb-8 relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full blur opacity-75 animate-pulse" />
        <div className="relative bg-black rounded-full p-4">
          <Music size={64} className="text-purple-400" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
        Playlist Creator
      </h1>

      <p className="text-xl md:text-2xl text-purple-300/80 mb-8 max-w-md">
        Craft your perfect playlist and share your musical journey
      </p>

      <Button onClick={onLogin} className="relative group text-lg">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-green-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt" />
        <div className="relative flex items-center justify-center px-8 py-4 bg-black rounded-full leading-none">
          <Spotify size={24} className="mr-2 text-green-400" />
          <span className="bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent font-bold">
            Continue with Spotify
          </span>
        </div>
      </Button>

      <p className="mt-8 text-sm text-purple-300/60">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}

