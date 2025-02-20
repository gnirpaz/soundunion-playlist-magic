import { NextResponse } from 'next/server'
import { auth } from "@/app/auth"

// These types match Spotify's API response structure
interface SpotifyTrackItem {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrackItem[]
  }
}

interface Song {
  id: string
  title: string
  artist: string
  albumArt: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    console.log('Search query:', query)

    if (!query) {
      return NextResponse.json<{ songs: Song[] }>({ songs: [] })
    }

    const session = await auth()
    console.log('Auth session:', !!session?.accessToken)

    if (!session?.accessToken) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        }
      }
    )

    const data = await response.json() as SpotifySearchResponse
    console.log('Spotify response:', data)
    
    const songs: Song[] = data.tracks.items.map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists[0].name,
      albumArt: track.album.images[0]?.url || '/placeholder.svg'
    }))

    return NextResponse.json<{ songs: Song[] }>({ songs })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json<{ songs: Song[] }>({ songs: [] })
  }
} 