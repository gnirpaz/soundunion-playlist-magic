interface Window {
  Spotify: {
    Player: new (options: {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    }) => Spotify.Player;
  };
  onSpotifyWebPlaybackSDKReady: () => void;
}

declare namespace Spotify {
  interface PlaybackState {
    context: {
      uri: string | null;
      metadata: Record<string, unknown>;
    };
    disallows: {
      pausing?: boolean;
      peeking_next?: boolean;
      peeking_prev?: boolean;
      resuming?: boolean;
      seeking?: boolean;
      skipping_next?: boolean;
      skipping_prev?: boolean;
    };
    paused: boolean;
    position: number;
    duration: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
  }

  interface Track {
    uri: string;
    id: string;
    type: string;
    media_type: string;
    name: string;
    is_playable: boolean;
    album: {
      uri: string;
      name: string;
      images: { url: string; height: number; width: number }[];
    };
    artists: { uri: string; name: string }[];
    duration_ms: number;
  }

  interface Player {
    // Connection
    connect(): Promise<boolean>;
    disconnect(): void;
    
    // Event listeners
    addListener(event: 'ready', callback: (data: { device_id: string }) => void): void;
    addListener(event: 'not_ready', callback: (data: { device_id: string }) => void): void;
    addListener(event: 'player_state_changed', callback: (state: PlaybackState | null) => void): void;
    addListener(event: 'initialization_error', callback: (data: { message: string }) => void): void;
    addListener(event: 'authentication_error', callback: (data: { message: string }) => void): void;
    addListener(event: 'account_error', callback: (data: { message: string }) => void): void;
    addListener(event: 'playback_error', callback: (data: { message: string }) => void): void;
    addListener(event: string, callback: (state: unknown) => void): void;
    removeListener(event: string, callback?: (state: unknown) => void): void;
    
    // Playback controls (native SDK methods)
    togglePlay(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    
    // Volume control
    setVolume(volume: number): Promise<void>;
    getVolume(): Promise<number>;
    
    // State
    getCurrentState(): Promise<PlaybackState | null>;
    
    // Activation
    activateElement(): Promise<void>;
  }
}
