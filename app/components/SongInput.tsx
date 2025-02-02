import { useState } from "react"
import { PlusCircle, FileMusic, ImageIcon } from "lucide-react"

interface SongInputProps {
  onSubmit: (songs: string[]) => void
}

export default function SongInput({ onSubmit }: SongInputProps) {
  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const songs = input
      .split("\n")
      .map((song) => song.trim())
      .filter(Boolean)
    onSubmit(songs)
  }

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 p-8">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
          Add Your Tracks
        </h2>
        <p className="text-purple-300/60 font-light">Build your sonic arsenal</p>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-3 bg-black rounded-xl border border-purple-500/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-purple-300/30 min-h-[200px] resize-none transition-all duration-300"
            placeholder="Enter your song list, one per line..."
          />
          <div className="absolute bottom-3 right-3 flex space-x-2">
            <label
              htmlFor="image-upload"
              className="cursor-pointer p-2 rounded-full hover:bg-purple-500/10 transition-colors group/btn"
            >
              <input type="file" id="image-upload" accept="image/*" onChange={handleAttachment} className="hidden" />
              <ImageIcon size={20} className="text-purple-500/50 group-hover/btn:text-purple-400 transition-colors" />
            </label>
            <label
              htmlFor="attachments"
              className="cursor-pointer p-2 rounded-full hover:bg-purple-500/10 transition-colors group/btn"
            >
              <input type="file" id="attachments" onChange={handleAttachment} multiple className="hidden" />
              <FileMusic size={20} className="text-purple-500/50 group-hover/btn:text-purple-400 transition-colors" />
            </label>
          </div>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-25" />
          <div className="relative bg-black/50 rounded-xl p-4 border border-purple-500/20">
            <p className="text-sm font-medium text-purple-400 mb-2">Attachments:</p>
            <ul className="list-disc list-inside">
              {attachments.map((file, index) => (
                <li key={index} className="text-sm text-purple-300/60">
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <button type="submit" disabled={!input.trim() && attachments.length === 0} className="relative w-full group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-xl text-white font-bold transition-all duration-300 hover:from-purple-400 hover:to-fuchsia-400 disabled:opacity-50 disabled:hover:from-purple-500 disabled:hover:to-fuchsia-500">
          <PlusCircle size={24} className="mr-2" />
          Create Playlist
        </div>
      </button>
    </form>
  )
}

