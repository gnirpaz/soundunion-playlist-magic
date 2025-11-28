"use client"

import { useState, useEffect, useRef } from "react"
import { PlusCircle, Search, X, GripVertical, ChevronUp, ChevronDown, Music } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchResult {
  id: string
  title: string
  artist: string
  albumArt: string
}

interface SongEntry {
  id: string
  text: string
  artist?: string
  title?: string
  albumArt?: string
}

interface SongInputProps {
  onSubmit: (songs: string[]) => void
}

export default function SongInput({ onSubmit }: SongInputProps) {
  const [songs, setSongs] = useState<SongEntry[]>([])
  const [manualInput, setManualInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSongSelect = (song: SearchResult) => {
    const newSong: SongEntry = {
      id: `${song.id}-${Date.now()}`,
      text: `${song.artist} - ${song.title}`,
      artist: song.artist,
      title: song.title,
      albumArt: song.albumArt
    }
    setSongs(prev => [...prev, newSong])
    setSearchTerm('')
    setSearchResults([])
    setIsDropdownOpen(false)
  }

  const handleManualAdd = () => {
    if (!manualInput.trim()) return
    
    const newSong: SongEntry = {
      id: `manual-${Date.now()}`,
      text: manualInput.trim()
    }
    setSongs(prev => [...prev, newSong])
    setManualInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleManualAdd()
    }
  }

  const removeSong = (id: string) => {
    setSongs(prev => prev.filter(song => song.id !== id))
  }

  const moveSong = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= songs.length) return
    
    const newSongs = [...songs]
    const [removed] = newSongs.splice(fromIndex, 1)
    newSongs.splice(toIndex, 0, removed)
    setSongs(newSongs)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    moveSong(draggedIndex, index)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (songs.length === 0) return
    onSubmit(songs.map(song => song.text))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-extrabold bg-gradient-to-br from-white to-purple-400 bg-clip-text text-transparent">
          Add Your Tracks
        </h2>
        <p className="text-purple-300/60 font-light">Build your sonic arsenal</p>
      </div>

      {/* Search input */}
      <div className="relative" ref={searchContainerRef}>
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
            placeholder="Search for songs on Spotify..."
            className="pl-10 bg-black/50 border-purple-500/20 text-purple-100 placeholder-purple-300/40"
          />
        </div>

        {/* Search results dropdown */}
        {isDropdownOpen && (searchResults.length > 0 || isLoading) && (
          <div className="absolute z-20 w-full mt-1 bg-black/95 border border-purple-500/20 rounded-lg shadow-xl max-h-[300px] overflow-y-auto">
            <div className="py-2">
              {isLoading ? (
                <div className="px-4 py-3 text-purple-300 text-center">
                  <div className="animate-pulse">Searching...</div>
                </div>
              ) : (
                searchResults.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-purple-500/20 transition-colors"
                    onClick={() => handleSongSelect(song)}
                  >
                    {song.albumArt ? (
                      <img 
                        src={song.albumArt} 
                        alt="" 
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-purple-900/50 flex items-center justify-center">
                        <Music size={20} className="text-purple-400" />
                      </div>
                    )}
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-purple-100 font-medium truncate">{song.title}</div>
                      <div className="text-purple-300/60 text-sm truncate">{song.artist}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Manual input */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Or type manually: Artist - Song Title"
          className="flex-1 bg-black/50 border-purple-500/20 text-purple-100 placeholder-purple-300/40"
        />
        <Button
          type="button"
          onClick={handleManualAdd}
          disabled={!manualInput.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
        >
          Add
        </Button>
      </div>

      {/* Song list */}
      {songs.length > 0 && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-25" />
          <div className="relative bg-black/50 rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="px-4 py-2 border-b border-purple-500/10 flex justify-between items-center">
              <span className="text-sm text-purple-300/60">{songs.length} track{songs.length !== 1 ? 's' : ''}</span>
              <button
                type="button"
                onClick={() => setSongs([])}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Clear all
              </button>
            </div>
            <ul className="divide-y divide-purple-500/10 max-h-[300px] overflow-y-auto">
              {songs.map((song, index) => (
                <li
                  key={song.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 px-4 py-3 group/item hover:bg-purple-500/10 transition-colors cursor-grab active:cursor-grabbing
                    ${draggedIndex === index ? 'opacity-50 bg-purple-500/20' : ''}`}
                >
                  <GripVertical size={16} className="text-purple-500/40 group-hover/item:text-purple-400 flex-shrink-0" />
                  
                  {song.albumArt ? (
                    <img src={song.albumArt} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <Music size={18} className="text-purple-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {song.title ? (
                      <>
                        <div className="text-white truncate">{song.title}</div>
                        <div className="text-purple-300/60 text-sm truncate">{song.artist}</div>
                      </>
                    ) : (
                      <div className="text-white truncate">{song.text}</div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveSong(index, index - 1)}
                      disabled={index === 0}
                      className="p-1 text-purple-500/40 hover:text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSong(index, index + 1)}
                      disabled={index === songs.length - 1}
                      className="p-1 text-purple-500/40 hover:text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSong(song.id)}
                      className="p-1 text-purple-500/40 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Empty state */}
      {songs.length === 0 && (
        <div className="text-center py-8 text-purple-300/40">
          <Music size={40} className="mx-auto mb-3 opacity-50" />
          <p>No tracks added yet</p>
          <p className="text-sm mt-1">Search for songs or add them manually above</p>
        </div>
      )}

      {/* Submit button */}
      <button 
        type="submit" 
        disabled={songs.length === 0} 
        className="relative w-full group disabled:cursor-not-allowed"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 group-disabled:opacity-30" />
        <div className="relative flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-xl text-white font-bold transition-all duration-300 hover:from-purple-400 hover:to-fuchsia-400 disabled:opacity-50 disabled:hover:from-purple-500 disabled:hover:to-fuchsia-500">
          <PlusCircle size={24} className="mr-2" />
          Create Playlist ({songs.length} track{songs.length !== 1 ? 's' : ''})
        </div>
      </button>
    </form>
  )
}
