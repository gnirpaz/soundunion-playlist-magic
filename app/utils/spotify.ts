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

type LoggerFunction = (type: string, level: 'info' | 'error', data: Record<string, unknown>) => void

export async function createPlaylist(
  accessToken: string, 
  name: string, 
  songs: string[],
  logger: LoggerFunction
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

  // Check for recent playlist to avoid duplication
  try {
    const existingPlaylistId = await findRecentPlaylist(accessToken)
    if (existingPlaylistId) {
      logger('Found existing playlist', 'info', { playlistId: existingPlaylistId })
      
      // Add tracks to existing playlist
      const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${existingPlaylistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: foundTracks })
      })

      if (!addTracksResponse.ok) {
        throw new Error('Failed to add tracks to existing playlist')
      }

      return { 
        playlistId: existingPlaylistId,
        trackIds: foundTracks.map(uri => uri.split(':')[2])
      }
    }
  } catch (error) {
    logger('Error checking existing playlist', 'error', { error: String(error) })
    // Continue with creating new playlist if check fails
  }

  // Create new playlist only if no recent playlist exists
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

type SpotifyTrackResponse = {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
  preview_url: string | null
}

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
  
  return data.items.map((item: { track?: SpotifyTrackResponse }) => {
    if (!item?.track) {
      console.error('Invalid track data:', item)
      return null
    }

    const track = {
      id: item.track.id || '',
      name: item.track.name || 'Unknown Track',
      artist: item.track.artists?.[0]?.name || 'Unknown Artist',
      album: item.track.album?.name || 'Unknown Album',
      duration: item.track.duration_ms || 0,
      image: item.track.album?.images?.[0]?.url || null,
      previewUrl: item.track.preview_url || null
    }
    return track
  }).filter(Boolean)
}

export async function renamePlaylist(accessToken: string, playlistId: string, name: string) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  })

  if (!response.ok) {
    throw new Error('Failed to update playlist name')
  }
}

export async function getPlaylistDetails(accessToken: string, playlistId: string) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get playlist details')
  }

  const data = await response.json()
  
  const tracks = data.tracks.items.map((item: { track?: SpotifyTrackResponse }) => {
    if (!item?.track) return null
    return {
      id: item.track.id || '',
      name: item.track.name || 'Unknown Track',
      artist: item.track.artists?.[0]?.name || 'Unknown Artist',
      album: item.track.album?.name || 'Unknown Album',
      duration: item.track.duration_ms || 0,
      image: item.track.album?.images?.[0]?.url || null,
      previewUrl: item.track.preview_url || null
    }
  }).filter(Boolean)

  return {
    name: data.name,
    url: data.external_urls?.spotify,
    tracks
  }
}

export async function findRecentPlaylist(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=1', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to check recent playlists')
  }

  const data = await response.json()
  return data.items[0]?.id
} 