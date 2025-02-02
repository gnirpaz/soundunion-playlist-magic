import NextAuth from "next-auth"
import Spotify from "next-auth/providers/spotify"

declare module "next-auth" {
  interface Session {
    accessToken?: string
  }
}

const SPOTIFY_SCOPES = [
  'user-read-email',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'playlist-read-private'
].join(' ')

const SPOTIFY_AUTH_URL = 
  'https://accounts.spotify.com/authorize?' + 
  new URLSearchParams({
    scope: SPOTIFY_SCOPES
  })

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Spotify({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    authorization: SPOTIFY_AUTH_URL
  })],
  debug: true,
  callbacks: {
    async jwt({ token, account }) {
      console.log('JWT Callback:', { token, account })
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session Callback:', { session, token })
      session.accessToken = token.accessToken as string
      return session
    }
  }
})

