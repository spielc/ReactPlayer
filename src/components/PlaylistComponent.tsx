//<div id="shuffle-button" title="Shuffle Off"><i className="fa fa-random"></i></div>
                        //<div id="repeat-button" title="Repeat Off"><i className="fa fa-refresh"><span>1</span></i></div>
import React = require("react");
import ReactDOM = require("react-dom");
import PouchDB = require("pouchdb-browser");
import ID3 = require("id3-parser");
import {Track} from "../base/track";
import {Playlist} from "../base/playlist";
import sha256 = require("js-sha256");

export class PlaylistComponent extends React.Component<{}, {}> {

    private db : PouchDB.Database<Track | Playlist>;

    constructor(props: {}, context?: any) {
        super(props, context);
        //var playlist = ["", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/01- Intro.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/02- Her Voice Resides.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/03- 4 Words (To Choke Upon).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/04- Tears Don`t Fall.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/05- Suffocating Under Words Of Sorrow (What Can I Do).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/06- Hit The Floor.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/07- All These Things I Hate (Revolve Around Me).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/08- Hand Of Blood.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/09- Room 409.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/10- The Poison.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/11- 10 Years Today.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/12- Cries In Vain.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/13- Spit You Out.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/14- The End.mp3", ""];
        //this.parse(playlist[0]).then((tag)=>{ return tag; });
        this.db = new PouchDB("ReactPlayerDB");
    }

    private filesSelected(evt: React.FormEvent): void {
        //ugly but necessary...
        var rawObject=evt.currentTarget as any;
        var files = rawObject.files as FileList;
        var startTime = new Date();
        for(var i=0;i<files.length;i++) {
            var reader = new FileReader();
            reader.onload =  (event) => {
                var fileReader=event.target as FileReader;
                var data = fileReader.result as ArrayBuffer;
                var dataBuffer = new Uint8Array(data);
                ID3.parse(dataBuffer).then((tag) => {
                    var hash = sha256.sha256(dataBuffer);
                    console.log(`${tag.artist} / ${tag.title}: ${hash}`);
                    var test: Track = {
                        _id: hash,
                        album: tag.album,
                        artist: tag.artist,
                        title: tag.title,
                        year: tag.year,
                        image: tag.image,
                        lyrics: tag.lyrics,
                        comment: tag.comment,
                        track: tag.track,
                        genre: tag.genre,
                        version: tag.version,
                        playlists: ["All"]
                    };
                    return this.db.put(test);
                }).then((response) => {
                    /*if (response.ok) {
                        var playlist = new Playlist("All");
                        var views = playlist.views;
                        var id = playlist._id;
                        this.db.put(playlist).then((result) => {
                            var i = 0;
                        }).catch((reason) => {
                            var i = 0;
                        });
                    }*/
                });
            };
            reader.readAsArrayBuffer(files[i]);
            /*ID3.parse(files.item(i)).then((tag)=>{
                console.log(`${tag.artist} / ${tag.title}`)
            });*/
        }
        
        var endTime = new Date();
        var diff = endTime.getMilliseconds()-startTime.getMilliseconds();
        console.log(`id3-parsing took ${diff} msec`);
    }

    public render(): JSX.Element {
        return (
            <div>
                <input type="file" multiple={true} onChange={(evt) => this.filesSelected(evt)} />
            </div>
        );
    }
}
