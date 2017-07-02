import { Setting } from "./setting";
import { Track } from "./track";
import { Playlist } from "./playlist";

export type ChangeType = "update" | "add" | "remove";

export interface Persistence {
    init(): Promise<any>;
    persistSetting(setting: Setting<any>, type: ChangeType): void;
    persistTrack(track: Track, type: ChangeType): void;
    persistPlaylist(playlist: Playlist, type: ChangeType): void;
}