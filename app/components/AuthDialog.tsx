import { AirplayIcon as Spotify } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { signIn } from "next-auth/react"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
  const handleLogin = () => {
    signIn("spotify", { callbackUrl: "/" })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-purple-900 to-black text-white p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
            Connect with Spotify
          </DialogTitle>
          <DialogDescription className="text-center text-purple-300/80">
            To create and save your playlist, please connect your Spotify account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-6">
          <Button onClick={handleLogin} className="relative group text-base sm:text-lg w-full sm:w-auto">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-green-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt" />
            <div className="relative flex items-center justify-center px-6 py-3 bg-black rounded-full leading-none w-full">
              <Spotify size={24} className="mr-2 text-green-400" />
              <span className="bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent font-bold">
                Continue with Spotify
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

