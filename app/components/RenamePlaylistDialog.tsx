import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { X as XIcon } from 'lucide-react'

interface RenamePlaylistDialogProps {
  playlistId: string
  currentName: string
  onClose: () => void
  onRename: (newName: string) => void
}

export default function RenamePlaylistDialog({ playlistId, currentName, onClose, onRename }: RenamePlaylistDialogProps) {
  const { data: session } = useSession()
  const [name, setName] = useState(currentName)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.accessToken) return

    setIsLoading(true)
    try {
      await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name })
        }
      )
      onRename(name)
      onClose()
    } catch (error) {
      console.error('Failed to rename playlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-purple-900/90 rounded-xl p-6 max-w-md w-full space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-purple-300/60 hover:text-white"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-center bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
          Name Your Playlist
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-black/50 rounded-xl border border-purple-500/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white"
            placeholder="Enter playlist name"
          />

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-3 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 disabled:hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
          >
            {isLoading ? "Saving..." : "Save Name"}
          </button>
        </form>
      </div>
    </div>
  )
} 