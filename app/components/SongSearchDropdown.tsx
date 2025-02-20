import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Track {
  id: string
  name: string
  artist: string
  albumArt: string
}

interface SongSearchDropdownProps {
  query: string
  onSelect: (songName: string, artistName: string) => void
  className?: string
}

export default function SongSearchDropdown({ query, onSelect, className = '' }: SongSearchDropdownProps) {
  const { data: session } = useSession()
  const [results, setResults] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim() || !session?.accessToken) {
      setResults([])
      return
    }
    
    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        console.log('Searching with query:', query.trim())
        console.log('Session token available:', !!session.accessToken)
        
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query.trim())}&type=track&limit=10`,
          {
            headers: { 
              'Authorization': `Bearer ${session.accessToken}`
            }
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Spotify API error:', errorData)
          throw new Error(`Spotify API error: ${errorData.error?.message || response.statusText}`)
        }

        const data = await response.json()
        console.log('Spotify search results:', data)
        
        if (data.tracks?.items) {
          const tracks = data.tracks.items.map((track: any) => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            albumArt: track.album.images[0]?.url || ''
          }))
          setResults(tracks)
        } else {
          setResults([])
        }
      } catch (error) {
        console.error('Search failed:', error)
        setError(error instanceof Error ? error.message : 'Search failed')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, session?.accessToken])

  return (
    <div className={`absolute z-50 w-full bg-black/90 rounded-xl border border-purple-500/20 mt-1 max-h-[300px] overflow-auto shadow-xl ${className}`}>
      {isLoading ? (
        <div className="p-4 text-purple-300/60 text-center">Searching...</div>
      ) : error ? (
        <div className="p-4 text-red-400/60 text-center">{error}</div>
      ) : results.length > 0 ? (
        <ul className="py-2">
          {results.map(result => (
            <li key={result.id}>
              <button
                onClick={() => onSelect(result.name, result.artist)}
                className="w-full px-4 py-2 text-left hover:bg-purple-500/10 text-purple-100 flex items-center gap-3"
              >
                <div className="w-12 h-12 flex-shrink-0">
                  <img
                    src={result.albumArt}
                    alt={`${result.name} album art`}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                <div>
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-purple-300/60">{result.artist}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-4 text-purple-300/60 text-center">No results found</div>
      )}
    </div>
  )
} 