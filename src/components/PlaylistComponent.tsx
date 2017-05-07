import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Reactable from "reactable";
import * as PouchDB from "pouchdb-browser";
import * as ID3 from "id3-parser";
import * as sha256 from "js-sha256";
import * as PubSub from "pubsub-js";

import {Track} from "../base/track";
import {Playlist} from "../base/playlist";
import {Setting} from "../base/setting";
import {PlayerMessageType, PlayerMessageTypes_Forward, PlayerMessageTypes_Backward, PlayerMessageTypes, ReactPlayerDB, CurrentSongIndexSetting, PlayerMessageTypes_Play, PlaylistMessageType, PlaylistMessageTypes, PlaylistMessage_TrackChanged, PlaylistMessage_TrackRemoved, PlaylistMessage_Changed} from "../base/typedefs";
import {DocumentType} from "../base/enums";
import {shuffle} from "../base/util";
import {TrackComponent} from "./TrackComponent";
import {ComponentWithSettings, ComponentWithSettingsProperties} from "./ComponentWithSettings";

export interface PlaylistComponentState {
    currentPlaylist: Playlist,
    displayedColumns: string[],
    currentSongIndex: number,
    isPlaying: boolean
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

const playlistNameSetting = "Settings.PlaylistComponent.Playlistname";

export class PlaylistComponent extends ComponentWithSettings<ComponentWithSettingsProperties, PlaylistComponentState> {
    
    private tokens: any[];
    private dropZone: HTMLDivElement;

    constructor(props: ComponentWithSettingsProperties, context?: any) {
        super(props, context);

        var allPlaylist: Playlist = {
            _id: "All",
            DocType: DocumentType.Playlist,
            Tracks: []
        };

        this.state = {
            currentPlaylist: allPlaylist,
            displayedColumns: ["title", "album", "artist", "actions"],
            currentSongIndex: -1,
            isPlaying: false
        }

        this.tokens = [];
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
        if (response.rows.length==0) {
            var playlistnameSetting: Setting<string> = {
                _id: playlistNameSetting,
                DocType: DocumentType.Setting,
                Value: "All",
                IsVisible: false
            };
            this.props.db.put(playlistnameSetting);
            this.settings.push(playlistnameSetting);
            var currentSongIndexSetting: Setting<number> = {
                _id: CurrentSongIndexSetting,
                DocType: DocumentType.Setting,
                Value: 0,
                IsVisible: false
            };
            this.props.db.put(currentSongIndexSetting);
            this.settings.push(currentSongIndexSetting);
        }
        else 
            this.settings = response.rows.map(row => row.doc).map(doc => doc as Setting<any>);

        var playlistName = this.settings.find((value, index, obj) => value._id == playlistNameSetting) as Setting<string>;
        var currentSongIndex = this.settings.find((value, index, obj) => value._id == CurrentSongIndexSetting) as Setting<number>;

        this.props.db.put(this.state.currentPlaylist).then((res) => {
            
        }).catch((reason) => {
            this.props.db.get(playlistName.Value).then((response) => {
                var list = response as Playlist;
                if (list != null) {
                    this.setState({
                        currentPlaylist: list,
                        displayedColumns: this.state.displayedColumns,
                        currentSongIndex: currentSongIndex.Value,
                        isPlaying: this.state.isPlaying
                    });
                }
            });
        });

        this.props.db.changes({
            include_docs: true,
            since: "now",
            live: true
        }).on("change", (args) => {
            if (args.id) {
                var changeArgs = args; //as PouchDB.Core.ChangeResponse;
                this.props.db.get(args.id).then((value) => {
                    switch(value.DocType) {
                        case DocumentType.Track: {
                            this.addTrackToPlaylist(changeArgs.id, playlistName.Value);
                            break;
                        }
                        case DocumentType.Playlist: {
                            var playlist = value as Playlist;
                            this.setState({
                                currentPlaylist: playlist,
                                displayedColumns: this.state.displayedColumns,
                                currentSongIndex: currentSongIndex.Value,
                                isPlaying: this.state.isPlaying
                            });
                            break;
                        }
                        case DocumentType.Setting: {
                            if (value._id == CurrentSongIndexSetting) {
                                var currentSongIndexSetting = value as Setting<number>;
                                currentSongIndex.Value = currentSongIndexSetting.Value;
                                this.setState({
                                    currentPlaylist: this.state.currentPlaylist,
                                    displayedColumns: this.state.displayedColumns,
                                    currentSongIndex: currentSongIndex.Value,
                                    isPlaying: this.state.isPlaying
                                });
                                break;
                            }
                        }
                    }
                });
            }
        });
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
                return this.props.db.put(resultingTrack).then((response)=>{
                    if (response.ok) {
                        new Notification('Playlist changed', {
                            body: `File '${file.name}' successfully added to the database...`
                        });
                    }
                });
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

    private createTrack(hash: string, tag: any, file: File): Promise<PouchDB.Core.Response> {
        var attachmentId = `blob_${hash}`;
        var track: Track = {
            _id: hash,
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
        return this.props.db.put(track);
    }

    private addTrackToPlaylist(trackId: string, playlistId: string): void {
        this.props.db.get(playlistId).then((response) => {
            var playlist = response as Playlist;
            if (playlist!=null) {
                this.props.db.get(trackId).then((response) => {
                    var track = response as Track;
                    if (track!=null) {
                        playlist.Tracks.push(track);
                        this.props.db.put(playlist).catch((reason) => {
                            this.addTrackToPlaylist(trackId, playlistId);
                        });
                    }
                });
            }
        });
    }

    private updateComponentState(currentSongIndexSetting: Setting<number>, newValue: number, playlist: Playlist = this.state.currentPlaylist): void {
        this.props.db.get(currentSongIndexSetting._id).then(doc => {
            var currentSongIndexSettingDoc = doc as Setting<number>;
            currentSongIndexSettingDoc.Value = newValue;
            this.props.db.put(currentSongIndexSettingDoc).then(response => {
                currentSongIndexSetting.Value = currentSongIndexSettingDoc.Value;
                this.setState({
                    currentPlaylist: playlist,
                    displayedColumns: this.state.displayedColumns,
                    currentSongIndex: currentSongIndexSettingDoc.Value,
                    isPlaying: true
                });
            }, reason => {
                console.log("error: " + reason);
            });
        })
    }

    private playlistEvent(event: PlaylistMessageTypes, trackIdx: number): void {
        switch(event) {
            case PlaylistMessage_TrackRemoved:
                var currentSongIndexSetting = this.settings.find((setting, index, arr) => setting._id == CurrentSongIndexSetting) as Setting<number>;
                if (currentSongIndexSetting != null) {
                    var currentSongIndex = currentSongIndexSetting.Value;
                    var loadedTracks = [currentSongIndex - 1, currentSongIndex, currentSongIndex + 1];
                    if (loadedTracks.findIndex(t => t == trackIdx) == -1) {
                        var tracks = this.state.currentPlaylist.Tracks.filter((track, idx, arr) => idx != trackIdx);
                        this.state.currentPlaylist.Tracks = tracks;
                        if (currentSongIndex > trackIdx)
                            this.updateComponentState(currentSongIndexSetting, currentSongIndex - 1);
                        else if (currentSongIndex < trackIdx)
                            this.updateComponentState(currentSongIndexSetting, currentSongIndex);
                        this.props.db.get(this.state.currentPlaylist._id).then((response) => {
                            var list = response as Playlist;
                            list.Tracks = tracks;
                            this.props.db.put(list).then(res => {
                                PubSub.publish(PlaylistMessage_Changed, list._id);
                            });
                        });
                    }
                }
                break;
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
        var currentSongIndex = this.settings.find((value, index, obj) => value._id == CurrentSongIndexSetting) as Setting<number>;
        var currentValue = currentSongIndex.Value;
        switch(event) {
            case PlayerMessageTypes_Forward:
                currentValue += 1;
                break;
            case PlayerMessageTypes_Backward:
                currentValue -= 1;
                break;
        }
        this.updateComponentState(currentSongIndex, currentValue);
    }

    private dropZoneDrop(event: React.DragEvent<HTMLDivElement>): void {
        event.stopPropagation();
	    event.preventDefault();
        var files = event.dataTransfer.files;
        for (var i=0;i<files.length;i++) {
            var file = files.item(i);
            this.handleFile(file);
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
        shuffle(this.state.currentPlaylist.Tracks);
        this.props.db.put(this.state.currentPlaylist);
    }

    public componentDidMount() : void {
        this.tokens.push(PubSub.subscribe(PlayerMessageType, (event: PlayerMessageTypes, data: any) => { this.playerEvent(event, data); }));
        this.tokens.push(PubSub.subscribe(PlaylistMessageType, (event: PlaylistMessageTypes, trackIdx: number) => { this.playlistEvent(event, trackIdx); }));
        window.document.addEventListener("dragover", (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.dropZone.className = "";
        })
    }

    public componentWillUnmount() : void {
        this.tokens.forEach(token => PubSub.unsubscribe(token));
        window.document.removeEventListener("dragover");
    }

    public render(): JSX.Element {
        var columns: JSX.Element[] = [];
        for(var colName of this.state.displayedColumns) {
            columns.push(
                <PlaylistTableTh column={colName} key={colName}>
                    <strong className="name-header">{colName}</strong>
                </PlaylistTableTh>
            );
        }
        var rows: JSX.Element[] = [];
        var i = 0;
        for(var track of this.state.currentPlaylist.Tracks) {
            var tds: JSX.Element[] = [];
            this.state.displayedColumns.forEach(col => tds.push(
                <PlaylistTableTd column={col}>
                    <TrackComponent db={this.props.db} trackIdx={i} value={(col != "actions") ? track[col] : col}/>
                </PlaylistTableTd>
            ));
            if (this.state.isPlaying && (i==this.state.currentSongIndex)) {
                rows.push(
                    <PlaylistRow className="reactable-current-song">
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
        return (
            <div>
                <div id="drop-zone" className="hidden" ref={r => this.dropZone = r} onDragLeave={evt => this.dropZoneDragLeave(evt)} onDragOver={evt => this.dropZoneDragOver(evt)} onDrop={evt => this.dropZoneDrop(evt)}>Drag &amp; Drop Files Here</div>
                <PlaylistTable id="demo-table">
                    <PlaylistTableHeader>
                        {columns}
                    </PlaylistTableHeader>
                    {rows}
                    <PlaylistTableTfoot>
                        <tr className="reactable-footer">
                            <td><div title="Create new playlist..."><i className="fa fa-file"/></div></td>
                            <td><div title="Load persisted playlist..."><i className="fa fa-folder-open"/></div></td>
                            <td><div title="Shuffle" onClick={(evt) => this.shuffle()}><i className="fa fa-random"/></div></td>
                        </tr>
                    </PlaylistTableTfoot>
                </PlaylistTable>
            </div>
        );
    }
}
