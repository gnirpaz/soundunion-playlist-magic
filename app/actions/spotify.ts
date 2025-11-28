"use server"

import { auth } from "@/app/auth"
import { searchSpotify } from "@/app/utils/spotify"

// Server action for creating playlist with server-side auth
export async function createSpotifyPlaylistAction(name: string, songs: string[]) {
  const session = await auth()
  if (!session?.accessToken) {
    throw new Error("Not authenticated")
  }

  // Get user ID
  const userResponse = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': `Bearer ${session.accessToken}` }
  })
  
  if (!userResponse.ok) {
    throw new Error('Failed to get user info')
  }
  
  const user = await userResponse.json()

  // Create playlist
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
        public: true,
        description: 'Created with Playlist Creator'
      })
    }
  )
  
  if (!playlistResponse.ok) {
    throw new Error('Failed to create playlist')
  }
  
  const playlist = await playlistResponse.json()

  // Search and add tracks
  const trackIds: string[] = []
  const notFound: string[] = []
  
  for (const song of songs) {
    try {
      const track = await searchSpotify(song, session.accessToken)
      if (track) {
        trackIds.push(track.id)
      } else {
        notFound.push(song)
      }
    } catch {
      notFound.push(song)
    }
  }

  // Add tracks in batches of 100
  for (let i = 0; i < trackIds.length; i += 100) {
    const batch = trackIds.slice(i, i + 100)
    await fetch(
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
  }

  return {
    playlistId: playlist.id,
    tracksFound: trackIds.length,
    totalTracks: songs.length,
    notFound
  }
}
