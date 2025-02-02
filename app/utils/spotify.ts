// Helper to clean song title for better matching
export function cleanSongTitle(title: string): string {
  const patterns = [
    /\(ver[\s.]?\d+\)/i,
    /\(version\s?\d+\)/i,
    /\(live\)/i,
    /\([^)]*version[^)]*\)/i,
    /\(feat.[^)]*\)/i,
    /\(remaster(ed)?\s*\d*\)/i,
    /\([^)]*mix[^)]*\)/i,
    /\([^)]*edit[^)]*\)/i,
    /-\s*remaster(ed)?\s*\d*/i,
    /-\s*single\s*version/i,
  ]
  
  let cleaned = title.toLowerCase()
  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '')
  })
  return cleaned.trim()
}

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
}

export async function searchTrack(accessToken: string, artist: string, title: string) {
  const cleanTitle = cleanSongTitle(title)
  const queries = [
    `"${cleanTitle}" ${artist}`,
    `${cleanTitle} ${artist}`,
    `track:"${cleanTitle}"`,
    cleanTitle
  ]

  for (const query of queries) {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    )
    const data = await response.json()
    
    if (!data.tracks?.items?.length) continue

    const exactMatch = data.tracks.items.find((track: SpotifyTrack) => {
      const trackTitle = cleanSongTitle(track.name)
      return trackTitle === cleanTitle && 
             track.artists[0].name.toLowerCase() === artist.toLowerCase()
    })

    if (exactMatch) return exactMatch.id
    return data.tracks.items[0].id
  }
  return null
}

export async function createPlaylist(
  accessToken: string, 
  name: string, 
  songs: string[],
  logger: (type: string, level: string, data: any) => void
) {
  if (!accessToken) throw new Error('No access token provided')
  if (!songs.length) throw new Error('No songs provided')

  logger('Starting playlist creation', 'info', { totalSongs: songs.length })

  // 1. Search and collect tracks
  const foundTracks: string[] = []
  
  for (const song of songs) {
    logger('Searching', 'info', { song })
    try {
      const track = await searchSpotify(song, accessToken)
      if (track) {
        foundTracks.push(`spotify:track:${track.id}`)
        logger('Track found', 'info', {
          song,
          track: track.name,
          artist: track.artists[0].name
        })
      } else {
        logger('Track not found', 'error', { song })
      }
    } catch (error) {
      logger('Search failed', 'error', { song, error: String(error) })
    }
  }

  if (!foundTracks.length) {
    throw new Error('No tracks found')
  }

  // 2. Create playlist
  logger('Creating playlist', 'info', { trackCount: foundTracks.length })
  const userId = await getCurrentUserId(accessToken)
  const createResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name || 'My Generated Playlist',
      description: 'Created with Playlist Creator',
      public: false
    })
  })

  if (!createResponse.ok) {
    const error = await createResponse.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to create playlist')
  }

  const playlist = await createResponse.json()

  // 3. Add tracks
  const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uris: foundTracks })
  })

  if (!addTracksResponse.ok) {
    const error = await addTracksResponse.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to add tracks to playlist')
  }

  logger('Playlist created', 'info', { 
    playlistId: playlist.id,
    tracks: foundTracks.length
  })

  return { 
    playlistId: playlist.id,
    trackIds: foundTracks.map(uri => uri.split(':')[2])
  }
}

async function getCurrentUserId(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to get user ID')
  }
  
  const data = await response.json()
  return data.id
}

export async function searchSpotify(query: string, accessToken: string) {
  if (!accessToken) {
    throw new Error('No access token provided')
  }

  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `Search failed: ${response.status}`)
  }
  
  const data = await response.json()
  return data.tracks?.items[0] || null
}

export async function getPlaylistUrl(accessToken: string, playlistId: string) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get playlist details')
  }

  const data = await response.json()
  return data.external_urls?.spotify
}

// Add this function to get playlist tracks
export async function getPlaylistTracks(accessToken: string, playlistId: string) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get playlist tracks')
  }

  const data = await response.json()
  return data.items.map((item: any) => ({
    name: item.track.name,
    artist: item.track.artists[0].name,
    album: item.track.album.name,
    duration: item.track.duration_ms,
    image: item.track.album.images[0]?.url
  }))
} 