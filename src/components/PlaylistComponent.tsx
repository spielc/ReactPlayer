//<div id="shuffle-button" title="Shuffle Off"><i className="fa fa-random"></i></div>
                        //<div id="repeat-button" title="Repeat Off"><i className="fa fa-refresh"><span>1</span></i></div>
import React = require("react");
import ReactDOM = require("react-dom");
import Griddle = require("griddle-react");
import PouchDB = require("pouchdb-browser");
import ID3 = require("id3-parser");
import sha256 = require("js-sha256");

import {Track} from "../base/track";
import {Playlist} from "../base/playlist";
import {DocumentType} from "../base/enums";

export interface PlaylistComponentProperties {
    db : PouchDB.Database<Track | Playlist>;
}

export interface PlaylistComponentState {
    currentPlaylist: Playlist;
}


export class PlaylistComponent extends React.Component<PlaylistComponentProperties, PlaylistComponentState> {

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
        this.props.db.put(allPlaylist).then((res) => {
            var i=0;  
        }).catch((reason) => {
            var i=0;
        });

        this.props.db.changes({
            include_docs: true,
            since: "now",
            live: true//,
            //filter: (content) =>  content.DocType == DocumentType.Track
        }).on("change", (args) => {
           if (args.id) {
               var changeArgs = args as PouchDB.Core.ChangeResponse;
               this.props.db.get(args.id).then((value) => {
                   switch(value.DocType) {
                       case DocumentType.Track: {
                           this.addTrackToPlaylist(changeArgs.id, "All");
                           break;
                       }
                   }
               });
               /*this.addTrackToPlaylist(changeArgs.id, "All").then((response)=>{
                   if (response.ok) {
                       this.props.db.get(response.id).then((value) => {
                           var playlist = value as Playlist;
                           if (this.state == null) {
                               this.state = {
                                   currentPlaylist: playlist
                               }
                           }
                           else {
                               this.setState({
                                   currentPlaylist: playlist
                               });
                           }
                       });
                   }
               });
               .catch((error)=> {
                   this.addTrackToPlaylist(changeArgs.id, "All");
               });*/
           }
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
        // TODO check if it works if i exchange this.db.get(playlistId) <-> this.db.get(trackId)
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

    public render(): JSX.Element {
        return (
            <div>
                <input type="file" multiple={true} onChange={(evt) => this.filesSelected(evt)} />
            </div>
        );
    }
}
