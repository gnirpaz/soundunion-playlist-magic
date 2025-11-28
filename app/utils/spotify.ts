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

// Add a Set to track playlist creation requests
const playlistCreationRequests = new Set<string>()

export interface CreatePlaylistResult {
  playlistId: string
  trackIds: string[]
  foundCount: number
  totalCount: number
  notFoundSongs: string[]
}

export async function createPlaylist(
  accessToken: string, 
  name: string, 
  songs: string[],
  logger: LoggerFunction
): Promise<CreatePlaylistResult> {
  // Create a unique key for this request
  const requestKey = `${accessToken}-${songs.join(',')}`
  
  if (playlistCreationRequests.has(requestKey)) {
    logger('Duplicate playlist creation prevented', 'info', { name })
    throw new Error('Playlist creation already in progress')
  }

  try {
    playlistCreationRequests.add(requestKey)
    logger('Starting playlist creation', 'info', { totalSongs: songs.length })

    if (!accessToken) throw new Error('No access token provided')
    if (!songs.length) throw new Error('No songs provided')

    // 1. Search and collect tracks
    const foundTracks: string[] = []
    const notFoundSongs: string[] = []
    
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
          notFoundSongs.push(song)
          logger('Track not found', 'error', { song })
        }
      } catch (error) {
        notFoundSongs.push(song)
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
      tracks: foundTracks.length,
      notFound: notFoundSongs.length
    })

    return { 
      playlistId: playlist.id,
      trackIds: foundTracks.map(uri => uri.split(':')[2]),
      foundCount: foundTracks.length,
      totalCount: songs.length,
      notFoundSongs
    }
  } finally {
    playlistCreationRequests.delete(requestKey)
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

// Update the search function with proper types
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
  
  const data = await response.json() as SpotifySearchResponse
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

// Types for user playlists
export interface UserPlaylist {
  id: string
  name: string
  description: string | null
  images: { url: string }[]
  tracks: { total: number }
  external_urls: { spotify: string }
  owner: { display_name: string }
}

interface PlaylistsResponse {
  items: UserPlaylist[]
  total: number
  limit: number
  offset: number
  next: string | null
}

export async function getUserPlaylists(accessToken: string, limit = 50, offset = 0): Promise<{
  playlists: UserPlaylist[]
  total: number
  hasMore: boolean
}> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch playlists')
  }

  const data: PlaylistsResponse = await response.json()
  
  return {
    playlists: data.items,
    total: data.total,
    hasMore: data.next !== null
  }
}

// Add tracks to an existing playlist
export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: trackUris })
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to add tracks')
  }
}

// Remove tracks from a playlist
export async function removeTracksFromPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tracks: trackUris.map(uri => ({ uri }))
      })
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to remove tracks')
  }
}

// Delete a playlist (unfollow)
export async function deletePlaylist(
  accessToken: string,
  playlistId: string
): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/followers`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to delete playlist')
  }
}

// Update playlist details (name, description)
export async function updatePlaylistDetails(
  accessToken: string,
  playlistId: string,
  updates: { name?: string; description?: string; public?: boolean }
): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to update playlist')
  }
}

// Reorder tracks in a playlist
export async function reorderPlaylistTracks(
  accessToken: string,
  playlistId: string,
  rangeStart: number,
  insertBefore: number,
  rangeLength = 1
): Promise<void> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range_start: rangeStart,
        insert_before: insertBefore,
        range_length: rangeLength
      })
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to reorder tracks')
  }
} 