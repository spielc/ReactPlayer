export enum PlayerState {
    Loaded = 0,
    Ready,
    Playing,
    Paused,
    Stopped,
    Forward,
    Backward
}

export enum PlayerMessageTypes {
    Play,
    Pause,
    Stop,
    Forward,
    Backward
}

export enum PlaylistMessageTypes {
    
}
export enum DocumentType {
    Track,
    Playlist,
    Setting
}