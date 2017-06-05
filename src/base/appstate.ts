import {Playlist} from "./playlist";
import {Setting} from "./setting";
import { ReactPlayerDB, SettingIdPrefix, CurrentPlaylistSetting, PlaylistIdPrefix, CurrentSongIndexSetting } from "./typedefs";

import { observable, computed, autorun, observe, IValueDidChange } from "mobx"
import { PlayerState } from "./enums";
import { mod } from "./util";

const WaveSurferCount = 3;

export class AppState {

    private playlists: Playlist[] = [];
    private currentFiles: string[] = ["", "", ""];
    private prevCurrentIndex: number = -1;
    private prevCurrentVolume: number = -1;

    constructor(private db: ReactPlayerDB) {
        observe(this, "currentIndex", (change: IValueDidChange<number>) => {
            this.prevCurrentIndex = change.oldValue;
        });
        let selectOptions: PouchDB.Core.AllDocsWithinRangeOptions = {
            include_docs: true,
            startkey: SettingIdPrefix,
            endkey: `${SettingIdPrefix}\uffff`
        } 

        this.db.allDocs(selectOptions).then(response => {
            let selectOptions: PouchDB.Core.AllDocsWithinRangeOptions = {
                include_docs: true,
                startkey: PlaylistIdPrefix,
                endkey: `${PlaylistIdPrefix}\uffff`
            }
            this.db.allDocs(selectOptions).then(res => {
                this.playlists = res.rows.map(row => row.doc).map(doc => doc as Playlist);
                this.settings = response.rows.map(row => row.doc).map(doc => doc as Setting<any>);
            });
        }); 
    }

    // observable values (includes computed-properties)
    @observable
    currentVolume: number = 0.5;

    @observable
    state: PlayerState[] = [PlayerState.Loaded, PlayerState.Loaded, PlayerState.Loaded];

    @observable 
    settings: Setting<any>[] = [];

    @computed
    get containerState(): "enabled" | "disabled" {
        return ((this.playlist !== undefined) && (this.playlist.Tracks.length > 0)) ? "enabled" : "disabled";  
    }

    @computed
    get currentIndex(): number {
        let value = this.getValueFromSetting<number>(CurrentSongIndexSetting);
        return (value === undefined) ? -1 : value;
    }

    @computed
    get normalizedCurrentIndex(): number {
        return (this.currentIndex < 0) ? -1 : mod(this.currentIndex, WaveSurferCount);
    }

    @computed
    get playerState(): PlayerState {
         return this.state[mod(this.currentIndex, this.state.length)];
    }

    @computed
    get playlist(): Playlist {
        let retValue = undefined;
        let currentPlaylistSetting = this.getValueFromSetting<string>(CurrentPlaylistSetting);
        if (currentPlaylistSetting) {
            let playlist = this.playlists.find(plist => plist._id == currentPlaylistSetting);
            if (playlist)
                retValue = playlist;
        }
        return retValue;
    }

    @computed
    get currentFile(): string[] {
        if (this.currentIndex >= 0) {
            if (this.currentFiles.every(file => file === "")) {
                let indizes = [this.currentIndex - 1, this.currentIndex, this.currentIndex + 1];
                indizes.filter(index => (index >= 0) && (index < this.playlist.Tracks.length)).forEach(index => this.currentFiles[index] = this.playlist.Tracks[index].path);
            }
            else {
                let changeValue = this.currentIndex - this.prevCurrentIndex;
                console.log(`changeValue=${changeValue}`);
                //let newIndex = this.currentIndex + changeValue;
                let trackToInsertIndex = this.currentIndex + changeValue;
                let insertIndex = mod(trackToInsertIndex, WaveSurferCount);
                let path = ((trackToInsertIndex > 0) && (this.playlist.Tracks.length > trackToInsertIndex)) ? this.playlist.Tracks[trackToInsertIndex].path : "";
                this.currentFiles[insertIndex] = path;
            }
        }
        return this.currentFiles;
    }

    // actions
    public play(): void {
        this.changePlayerState(PlayerState.Playing);
    }

    public pause(): void {
        this.changePlayerState(PlayerState.Paused);
    }

    public stop(): void {
        this.changePlayerState(PlayerState.Stopped);
    }

    public forward(): void {
        this.trackChange(1);
    }

    public backward(): void {
        this.trackChange(-1);
    }

    public increaseVolume(): void {
        this.changeVolume(0.1, val => val <= 1);
    }

    public decreaseVolume(): void {
        this.changeVolume(-0.1, val => val >= 0);
    }

    public toggleMute(): void {
        if (this.prevCurrentVolume === -1) {
            this.prevCurrentVolume = this.currentVolume;
            this.currentVolume = 0;
        }
        else {
            this.currentVolume = this.prevCurrentVolume;
            this.prevCurrentVolume = -1;
        }
    }

    // private helper methods
    private changeVolume(changeValue: number, predicate: (val: number) => boolean): void {
        let newVolume = this.currentVolume + changeValue;
        if (predicate(newVolume))
            this.currentVolume = newVolume;
    }

    private changePlayerState(newState: PlayerState): void {
        this.state[mod(this.currentIndex, WaveSurferCount)] = newState;
    }

    private trackChange(changeValue: number): void {
        let newIndex = this.getValueFromSetting<number>(CurrentSongIndexSetting) + changeValue;
        this.setSettingValue(CurrentSongIndexSetting, newIndex);
        // TODO update this.state here
        let loadIndex = mod((newIndex - changeValue), WaveSurferCount);
        let playIndex = mod(newIndex, WaveSurferCount);
        let trackToInsertIndex = newIndex + changeValue;
        let insertIndex = mod(trackToInsertIndex, WaveSurferCount);
        this.state[loadIndex] = PlayerState.Loaded;
        this.state[playIndex] = PlayerState.Playing;
        this.state[insertIndex] = PlayerState.Loaded;
    }

    private getValueFromSetting<T>(name: string): T {
        let retValue = undefined;
        if (this.settings.length>0) {
            let setting = this.settings.find(setting => setting._id === name) as Setting<T>;
            if (setting)
                retValue = setting.Value;
        }
        return retValue;
    }

    private setSettingValue<T>(name: string, value: T): void {
        if (this.settings.length>0) {
            let setting = this.settings.find(setting => setting._id === name) as Setting<T>;
            if (setting)
                setting.Value = value;
        }
    }

}