//<div id="shuffle-button" title="Shuffle Off"><i className="fa fa-random"></i></div>
                        //<div id="repeat-button" title="Repeat Off"><i className="fa fa-refresh"><span>1</span></i></div>
import React = require("react");
import ReactDOM = require("react-dom");
import Reactable = require("reactable");
import PouchDB = require("pouchdb-browser");
import ID3 = require("id3-parser");
import sha256 = require("js-sha256");
import PubSub = require("pubsub-js");

import {Track} from "../base/track";
import {Playlist} from "../base/playlist";
import {DocumentType} from "../base/enums";
import {Setting} from "../base/setting";
import {ReactPlayerDB} from "../base/typedefs";

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

export class PlaylistComponent extends React.Component<PlaylistComponentProperties, PlaylistComponentState> {

    private settings: Setting<any>[];

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
                var playlistnameSetting = new Setting("PlaylistComponent.Settings.Playlistname", "All");
                this.props.db.put(playlistnameSetting);
                this.settings.push(playlistnameSetting);
                var currentSongIndexSetting = new Setting("PlaylistComponent.Settings.CurrentSongIndex", 0);
                this.props.db.put(currentSongIndexSetting);
                this.settings.push(currentSongIndexSetting);
            }
            else 
                this.settings = response.rows.map(row => row.doc).map(doc => doc as Setting<any>);

            var playlistName = this.settings.find((value, index, obj) => value._id == "PlaylistComponent.Settings.Playlistname") as Setting<string>;
            var currentSongIndex = this.settings.find((value, index, obj) => value._id == "PlaylistComponent.Settings.CurrentSongIndex") as Setting<number>;

            this.props.db.put(allPlaylist).then((res) => {
                
            }).catch((reason) => {
                this.props.db.get(playlistName.value).then((response) => {
                    var list = response as Playlist;
                    if (list != null) {
                        this.setState({
                            currentPlaylist: list,
                            displayedColumns: this.state.displayedColumns,
                            currentSongIndex: currentSongIndex.value,
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
                                this.addTrackToPlaylist(changeArgs.id, playlistName.value);
                                break;
                            }
                            case DocumentType.Playlist: {
                                var playlist = value as Playlist;
                                this.setState({
                                    currentPlaylist: playlist,
                                    displayedColumns: this.state.displayedColumns,
                                    currentSongIndex: currentSongIndex.value,
                                    isPlaying: this.state.isPlaying
                                });
                                break;
                            }
                        }
                    });
                }
            });
            
        });
    }

    private filesSelected(evt: React.FormEvent): void {
        //ugly but necessary...
        var rawObject = evt.currentTarget as any;
        var files = rawObject.files as FileList;
        var startTime = new Date();
        for (var i=0; i<files.length; i++) {
            var file = files[i];
            this.handleFile(file);
        }  
    }

    private handleFile(file: File): void {
        var reader = new FileReader();
        reader.onload = (event) => { this.parseTag(event, file) };
        reader.readAsArrayBuffer(file);
    }

    private parseTag(ev: Event, file: File): void {
        var fileReader=event.target as FileReader;
        var data = fileReader.result as ArrayBuffer;
        var dataBuffer = new Uint8Array(data);
        ID3.parse(dataBuffer).then((tag) => {
            var hash = sha256.sha256(dataBuffer);
            this.createTrack(hash, tag, file);
        });
    }

    private createTrack(hash: string, tag: ID3.Tag, file: File): Promise<PouchDB.Core.Response> {
        var attachmentId = `blob_${hash}`;
        var track: Track = {
            _id: hash,
            _attachments: {
                attachmentId: {
                    type: file.type,
                    data: file
                },
            },
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

    public componentDidMount() : void {

    }

    public componentWillUnmount() : void {

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
                <input type="file" multiple={true} onChange={(evt) => this.filesSelected(evt)} />
                <PlaylistTable id="demo-table" sortable={this.state.displayedColumns}>
                    <PlaylistTableHeader>
                        {columns}
                    </PlaylistTableHeader>
                    {rows}
                </PlaylistTable>
            </div>
        );
    }
}
