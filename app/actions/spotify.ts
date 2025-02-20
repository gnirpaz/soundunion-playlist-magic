import { auth } from "@/app/auth"
import { cleanSongTitle } from "@/app/utils/spotify"

type SpotifyTrack = {
  name: string
  artists: Array<{ name: string }>
  id: string
}

async function searchTrack(accessToken: string, artist: string, title: string) {
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

export async function createSpotifyPlaylist(name: string, songs: string[]) {
  const session = await auth()
  if (!session?.accessToken) {
    throw new Error("Not authenticated")
  }

  // Get user ID
  const userResponse = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': `Bearer ${session.accessToken}` }
  })
  const user = await userResponse.json()

  // Create playlist with name and description immediately
  const playlistResponse = await fetch(
    `https://api.spotify.com/v1/users/${user.id}/playlists`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description: 'Created with Spotify Playlist Creator',
        public: true
      })
    }
  )

  if (!playlistResponse.ok) {
    const error = await playlistResponse.json()
    throw new Error(`Failed to create playlist: ${error.error?.message || playlistResponse.statusText}`)
  }

  const playlist = await playlistResponse.json()

  // Search and add tracks
  const trackIds = []
  for (const song of songs) {
    const [artist, title] = song.split('-').map(s => s.trim())
    const trackId = await searchTrack(session.accessToken, artist, title)
    if (trackId) trackIds.push(trackId)
  }

  // Add tracks in batches
  if (trackIds.length > 0) {
    for (let i = 0; i < trackIds.length; i += 100) {
      const batch = trackIds.slice(i, i + 100)
      const addTracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: batch.map(id => `spotify:track:${id}`)
          })
        }
      )

      if (!addTracksResponse.ok) {
        console.error('Failed to add tracks:', await addTracksResponse.json())
      }
    }
  }

  return {
    playlistId: playlist.id,
    playlistName: name,
    tracksFound: trackIds.length,
    totalTracks: songs.length
  }
} 