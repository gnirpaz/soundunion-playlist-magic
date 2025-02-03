interface PlaylistResultProps {
  link: string
}

export default function PlaylistResult({ link }: PlaylistResultProps) {
  return (
    <div className="mt-4 p-4 bg-green-100 rounded-lg">
      <h2 className="text-xl font-bold mb-2 text-green-800">Your Playlist is Ready!</h2>
      <p className="mb-4">
        Your playlist has been created successfully. You can now open it in Spotify and start listening!
      </p>
      <p>
        Here&apos;s your Spotify playlist link:{" "}
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          {link}
        </a>
      </p>
    </div>
  )
}

