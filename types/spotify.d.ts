interface Window {
  Spotify: {
    Player: new (options: {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
    }) => Spotify.Player;
  };
  onSpotifyWebPlaybackSDKReady: () => void;
}

declare namespace Spotify {
  interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: string, callback: (state: any) => void): void;
    removeListener(event: string, callback: (state: any) => void): void;
  }
} 