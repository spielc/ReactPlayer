import PouchDB = require("pouchdb-browser");
import {Track} from "./track";
import {Playlist} from "./playlist";
import {Setting} from "./setting";

export type ReactPlayerDB = PouchDB.Database<Track | Playlist | Setting<any>>;

export type PlayerMessageTypes = "PlayerMessage.Play" | "PlayerMessage.Pause" | "PlayerMessage.Stop" | "PlayerMessage.Forward" | "PlayerMessage.Backward";

export const PlayerMessageType = "PlayerMessage";
export const PlayerMessageTypes_Play = PlayerMessageType + ".Play";
export const PlayerMessageTypes_Pause = PlayerMessageType + ".Pause";
export const PlayerMessageTypes_Stop = PlayerMessageType + ".Stop";
export const PlayerMessageTypes_Forward = PlayerMessageType + ".Forward";
export const PlayerMessageTypes_Backward = PlayerMessageType + ".Backward";

export type PlaylistMessageTypes = "PlaylistMessage.Switched" | "PlaylistMessage.Changed" | "PlaylistMessage.TrackChanged" | "PlaylistMessage.TrackRemoved";

export const PlaylistMessageType = "PlaylistMessage";
export const PlaylistMessage_Switched = PlaylistMessageType + ".Switched";
export const PlaylistMessage_Changed = PlaylistMessageType + ".Changed";
export const PlaylistMessage_TrackChanged = PlaylistMessageType + ".TrackChanged";
export const PlaylistMessage_TrackRemoved = PlaylistMessageType + ".TrackRemoved";

export const CurrentSongIndexSetting = "PlaylistComponent.Settings.CurrentSongIndex";

export const WindowManagementMessageType = "WindowManagementMessage";
export const WindowManagementMessage_Define = WindowManagementMessageType + ".Define";
export const WindowManagementMessage_Show = WindowManagementMessageType + ".Show";

