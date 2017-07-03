import { observable, computed, autorun, observe, IValueDidChange, action, IArrayChange, IArraySplice, IObjectChange, IObservableArray } from "mobx"
import * as ID3 from "id3-parser";

import {Playlist} from "./playlist";
import {Setting} from "./setting";
import { ReactPlayerDB, TrackIdPrefix, SettingIdPrefix, CurrentPlaylistSetting, PlaylistIdPrefix, CurrentSongIndexSetting, LibraryModeEnabledSetting } from "./typedefs";
import { PlayerState, DocumentType } from "./enums";
import { mod, shuffle } from "./util";
import { Track } from "./track";
import { Persistence } from "./persistence";

const WaveSurferCount = 3;

export class AppState {

    private currentFiles: string[] = ["", "", ""];
    private prevCurrentIndex: number = -1;
    private prevCurrentVolume: number = -1;
    private prevPlaylistName: string = `${PlaylistIdPrefix}All`;
    private clipboard: string[] = [];

    constructor(private persistence: Persistence) {
        observe(this, "currentIndex", (change: IValueDidChange<number>) => {
            this.prevCurrentIndex = change.oldValue;
        });

        // observe(observable(this.playlists), (change: IArrayChange<Playlist> | IArraySplice<Playlist>) => {
        //     let i = 0;
        //     //console.log(`${change.type} : ${change.oldValue} -> ${change.newValue}`);
        // });
        persistence.init().then(res => {
            persistence.getPlaylists().then(result => {
                this.playlists = result;
                observe(observable(this.playlists), change => {
                    let arrayChange = change as IArraySplice<Playlist>;
                    arrayChange.added.forEach(addedObj => persistence.persistPlaylist(this.createPersistablePlaylist(addedObj), "add"));
                    arrayChange.removed.forEach(removedObj => persistence.persistPlaylist(removedObj, "remove"));
                });
            },
            reason => console.log(reason));
            persistence.getSettings().then(result => {
                this.settings = result;
                observe(observable(this.settings), change => {
                    let arrayChange = change as IArraySplice<Setting<any>>;
                    arrayChange.added.forEach(addedObj => persistence.persistSetting(addedObj, "add"));
                    arrayChange.removed.forEach(removedObj => persistence.persistSetting(removedObj, "remove"));
                });
                this.settings.forEach(setting => observe(setting, change => {
                    // let setting = change.object as Setting<any>
                    // console.log(`${setting._id}=${setting.Value}`);
                    persistence.persistSetting(change.object, "update");
                }));
            },
            reason => console.log(reason));
        })

        // persistence.init().then(res => {
        //     let selectOptions: PouchDB.Core.AllDocsWithinRangeOptions = {
        //         include_docs: true,
        //         startkey: SettingIdPrefix,
        //         endkey: `${SettingIdPrefix}\uffff`
        //     } 

        //     this.db.allDocs(selectOptions).then(response => {
        //         let selectOptions: PouchDB.Core.AllDocsWithinRangeOptions = {
        //             include_docs: true,
        //             startkey: PlaylistIdPrefix,
        //             endkey: `${PlaylistIdPrefix}\uffff`
        //         }
        //         this.db.allDocs(selectOptions).then(res => {
        //             this.playlists = res.rows.map(row => row.doc).map(doc => doc as Playlist);
        //             observe(observable(this.playlists), change => {
        //                 let arrayChange = change as IArraySplice<Playlist>;
        //                 arrayChange.added.forEach(addedObj => persistence.persistPlaylist(this.createPersistablePlaylist(addedObj), "add"));
        //                 arrayChange.removed.forEach(removedObj => persistence.persistPlaylist(removedObj, "remove"));
        //             });
        //             this.settings = response.rows.map(row => row.doc).map(doc => doc as Setting<any>);
        //             observe(observable(this.settings), change => {
        //                 let arrayChange = change as IArraySplice<Setting<any>>;
        //                 arrayChange.added.forEach(addedObj => persistence.persistSetting(addedObj, "add"));
        //                 arrayChange.removed.forEach(removedObj => persistence.persistSetting(removedObj, "remove"));
        //             });
        //             //this.persistence.registerObjects(this.settings);
        //             this.settings.forEach(setting => observe(setting, change => {
        //                 // let setting = change.object as Setting<any>
        //                 // console.log(`${setting._id}=${setting.Value}`);
        //                 persistence.persistSetting(change.object, "update");
        //             }));
        //             // let currentPlaylistSetting = this.getValueFromSetting<string>(CurrentPlaylistSetting);
        //             // if (currentPlaylistSetting) {
        //             //     let playlist = this.playlists.find(plist => plist._id == currentPlaylistSetting);
        //             //     if (playlist) {
        //             //         this.playlist = observable(playlist.Tracks);
        //             //         observe(this.playlist, change => {
        //             //             let arrayChange = change as IArraySplice<Track>;
        //             //             arrayChange.added.forEach(addedObj => persistence.persistTrack(addedObj, "add"));
        //             //             arrayChange.removed.forEach(removedObj => persistence.persistTrack(removedObj, "remove"));
        //             //         });
        //             //     }
        //             // }
        //         });
        //     });
        // });

 
    }

    @observable
    selection: string[] = [];

    @observable
    playlists: Playlist[] = [];

    // observable values (includes computed-properties)
    @observable
    currentVolume: number = 0.5;

    @observable
    state: PlayerState[] = [PlayerState.Loaded, PlayerState.Loaded, PlayerState.Loaded];

    @observable 
    settings: Setting<any>[] = [];

    // @observable
    // playlist: IObservableArray<Track> = observable.array<Track>();//Track[] = [];

    @computed
    get playlist(): IObservableArray<Track> {
        let pl = observable.array<Track>();
        let currentPlaylistSetting = this.getValueFromSetting<string>(CurrentPlaylistSetting);
        if (currentPlaylistSetting) {
            let playlist = this.playlists.find(plist => plist._id == currentPlaylistSetting);
            if (playlist) {
                pl.push(...playlist.Tracks);
                observe(pl, change => {
                    let newPlaylist = change.object.map(track => track);
                    this.persistence.persistPlaylist({ ...playlist, Tracks: newPlaylist }, "update");
                });
            }
        }
        return pl;
    }

    @computed
    get playlistNames(): string[] {
        return this.playlists.map(list => list._id);
    }

    @computed
    get libraryModeEnabled(): boolean {
        let value = this.getValueFromSetting<boolean>(LibraryModeEnabledSetting);
        return (value === undefined) ? false : value;
    }

    @computed
    get containerState(): "enabled" | "disabled" {
        return ((this.playlist !== undefined) && (this.playlist.length > 0)) ? "enabled" : "disabled";    
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
    get currentFile(): string[] {
        if (this.currentIndex >= 0) {
            let changeValue = this.currentIndex - this.prevCurrentIndex;
            if (this.currentFiles.every(file => file === "") || (Math.abs(changeValue) > 1)) {
                let indizes = [this.currentIndex - 1, this.currentIndex, this.currentIndex + 1];
                //indizes.filter(index => (index >= 0) && (index < this.playlist.Tracks.length)).forEach(index => this.currentFiles[index] = this.playlist.Tracks[index].path);
                indizes.forEach(index => this.currentFiles[mod(index, WaveSurferCount)] = ((index >= 0) && (this.playlist.length > index)) ? this.playlist[index].path : "");
            }
            else {
                
                console.log(`changeValue=${changeValue}`);
                //let newIndex = this.currentIndex + changeValue;
                let trackToInsertIndex = this.currentIndex + changeValue;
                // if (Math.abs(changeValue) !== 1) {
                //     trackToInsertIndex = this.currentIndex + 1;
                // }
                // else {
                    let insertIndex = mod(trackToInsertIndex, WaveSurferCount);
                    let path = ((trackToInsertIndex > 0) && (this.playlist.length > trackToInsertIndex)) ? this.playlist[trackToInsertIndex].path : "";
                    this.currentFiles[insertIndex] = path;
                // }
                
            }
        }
        return this.currentFiles;
    }

    get isPlaying(): boolean {
        return ((this.currentIndex >= 0) && (this.playerState === PlayerState.Playing));
    }

    // actions
    // TODO decorate all actions with @action
    @action
    public play(newIndex = -1): void {
        if (newIndex >= 0) {
            // this.changePlayerState(PlayerState.Paused);
            // this.trackChange(1, newIndex);
            this.setSettingValue(CurrentSongIndexSetting, newIndex);
            // TODO update this.state here
            let readyIndex = mod((newIndex - 1), WaveSurferCount);
            let playIndex = mod(newIndex, WaveSurferCount);
            let insertIndex = mod(newIndex + 1, WaveSurferCount);
            this.state.fill(PlayerState.Loaded);
        }
        else
            this.changePlayerState(PlayerState.Playing);
    }

    @action
    public pause(): void {
        this.changePlayerState(PlayerState.Paused);
    }

    @action
    public stop(): void {
        this.changePlayerState(PlayerState.Stopped);
    }

    @action
    public forward(): void {
        this.trackChange(1);
    }

    @action
    public backward(): void {
        this.trackChange(-1);
    }

    @action
    public increaseVolume(): void {
        this.changeVolume(0.1, val => val <= 1);
    }

    @action
    public decreaseVolume(): void {
        this.changeVolume(-0.1, val => val >= 0);
    }

    @action
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

    @action
    public ready(index: number): void {
        this.state[index] = PlayerState.Ready;
    }

    @action
    public addTrack(file: File): void {
        let reader = new FileReader();
        reader.onload = (event) => {
            let filePath = file.path;
            var fileReader=event.target as FileReader;
            var data = fileReader.result as ArrayBuffer;
            var dataBuffer = new Uint8Array(data);
            ID3.parse(dataBuffer).then(action("addTrack-action", (tag: ID3.Tag) => {
                let track: Track = {
                    ...tag,
                    _id: `${TrackIdPrefix}${tag.title}_${tag.artist}_${tag.album}`,
                    path: filePath,
                    DocType: DocumentType.Track
                };
                if (!this.playlist.some(t => t._id === track._id)) {
                    // TODO persist track in db
                    this.playlist.push(track);
                    // let library = this.playlists.find(plist => plist._id === `${PlaylistIdPrefix}All`);
                    // library.Tracks = this.playlist;
                }
            }));
        };
        reader.readAsArrayBuffer(file);
        
    }

    @action
    public removeTrack(index: number): void {
        this.playlist.remove(this.playlist[index]);
        // let leftPart = this.playlist.slice(0, index);
        // let rightPart = this.playlist.slice(index + 1);
        // this.playlist = leftPart.concat(rightPart);
        let currentSongIndex = this.getValueFromSetting<number>(CurrentSongIndexSetting);
        if (index < currentSongIndex){
            // this.changePlayerState(PlayerState.Paused);
            // this.trackChange(1, newIndex);
            let newIndex = currentSongIndex - 1;
            this.setSettingValue(CurrentSongIndexSetting, newIndex);
            // TODO update this.state here
            let readyIndex = mod((newIndex - 1), WaveSurferCount);
            let playIndex = mod(newIndex, WaveSurferCount);
            let insertIndex = mod(newIndex + 1, WaveSurferCount);
            this.state.fill(PlayerState.Loaded);
            this.currentFiles.fill("");
        }
    }

    @action
    public toggleLibraryMode(): void {
        let libraryModeSetting = this.getValueFromSetting<boolean>(LibraryModeEnabledSetting, false);
        let currentPlaylistName = this.getValueFromSetting<string>(CurrentPlaylistSetting);
        let newPlaylistName = this.prevPlaylistName;
        if (currentPlaylistName !== newPlaylistName) {
            this.prevPlaylistName = currentPlaylistName;
            this.setSettingValue(CurrentPlaylistSetting, newPlaylistName);
        }
        this.setSettingValue(LibraryModeEnabledSetting, !libraryModeSetting);
    }

    @action
    public clearPlaylist(): void {
        this.playlist.clear();
    }

    @action
    public addPlaylist(name: string): void {
        let playlist: Playlist = {
            _id: `${PlaylistIdPrefix}${name}`,
            DocType: DocumentType.Playlist,
            Tracks: []
        }
        this.playlists.push(playlist);
    }

    @action
    public shufflePlaylist(): void {
        shuffle(this.playlist);
        // let currentPlaylistSetting = this.getValueFromSetting<string>(CurrentPlaylistSetting);
        // if (currentPlaylistSetting) {
        //     let playlist = this.playlists.find(plist => plist._id == currentPlaylistSetting);
        //     playlist.Tracks = this.playlist;
        //     this.currentFiles.fill("");
        // }
        this.currentFiles.fill("");
    }

    @action
    public switchPlaylist(name: string): void {
        let playlist = this.playlists.find(plist => plist._id === name);
        if (playlist) {
            this.setSettingValue(CurrentPlaylistSetting, name);
            this.setSettingValue(CurrentSongIndexSetting, 0);
            this.currentFiles.fill("");
        }
    }

    @action
    public select(index: number): void {
        let selectedTrackId = this.playlist[index]._id;
        if (this.selection.indexOf(selectedTrackId) === -1)
            this.selection.push(selectedTrackId);
    }

    @action
    public selectAll(): void {
        for(let i = 0;i < this.playlist.length;i++)
            this.select(i);
    }

    @action
    public copyPaste(): void {
        if (this.clipboard.length === 0) { //copy-action
            this.clipboard = this.selection;
            this.selection = [];
        }
        else {
            let playlist = this.playlists.find(plist => plist._id === `${PlaylistIdPrefix}All`);
            if (playlist) {
                let allTracks = playlist.Tracks;
                this.clipboard.forEach(entry => this.playlist.push(allTracks.find(track => track._id === entry)));
                this.clipboard = [];
            }
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

    private trackChange(changeValue: number, newIndex = this.getValueFromSetting<number>(CurrentSongIndexSetting) + changeValue): void {
        // let newIndex = this.getValueFromSetting<number>(CurrentSongIndexSetting) + changeValue;
        this.setSettingValue(CurrentSongIndexSetting, newIndex);
        // TODO update this.state here
        let readyIndex = mod((newIndex - changeValue), WaveSurferCount);
        let playIndex = mod(newIndex, WaveSurferCount);
        let insertIndex = mod(newIndex + changeValue, WaveSurferCount);
        this.state[readyIndex] = PlayerState.Ready;
        this.state[playIndex] = PlayerState.Playing;
        this.state[insertIndex] = PlayerState.Loaded;
    }

    private getValueFromSetting<T>(name: string, defaultValue?: T): T {
        let retValue = undefined;
        if (this.settings.length>0) {
            let setting = this.settings.find(setting => setting._id === name) as Setting<T>;
            if (setting)
                retValue = setting.Value;
            else if (defaultValue !== undefined)
                retValue = defaultValue;
        }
        
        return retValue;
    }

    // @action
    private setSettingValue<T>(name: string, value: T): void {
        if (this.settings.length>0) {
            let setting = this.settings.find(setting => setting._id === name) as Setting<T>;
            if (setting)
                setting.Value = value;
            else {
                setting = {
                    _id: name,
                    Value: value,
                    DocType: DocumentType.Setting,
                    IsVisible: false
                }
                this.settings.push(setting);
            }
        }
    }

    private createPersistablePlaylist(playlist: Playlist): Playlist {
        let newPlaylist = playlist.Tracks.map(track => track);
        let persistablePlaylist: Playlist = {
            ...playlist,
            Tracks: newPlaylist
        }
        return persistablePlaylist;
    }

}