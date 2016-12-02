//<div id="shuffle-button" title="Shuffle Off"><i className="fa fa-random"></i></div>
                        //<div id="repeat-button" title="Repeat Off"><i className="fa fa-refresh"><span>1</span></i></div>
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
import {PlayerMessageType, PlayerMessageTypes_Forward, PlayerMessageTypes_Backward, PlayerMessageTypes, ReactPlayerDB, CurrentSongIndexSetting, PlayerMessageTypes_Play} from "../base/typedefs";
import {DocumentType} from "../base/enums";
import {shuffle} from "../base/util";

export interface PlaylistComponentProperties {
    db : ReactPlayerDB;
}

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

type PlaylistTableTfoot = new () => Reactable.Tfoot;
const PlaylistTableTfoot = Reactable.Tfoot as PlaylistTableTfoot;

export class PlaylistComponent extends React.Component<PlaylistComponentProperties, PlaylistComponentState> {

    private settings: Setting<any>[];
    private tokens: any[];
    private dropZone: HTMLDivElement;

    constructor(props: PlaylistComponentProperties, context?: any) {
        super(props, context);
        //var playlist = ["", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/01- Intro.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/02- Her Voice Resides.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/03- 4 Words (To Choke Upon).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/04- Tears Don`t Fall.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/05- Suffocating Under Words Of Sorrow (What Can I Do).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/06- Hit The Floor.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/07- All These Things I Hate (Revolve Around Me).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/08- Hand Of Blood.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/09- Room 409.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/10- The Poison.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/11- 10 Years Today.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/12- Cries In Vain.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/13- Spit You Out.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/14- The End.mp3", ""];
        //this.parse(playlist[0]).then((tag)=>{ return tag; });
        //this.db = new PouchDB("ReactPlayerDB");

        var allPlaylist: Playlist = {
            _id: "All",
            DocType: DocumentType.Playlist,
            Tracks: []
        };
        this.state = {
            currentPlaylist: allPlaylist,
            displayedColumns: ["title", "album", "artist"],
            currentSongIndex: -1,
            isPlaying: false
        }

        var settingsSelectOptions: PouchDB.Core.AllDocsWithinRangeOptions = {
            include_docs: true,
            startkey: "PlaylistComponent.Settings.",
            endkey: "PlaylistComponent.Settings.\uffff"
        } 
        this.props.db.allDocs(settingsSelectOptions).then(response => {
            this.settings = [];
            if (response.rows.length==0) {
                var playlistnameSetting: Setting<string> = {
                    _id: "PlaylistComponent.Settings.Playlistname",
                    DocType: DocumentType.Setting,
                    Value: "All"
                };
                this.props.db.put(playlistnameSetting);
                this.settings.push(playlistnameSetting);
                var currentSongIndexSetting: Setting<number> = {
                    _id: CurrentSongIndexSetting,
                    DocType: DocumentType.Setting,
                    Value: 0
                };
                this.props.db.put(currentSongIndexSetting);
                this.settings.push(currentSongIndexSetting);
            }
            else 
                this.settings = response.rows.map(row => row.doc).map(doc => doc as Setting<any>);

            var playlistName = this.settings.find((value, index, obj) => value._id == "PlaylistComponent.Settings.Playlistname") as Setting<string>;
            var currentSongIndex = this.settings.find((value, index, obj) => value._id == CurrentSongIndexSetting) as Setting<number>;

            this.props.db.put(allPlaylist).then((res) => {
                
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
                    var changeArgs = args as PouchDB.Core.ChangeResponse;
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
                        }
                    });
                }
            });
            
        });
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

    private handleFile(file: File): void {
        var promises = [this.createHash(file), this.createTag(file)];
        Promise.all(promises).then((tracks) => {
            if (tracks.length==2) {
                var track1 = tracks[0];
                var track2 = tracks[1];
                // merge the two created track-objects
                var resultingTrack: Track = {
                    _id: `track_${track1._id + track2._id}`,
                    _attachments: (track1._attachments != null) ? track1._attachments : track2._attachments,
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
                        console.log(`File '${file.name}' successfully added to the database...`); 
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
                    _attachments: {
                        attachmentId: {
                            type: file.type,
                            data: file
                        },
                    },
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
                        _attachments: null,
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
            _attachments: {},
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

    private playerEvent(event: PlayerMessageTypes, data: any): void {
        switch(event) {
            case PlayerMessageTypes_Play:
                break;
            case PlayerMessageTypes_Forward:
                var currentSongIndex = this.settings.find((value, index, obj) => value._id == CurrentSongIndexSetting) as Setting<number>;
                currentSongIndex.Value = currentSongIndex.Value + 1;
                this.props.db.get(currentSongIndex._id).then(doc => {
                    var blub = doc as Setting<number>;
                    blub.Value = currentSongIndex.Value;
                    this.props.db.put(blub).then(response => {
                        this.setState({
                            currentPlaylist: this.state.currentPlaylist,
                            displayedColumns: this.state.displayedColumns,
                            currentSongIndex: currentSongIndex.Value,
                            isPlaying: true
                        });
                    }, reason => {
                        console.log("error: " + reason);
                    });
                })
                
                break;
            case PlayerMessageTypes_Backward:
                var currentSongIndex = this.settings.find((value, index, obj) => value._id == CurrentSongIndexSetting) as Setting<number>;
                currentSongIndex.Value = currentSongIndex.Value - 1;
                this.props.db.put(currentSongIndex).then(response => {
                    this.setState({
                        currentPlaylist: this.state.currentPlaylist,
                        displayedColumns: this.state.displayedColumns,
                        currentSongIndex: currentSongIndex.Value,
                        isPlaying: true
                    });
                });
                break;
        }
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
            columns.push(<PlaylistTableTh column={colName} key={colName}>
                <strong className="name-header">{colName}</strong>
            </PlaylistTableTh>);
        }
        var rows: JSX.Element[] = [];
        var i = 0;
        for(var track of this.state.currentPlaylist.Tracks) {
            if (this.state.isPlaying && (i==this.state.currentSongIndex)) {
                rows.push(<PlaylistRow data={track} className="reactable-current-song" />);
            }
            else {
                rows.push(<PlaylistRow data={track} />);
            }
            
            i++;
        }
        return (
            <div>
                <div id="drop-zone" className="hidden" ref={r => this.dropZone = r} onDragLeave={evt => this.dropZoneDragLeave(evt)} onDragOver={evt => this.dropZoneDragOver(evt)} onDrop={evt => this.dropZoneDrop(evt)}>Drag &amp; Drop Files Here</div>
                <PlaylistTable id="demo-table" sortable={this.state.displayedColumns}>
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
