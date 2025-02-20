import { useState, useEffect, useRef } from "react"
import { PlusCircle, FileMusic, ImageIcon, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Song {
  id: string
  title: string
  artist: string
  albumArt: string
}

interface SongInputProps {
  onSubmit: (songs: string[]) => void
}

export default function SongInput({ onSubmit }: SongInputProps) {
  const [input, setInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Search songs when user types
  useEffect(() => {
    const searchSongs = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([])
        setIsDropdownOpen(false)
        return
      }

      setIsLoading(true)
      setIsDropdownOpen(true)
      
      try {
        const response = await fetch(`/api/songs/search?q=${encodeURIComponent(searchTerm)}`)
        if (!response.ok) throw new Error('Search failed')
        
        const data = await response.json()
        console.log('Search results:', data) // Debug log
        setSearchResults(data.songs || [])
      } catch (error) {
        console.error('Failed to search songs:', error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(searchSongs, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSongSelect = (song: Song) => {
    setInput(prev => prev + (prev ? '\n' : '') + `${song.title} - ${song.artist}`)
    setSearchTerm('')
    setSearchResults([])
    setIsDropdownOpen(false)
  }

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

  // Make sure the dropdown stays visible while interacting
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 p-8">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
          Add Your Tracks
        </h2>
        <p className="text-purple-300/60 font-light">Build your sonic arsenal</p>
      </div>

      {/* Add search input above main editor */}
      <div className="relative mb-4" ref={searchContainerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={20} />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setIsDropdownOpen(true)
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search for songs..."
            className="pl-10 bg-black/50 border-purple-500/20 text-purple-100 placeholder-purple-300/40"
          />
        </div>

        {/* Updated dropdown visibility logic */}
        {isDropdownOpen && (searchResults.length > 0 || isLoading) && (
          <div className="absolute z-10 w-full mt-1 bg-black/90 border border-purple-500/20 rounded-lg shadow-xl max-h-[300px] overflow-y-auto">
            <div className="py-2">
              {isLoading ? (
                <div className="px-4 py-2 text-purple-300 text-center">
                  Searching...
                </div>
              ) : (
                searchResults.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-purple-500/20 transition-colors"
                    onClick={() => {
                      handleSongSelect(song)
                      setIsDropdownOpen(false)
                    }}
                  >
                    <img 
                      src={song.albumArt} 
                      alt="" 
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg'
                      }}
                    />
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-purple-100 font-medium truncate">
                        {song.title}
                      </div>
                      <div className="text-purple-300 text-sm truncate">
                        {song.artist}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
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

