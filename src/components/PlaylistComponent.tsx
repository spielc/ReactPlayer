import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Reactable from "reactable";
import * as PouchDB from "pouchdb-browser";
import * as ID3 from "id3-parser";
import * as sha256 from "js-sha256";

import {Track} from "../base/track";
import {Playlist} from "../base/playlist";
import {Setting} from "../base/setting";
import { PlayerMessageType, PlayerMessageTypes_Forward, PlayerMessageTypes_Backward, PlayerMessageTypes, ReactPlayerDB, CurrentSongIndexSetting, PlaybackStateSetting, LibraryModeEnabledSetting, PlayerMessageTypes_Play, PlaylistMessageType, PlaylistMessageTypes, PlaylistMessage_TrackChanged, PlaylistMessage_TrackRemoved, PlaylistMessage_Changed, PlaylistIdPrefix, CurrentPlaylistSetting } from "../base/typedefs";
import {DocumentType, PlayerState} from "../base/enums";
import {shuffle} from "../base/util";
import {TrackComponent} from "./TrackComponent";
import {ComponentWithSettings, ComponentWithSettingsProperties} from "./ComponentWithSettings";
import { AppState } from "../base/appstate";
import { observer } from "mobx-react";

// export interface PlaylistComponentState {
//     currentPlaylist: Playlist,
//     displayedColumns: string[],
//     currentSongIndex: number,
//     isPlaying: boolean,
//     selectedIndizes: number[],
//     libraryModeEnabled: boolean,
//     playlists: string[]
// }

interface PlaylistComponentProperties {
    state: AppState
}

type PlaylistTable = new () => Reactable.Table<Track>;
const PlaylistTable = Reactable.Table as PlaylistTable;

type PlaylistTableHeader = new () => Reactable.Thead;
const PlaylistTableHeader = Reactable.Thead as PlaylistTableHeader;

type PlaylistTableTh = new () => Reactable.Th;
const PlaylistTableTh = Reactable.Th as PlaylistTableTh;

type PlaylistRow = new () => Reactable.Tr<Track>;
const PlaylistRow = Reactable.Tr as PlaylistRow;

type PlaylistTableTd = new () => Reactable.Td;
const PlaylistTableTd = Reactable.Td as PlaylistTableTd;

type PlaylistTableTfoot = new () => Reactable.Tfoot;
const PlaylistTableTfoot = Reactable.Tfoot as PlaylistTableTfoot;

@observer
export class PlaylistComponent extends React.Component<PlaylistComponentProperties, {}> {//ComponentWithSettings<ComponentWithSettingsProperties, PlaylistComponentState> {
    
    private tokens: any[];
    private dropZone: HTMLDivElement;
    private playlistName: HTMLInputElement;
    private playlistSelector: HTMLSelectElement;
    private displayedColumns: string[];

    // constructor(props: ComponentWithSettingsProperties, context?: any) {
    constructor(props: PlaylistComponentProperties, context?: any) {
        super(props, context);

        this.displayedColumns = ["title", "album", "artist", "actions"];
        // var allPlaylist: Playlist = {
        //     _id: `${PlaylistIdPrefix}All`,
        //     DocType: DocumentType.Playlist,
        //     Tracks: []
        // };

        // this.state = {
        //     currentPlaylist: allPlaylist,
        //     displayedColumns: ["title", "album", "artist", "actions"],
        //     currentSongIndex: -1,
        //     isPlaying: false,
        //     selectedIndizes: [],
        //     libraryModeEnabled: false,
        //     playlists: []
        // }

        // this.tokens = [];
    }

    // private filesSelected(evt: React.FormEvent): void {
    //     //ugly but necessary... 
    //     var rawObject = evt.currentTarget as any;
    //     var files = rawObject.files as FileList;
        
    //     for (var i=0; i<files.length; i++) {
    //         var file = files[i];
    //         this.handleFile(file);
    //     } 
        
    // }

    protected loadSettings(response: PouchDB.Core.AllDocsResponse<Track | Playlist | Setting<any>>) {
        // if (response.rows.length==0) {
        //     let playlistnameSetting: Setting<string> = {
        //         _id: CurrentPlaylistSetting,
        //         DocType: DocumentType.Setting,
        //         Value: `${PlaylistIdPrefix}All`,
        //         IsVisible: false
        //     };
        //     this.props.db.put(playlistnameSetting);
        //     this.settings.push(playlistnameSetting);
        //     let currentSongIndexSetting: Setting<number> = {
        //         _id: CurrentSongIndexSetting,
        //         DocType: DocumentType.Setting,
        //         Value: 0,
        //         IsVisible: false
        //     };
        //     this.props.db.put(currentSongIndexSetting);
        //     this.settings.push(currentSongIndexSetting);

        //     let libraryModeEnabledSetting: Setting<boolean> = {
        //         _id: LibraryModeEnabledSetting,
        //         DocType: DocumentType.Setting,
        //         Value: false,
        //         IsVisible: false
        //     }

        //     this.props.db.put(libraryModeEnabledSetting);
        //     this.settings.push(libraryModeEnabledSetting);
        // }
        // else 
        //     this.settings = response.rows.map(row => row.doc).map(doc => doc as Setting<any>);

        // var playlistName = this.settings.find((value, index, obj) => value._id == CurrentPlaylistSetting) as Setting<string>;
        // var currentSongIndex = this.settings.find((value, index, obj) => value._id == CurrentSongIndexSetting) as Setting<number>;

        // this.props.db.put(this.state.currentPlaylist).then((res) => {
            
        // }).catch((reason) => {
        //     let settingsSelectOptions: PouchDB.Core.AllDocsWithinRangeOptions = {
        //         include_docs: false,
        //         startkey: PlaylistIdPrefix,
        //         endkey: `${PlaylistIdPrefix}\uffff`
        //     }
        //     this.props.db.allDocs(settingsSelectOptions).then(response => {
        //         let playlists = response.rows.map(pl => pl.id);
        //         this.props.db.get(playlistName.Value).then((response) => {
        //             var list = response as Playlist;
        //             if (list != null) {
        //                 this.setState({
        //                     currentPlaylist: list,
        //                     displayedColumns: this.state.displayedColumns,
        //                     currentSongIndex: currentSongIndex.Value,
        //                     isPlaying: this.state.isPlaying,
        //                     playlists: playlists
        //                 });
        //             }
        //         });
        //     });
        // });

        // this.props.db.changes({
        //     include_docs: true,
        //     since: "now",
        //     live: true
        // }).on("change", (args) => {
        //     if (args.id) {
        //         var changeArgs = args; //as PouchDB.Core.ChangeResponse;
        //         this.props.db.get(args.id).then((value) => {
        //             switch(value.DocType) {
        //                 case DocumentType.Track: {
        //                     this.addTrackToPlaylist(changeArgs.id, playlistName.Value);
        //                     break;
        //                 }
        //                 case DocumentType.Playlist: {
        //                     let playlist = value as Playlist;
        //                     if (this.state.playlists.indexOf(playlist._id) == -1)
        //                         this.state.playlists.push(playlist._id);
        //                     if (playlist._id == this.state.currentPlaylist._id) {
        //                         this.setState({
        //                             currentPlaylist: playlist,
        //                             currentSongIndex: currentSongIndex.Value
        //                         });
        //                     }
        //                     break;
        //                 }
        //                 case DocumentType.Setting: {
        //                     switch(value._id) {
        //                         case CurrentSongIndexSetting:
        //                             var currentSongIndexSetting = value as Setting<number>;
        //                             currentSongIndex.Value = currentSongIndexSetting.Value;
        //                             this.setState({
        //                                 currentPlaylist: this.state.currentPlaylist,
        //                                 displayedColumns: this.state.displayedColumns,
        //                                 currentSongIndex: currentSongIndex.Value,
        //                                 isPlaying: this.state.isPlaying
        //                             });
        //                             break;
        //                         case PlaybackStateSetting:
        //                             let playbackStateSetting = value as Setting<PlayerState>;
        //                             this.setState({
        //                                 isPlaying: playbackStateSetting.Value == PlayerState.Playing
        //                             });
        //                             break;
        //                         case CurrentPlaylistSetting:
        //                             let currentPlaylistSetting = value as Setting<string>;
        //                             this.props.db.get(currentPlaylistSetting.Value).then(response => {
        //                                 var playlist = response as Playlist;
        //                                 if (playlist) {
        //                                     this.setState({
        //                                         currentPlaylist: playlist
        //                                     });
        //                                 }
                                        
        //                             });
        //                             break;
        //                         case LibraryModeEnabledSetting:
        //                             let libraryModeEnabledSetting = value as Setting<boolean>;
        //                             this.setState({
        //                                 libraryModeEnabled: libraryModeEnabledSetting.Value
        //                             });
        //                             break;
        //                     }
        //                     break;
        //                 }
        //             }
        //         });
        //     }
        // });
    }

    private handleFile(file: File): void {
        var promises = [this.createHash(file), this.createTag(file)];
        Promise.all(promises).then((tracks) => {
            if (tracks.length==2) {
                var track1 = tracks[0];
                var track2 = tracks[1];
                // merge the two created track-objects
                var resultingTrack: Track = {
                    _id: `track_${track1._id + track2._id}`,
                    path: track1.path + track2.path,
                    DocType: DocumentType.Track,
                    title: track1.title + track2.title,
                    artist: track1.artist + track2.artist,
                    album: track1.album + track2.album,
                    year: track1.year + track2.year,
                    image: (track1.image != null) ? track1.image : track2.image,
                    lyrics: track1.lyrics + track2.lyrics,
                    comment: track1.comment + track2.comment,
                    track: track1.track + track2.track,
                    genre: track1.genre + track2.genre,
                    version: (track1.version != null) ? track1.version : track2.version
                }
                // TODO fix that..
                // return this.props.db.put(resultingTrack).then((response)=>{
                //     if (response.ok) {
                //         new Notification('Playlist changed', {
                //             body: `File '${file.name}' successfully added to the database...`
                //         });
                //     }
                // });
            }
        });
    }

    private createHash(file: File): Promise<Track> {
        var promise = new Promise<Track>((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = (event) => { 
                //this.parseTag(event, file)
                var fileReader=event.target as FileReader;
                var data = fileReader.result as ArrayBuffer;
                var dataBuffer = new Uint8Array(data);
                var hash = sha256.sha256(dataBuffer);
                var track: Track = {
                    _id: hash,
                    path: file.path,
                    DocType: DocumentType.Track,
                    title: "",
                    artist: "",
                    album: "",
                    year: "",
                    image: null,
                    lyrics: "",
                    comment: "",
                    track: 0,
                    genre: "",
                    version: null
                };
                resolve(track);
            };
            reader.readAsArrayBuffer(file);
        });
        return promise;
    }

    private createTag(file: File): Promise<Track> {
        var promise = new Promise<Track>((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = (event) => {
                var fileReader=event.target as FileReader;
                var data = fileReader.result as ArrayBuffer;
                var dataBuffer = new Uint8Array(data);
                ID3.parse(dataBuffer).then((tag) => {
                    var track: Track = {
                        _id: "",
                        path: "",
                        DocType: DocumentType.Track,
                        album: tag.album,
                        artist: tag.artist,
                        title: tag.title,
                        year: tag.year,
                        image: tag.image,
                        lyrics: tag.lyrics,
                        comment: tag.comment,
                        track: tag.track,
                        genre: tag.genre,
                        version: tag.version
                    };
                    resolve(track);
                });
            };
            reader.readAsArrayBuffer(file);
        });
        return promise;
    }

    // private createTrack(hash: string, tag: any, file: File): Promise<PouchDB.Core.Response> {
    //     var attachmentId = `blob_${hash}`;
    //     var track: Track = {
    //         _id: hash,
    //         path: "",
    //         DocType: DocumentType.Track,
    //         album: tag.album,
    //         artist: tag.artist,
    //         title: tag.title,
    //         year: tag.year,
    //         image: tag.image,
    //         lyrics: tag.lyrics,
    //         comment: tag.comment,
    //         track: tag.track,
    //         genre: tag.genre,
    //         version: tag.version
    //     };
    //     return this.props.db.put(track);
    // }

    private addTrackToPlaylist(trackId: string, playlistId: string): void {
        // this.props.db.get(playlistId).then((response) => {
        //     var playlist = response as Playlist;
        //     if (playlist!=null) {
        //         this.props.db.get(trackId).then((response) => {
        //             var track = response as Track;
        //             if (track!=null) {
        //                 playlist.Tracks.push(track);
        //                 this.props.db.put(playlist).catch((reason) => {
        //                     this.addTrackToPlaylist(trackId, playlistId);
        //                 });
        //             }
        //         });
        //     }
        // });
    }

    // private updateComponentState(currentSongIndexSetting: Setting<number>, newValue: number, playlist: Playlist = this.state.currentPlaylist): void {
    //     // this.props.db.get(currentSongIndexSetting._id).then(doc => {
    //     //     var currentSongIndexSettingDoc = doc as Setting<number>;
    //     //     currentSongIndexSettingDoc.Value = newValue;
    //     //     this.props.db.put(currentSongIndexSettingDoc).then(response => {
    //     //         currentSongIndexSetting.Value = currentSongIndexSettingDoc.Value;
    //     //         this.setState({
    //     //             currentPlaylist: playlist,
    //     //             displayedColumns: this.state.displayedColumns,
    //     //             currentSongIndex: currentSongIndexSettingDoc.Value,
    //     //             isPlaying: true
    //     //         });
    //     //     }, reason => {
    //     //         console.log("error: " + reason);
    //     //     });
    //     // })
    // }

    private playlistEvent(event: PlaylistMessageTypes, trackIdx: number): void {
        switch(event) {
            // case PlaylistMessage_TrackRemoved:
            //     var currentSongIndexSetting = this.settings.find((setting, index, arr) => setting._id == CurrentSongIndexSetting) as Setting<number>;
            //     if (currentSongIndexSetting != null) {
            //         var currentSongIndex = currentSongIndexSetting.Value;
            //         var loadedTracks = [currentSongIndex - 1, currentSongIndex, currentSongIndex + 1];
            //         if (loadedTracks.findIndex(t => t == trackIdx) == -1) {
            //             var tracks = this.state.currentPlaylist.Tracks.filter((track, idx, arr) => idx != trackIdx);
            //             this.state.currentPlaylist.Tracks = tracks;
            //             if (currentSongIndex > trackIdx)
            //                 this.updateComponentState(currentSongIndexSetting, currentSongIndex - 1);
            //             else if (currentSongIndex < trackIdx)
            //                 this.updateComponentState(currentSongIndexSetting, currentSongIndex);
            //             this.props.db.get(this.state.currentPlaylist._id).then((response) => {
            //                 var list = response as Playlist;
            //                 list.Tracks = tracks;
            //                 this.props.db.put(list).then(res => {
            //                     //PubSub.publish(PlaylistMessage_Changed, list._id);
            //                 });
            //             });
            //         }
            //     }
            //     break;
                // TODO this has to be done somehow else...
            // case PlaylistMessage_ToggleTrackSelected:
            //     let action: () => number[];
            //     if (this.state.selectedIndizes.find(selectedIndex => selectedIndex === trackIdx) !== undefined) {
            //         // track already selected
            //         action = () => this.state.selectedIndizes.filter(selectedIndex => selectedIndex !== trackIdx);
            //     }
            //     else {
            //         // track not already selected
            //         action = () => this.state.selectedIndizes.concat([trackIdx]);
            //     }
            //     this.setState({
            //         selectedIndizes: action()
            //     });
            //     break;
            // case PlaylistMessage_ToggleLibraryMode:
            //     this.props.db.get(`${PlaylistIdPrefix}All`).then((response) => {
            //         var list = response as Playlist;
            //         if (list != null) {
            //             this.setState({
            //                 currentPlaylist: list,
            //                 libraryModeEnabled: !this.state.libraryModeEnabled
            //             });
            //         }
            //     });
                
            //     break;
            // case PlaylistMessage_TrackChanged:
            //     var newIndex = this.state.currentPlaylist.Tracks.indexOf(data);
            //     var currentSongIndexSetting = this.settings.find((setting, index, arr) => setting._id == CurrentSongIndexSetting) as Setting<number>;
            //     if (currentSongIndexSetting != null) {
            //         this.updateComponentState(currentSongIndexSetting, newIndex);
            //     //     PubSub.publish(PlaylistMessage_TrackChanged, {});
            //     }
            //     break;
        }
    }

    private playerEvent(event: PlayerMessageTypes, data: any): void {
        // var currentSongIndex = this.settings.find((value, index, obj) => value._id == CurrentSongIndexSetting) as Setting<number>;
        // var currentValue = currentSongIndex.Value;
        // switch(event) {
        //     case PlayerMessageTypes_Forward:
        //         currentValue += 1;
        //         break;
        //     case PlayerMessageTypes_Backward:
        //         currentValue -= 1;
        //         break;
        // }
        // this.updateComponentState(currentSongIndex, currentValue);
    }

    private dropZoneDrop(event: React.DragEvent<HTMLDivElement>): void {
        event.stopPropagation();
	    event.preventDefault();
        var files = event.dataTransfer.files;
        for (var i=0;i<files.length;i++) {
            var file = files.item(i);
            this.props.state.addTrack(file);
            // this.handleFile(file);
            // var reader = new FileReader();
            // reader.onload = (event) => {
            //     var fileReader=event.target as FileReader;
            //     var data = fileReader.result as ArrayBuffer;
            //     var dataBuffer = new Uint8Array(data);
            //     this.props.state.addTrack(file.path, dataBuffer);
            // };
            // reader.readAsArrayBuffer(file);
            
            //console.log(`File '${file.name}' of type '${file.type}' dropped!`);
        }
        this.dropZone.className = "hidden";
    }

    private dropZoneDragOver(event: React.DragEvent<HTMLDivElement>): void {
        event.stopPropagation();
	    event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    }

    private dropZoneDragLeave(event: React.DragEvent<HTMLDivElement>): void {
        event.stopPropagation();
	    event.preventDefault();
	    this.dropZone.className = "hidden";
    }

    private shuffle(): void {
        // shuffle(this.state.currentPlaylist.Tracks);
        // this.props.db.put(this.state.currentPlaylist);
    }

    private createPlaylist(): void {
        // let playlistName = PlaylistIdPrefix + this.playlistName.value;
        // if (playlistName != "") {
        //     this.props.db.get(playlistName).catch(reason => {
        //         // if we get here a playlist with the given name does not exist => create a new playlist in the db
        //         let playlist: Playlist = {
        //             _id: playlistName,
        //             Tracks: [],
        //             DocType: DocumentType.Playlist
        //         }
        //         this.props.db.put(playlist).then(response => {
        //             new Notification('SUCCESS!', {
        //                 body: `Playlist "${this.playlistName.value}" created successfully!`
        //             });
        //         });
        //     });
        // }
    }

    private switchPlaylist(): void {
        // let selectedPlaylist = this.playlistSelector.value;
        // if (this.state.currentPlaylist._id != selectedPlaylist) {
        //     this.props.db.get(selectedPlaylist).then(response => {
        //         let playlist = response as Playlist;
        //         if (playlist) {
        //             //PubSub.publish(PlaylistMessage_Switched, this.playlistSelector.value);
        //             this.props.db.get(CurrentPlaylistSetting).then(response => {
        //                 let setting = response as Setting<string>;
        //                 if (setting) {
        //                     setting.Value = selectedPlaylist;
        //                     this.props.db.put(setting).then(response => {
        //                         this.props.db.get(CurrentSongIndexSetting).then(response => {
        //                             var currentSongIndexSetting = response as Setting<number>;
        //                             currentSongIndexSetting.Value = 0;
        //                             this.props.db.put(currentSongIndexSetting).then(response => {
        //                                 // this.setState({
        //                                 //     currentPlaylist: playlist,
        //                                 //     currentSongIndex: 0
        //                                 // });
        //                             });;
        //                         });
        //                     });
        //                 }
        //             });
        //         }
        //     });
        // }
        // let playlistName = PlaylistIdPrefix + this.playlistName.value;
        // if (playlistName != "") {
        //     this.props.db.get(playlistName).catch(reason => {
        //         // if we get here a playlist with the given name does not exist => create a new playlist in the db
        //         let playlist: Playlist = {
        //             _id: playlistName,
        //             Tracks: [],
        //             DocType: DocumentType.Playlist
        //         }
        //         this.props.db.put(playlist).then(response => {
        //             new Notification('SUCCESS!', {
        //                 body: `Playlist "${this.playlistName.value}" created successfully!`
        //             });
        //         });
        //     });
        // }
    }

    public componentDidMount() : void {
        window.document.addEventListener("dragover", (event) => {
            event.stopPropagation();
            event.preventDefault();
            if (this.dropZone)
                this.dropZone.className = "";
        }, false);

        window.document.addEventListener("drop", (event) => {
            event.stopPropagation();
            event.preventDefault();
            //this.dropZone.className = "";
        }, false);
    }

    public componentWillUnmount() : void {
        // this.tokens.forEach(token => PubSub.unsubscribe(token));
        window.document.removeEventListener("dragover");
    }

    public render(): JSX.Element {
        // if (this.props.state.playlist.length === 0){
        // // if (this.props.state.playlist === undefined || this.props.state.playlist.Tracks.length === 0){
        //     return <div/>
        // }
        let playlists = this.props.state.playlistNames.map(playlist => <option value={playlist}>{playlist.replace(PlaylistIdPrefix, "")}</option>);
        /*var playlists = [];

        this.props.db.allDocs(settingsSelectOptions).then(response => {
            playlists = response.rows.map(row => (<option value={row.id}>{row.id.replace(PlaylistIdPrefix, "")}</option>));
            let i = 0;
        });*/
        let dropZone = <div />;
        if (this.props.state.libraryModeEnabled) {
            dropZone = <div hidden={false} id="drop-zone" className="hidden" ref={r => this.dropZone = r} onDragLeave={evt => this.dropZoneDragLeave(evt)} onDragOver={evt => this.dropZoneDragOver(evt)} onDrop={evt => this.dropZoneDrop(evt)}>Drag &amp; Drop Files Here</div>;
        }

        let columns: JSX.Element[] = [];
        for(var colName of this.displayedColumns) {
            columns.push(
                <PlaylistTableTh column={colName} key={colName}>
                    <strong className="name-header">{colName}</strong>
                </PlaylistTableTh>
            );
        }
        var rows: JSX.Element[] = [];
        var i = 0;
        // for(var track of this.props.state.playlist.Tracks) {
        for (let track of this.props.state.playlist) {
            var tds: JSX.Element[] = [];
            this.displayedColumns.forEach(col => tds.push(
                <PlaylistTableTd column={col}>
                    <TrackComponent state={this.props.state} trackIdx={i} value={(col != "actions") ? track[col] : col} libraryModeEnabled={false} />
                </PlaylistTableTd>
            ));
            // if (!this.state.libraryModeEnabled && this.state.isPlaying && (i==this.state.currentSongIndex)) {
            if((this.props.state.isPlaying) && (i==this.props.state.currentIndex)) {
                rows.push(
                    <PlaylistRow className="reactable-current-song">
                        {tds}
                    </PlaylistRow>
                );
            }
            else if (this.props.state.selection.indexOf(track._id) !== -1) {
                rows.push(
                    <PlaylistRow className="reactable-selected">
                        {tds}
                    </PlaylistRow>
                );
            }
            else {
                rows.push(
                    <PlaylistRow>
                        {tds}
                    </PlaylistRow>
                );
            }
            
            i++;
        }
        // 
        return (
            <div>
                {dropZone}
                <PlaylistTable id="demo-table">
                    <PlaylistTableHeader>
                        {columns}
                    </PlaylistTableHeader>
                    {rows}
                    <PlaylistTableTfoot>
                        <tr className="reactable-footer">
                            <td><div title="Load persisted playlist..."><select ref={r => this.playlistSelector = r}>{playlists}</select>&nbsp;<i className="fa fa-folder-open" onClick={evt => this.props.state.switchPlaylist(this.playlistSelector.value)}/></div></td>
                            <td><div hidden={false} title="Create new playlist..."><input type="text" ref={r => this.playlistName = r}/>&nbsp;<i className="fa fa-file" onClick={evt => this.props.state.addPlaylist(this.playlistName.value)}/></div></td>
                            <td><div hidden={false} title="Shuffle" onClick={(evt) => this.props.state.shufflePlaylist()}><i className="fa fa-random"/></div></td>
                            <td><div><i className="fa fa-clipboard fa-lg" onClick={evt => this.props.state.copyPaste()}/><i className="fa fa-bookmark-o fa-lg" onClick={evt => this.props.state.selectAll()}/><i className="fa fa-trash fa-lg" onClick={evt => this.props.state.clearPlaylist()}/></div></td>
                        </tr>
                    </PlaylistTableTfoot>
                </PlaylistTable>
            </div>
        );
    }
}
