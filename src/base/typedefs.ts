import PouchDB = require("pouchdb-browser");
import {Track} from "./track";
import {Playlist} from "./playlist";
import {Setting} from "./setting";
import {app, BrowserWindow, ipcMain} from "electron";

export interface WindowDefinitionType {
    WindowId: string,
    URL: string,
    Options: Electron.BrowserWindowOptions
} //[string, string, Electron.BrowserWindowOptions];

export interface WindowRegisterHandlerType {
    WindowId: string,
    EventId: string
}

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

export const WindowManagementMessageType = "WindowManagementMessage";
export const WindowManagementMessage_Define = WindowManagementMessageType + ".Define";
export const WindowManagementMessage_Show = WindowManagementMessageType + ".Show";
export const WindowManagementMessage_RegisterHandler = WindowManagementMessageType + ".RegisterHandler";
export const WindowManagementMessage_UnregisterHandler = WindowManagementMessageType + ".UnregisterHandler";
export const WindowManagementMessage_LifeCycleEvent = WindowManagementMessageType + ".LifeCycleEvent";

export const SettingsWindowName = "SettingsWindow";

export const SettingIdPrefix = "Setting.";
export const TrackIdPrefix = "Track.";
export const PlaylistIdPrefix = "Playlist.";

export const CurrentSongIndexSetting = SettingIdPrefix + "PlaylistComponent.CurrentSongIndex";
export const CurrentPlaylistSetting = SettingIdPrefix + "PlaylistComponent.Playlistname";
export const LibraryModeEnabledSetting = SettingIdPrefix + "PlaylistComponent.LibraryModeEnabled";
export const PlaybackStateSetting = SettingIdPrefix + "PlayerComponent.PlaybackState";