import * as React from "react";
import * as ReactDOM from "react-dom";
import WaveSurfer from "react-wavesurfer";
import * as PubSub from "pubsub-js";
import {readFile} from "fs";
import {request, RequestOptions} from "http";
import md5 = require("md5");

import {ComponentWithSettings, ComponentWithSettingsProperties} from "./ComponentWithSettings";
import {PlayerState, DocumentType} from "../base/enums";
import {Track} from "../base/track";
import {Playlist} from "../base/playlist";
import {PlayerMessageTypes_Play, PlayerMessageTypes_Forward, PlayerMessageTypes_Backward, PlayerMessageTypes, ReactPlayerDB, CurrentSongIndexSetting, PlaylistMessageType, PlaylistMessageTypes, PlaylistMessage_Changed, PlaylistMessage_TrackChanged} from "../base/typedefs";
import {Setting} from "../base/setting";
import {mod} from "../base/util";

interface PlayerComponentState {
    state: PlayerState[];
    containerState: "enabled" | "disabled";
    currentFile: string[]; //TODO: this has to be changed to a string[]
    currentPos: number[];
    currentIndex: number;
    currentVolume: number;
}

interface WaveSurferEventParams {
        wavesurfer: any;
        originalArgs: any[];
}

const EnableScrobblingSetting = "PlayerComponent.Settings.EnableScrobbling";
const LastFMSessionKeySetting = "PlayerComponent.Settings.EnableLastSessionKey";

export class PlayerComponent extends ComponentWithSettings<ComponentWithSettingsProperties, PlayerComponentState> {
    
    private waveSurfer: WaveSurfer[];
    //private playlist: string[];
    private oldVolume: number;
    private forwardBtn: HTMLDivElement;
    private tokens: any[];
    private trackDurationHalf: number;
    private trackStartPlaybackTimestamp: number;

    constructor(props: ComponentWithSettingsProperties, context?: any) {
        super(props, context);
        /*this.playlist=["", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/01- Intro.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/02- Her Voice Resides.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/03- 4 Words (To Choke Upon).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/04- Tears Don`t Fall.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/05- Suffocating Under Words Of Sorrow (What Can I Do).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/06- Hit The Floor.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/07- All These Things I Hate (Revolve Around Me).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/08- Hand Of Blood.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/09- Room 409.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/10- The Poison.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/11- 10 Years Today.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/12- Cries In Vain.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/13- Spit You Out.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/14- The End.mp3", ""];*/
        this.state= { state : [PlayerState.Loaded, PlayerState.Loaded, PlayerState.Loaded], containerState : "disabled", currentFile : ["", "", ""], currentPos : [0, 0, 0], currentIndex : 1, currentVolume : 0.5 };
        this.waveSurfer=[];
        // TODO we have to get this using pubsub-event 
        this.loadFiles();
        this.tokens = [];
        this.trackDurationHalf = -1;
        this.trackStartPlaybackTimestamp = -1;
    }    

    public componentDidMount() : void {
        this.tokens.push(PubSub.subscribe(PlaylistMessageType, (event: PlaylistMessageTypes, trackIdx: number) => { this.playlistEvent(event, trackIdx); }));
    }

    public render(): JSX.Element {
        return (
            <div>
                <div hidden={(this.state.currentIndex % 3) != 0}>
                    <WaveSurfer audioFile={(this.state.currentFile[0].length == 0) ? new Blob() : this.state.currentFile[0]} playing={this.state.state[0]==PlayerState.Playing} pos={0} volume={this.state.currentVolume} onReady={()=>this.onReady()} onFinish={(evt)=>this.trackChange(this.createDummyMouseEvent())} onPosChange={(evt)=>this.posChange(evt)} ref={(r) => { this.waveSurfer[0]=r } } options={ {height: 30} } />
                </div>
                <div hidden={(this.state.currentIndex % 3) != 1}>
                    <WaveSurfer audioFile={(this.state.currentFile[1].length == 0) ? new Blob() : this.state.currentFile[1]} playing={this.state.state[1]==PlayerState.Playing} pos={0} volume={this.state.currentVolume} onReady={()=>this.onReady()} onFinish={(evt)=>this.trackChange(this.createDummyMouseEvent())} onPosChange={(evt)=>this.posChange(evt)} ref={(r) => { this.waveSurfer[1]=r } } options={ {height: 30} } />
                </div>
                <div hidden={(this.state.currentIndex % 3) != 2}>
                    <WaveSurfer audioFile={(this.state.currentFile[2].length == 0) ? new Blob() : this.state.currentFile[2]} playing={this.state.state[2]==PlayerState.Playing} pos={0} volume={this.state.currentVolume} onReady={()=>this.onReady()} onFinish={(evt)=>this.trackChange(this.createDummyMouseEvent())} onPosChange={(evt)=>this.posChange(evt)} ref={(r) => { this.waveSurfer[2]=r } } options={ {height: 30} } />
                </div>
                <div id="container" className={this.state.containerState}>
                    <div className="player-control">
                        <div id="previous-button" title="Previous" onClick={evt=>this.trackChange(evt)} className={(this.trackChangeBtnClassName(false))}><i className="fa fa-fast-backward"/></div>
                        <div id="play-button" title="Play" onClick={evt=>{this.play()}}><i className="fa fa-play"/></div>
                        <div id="pause-button" title="Pause" onClick={evt=>{this.setState({state: [PlayerState.Loaded, PlayerState.Paused, PlayerState.Loaded], containerState: "enabled", currentFile: this.state.currentFile, currentPos: this.state.currentPos, currentIndex: this.state.currentIndex, currentVolume: this.state.currentVolume });}}><i className="fa fa-pause"/></div>
                        <div id="stop-button" title="Stop" onClick={evt=>this.stopButtonClicked(evt)}><i className="fa fa-stop"/></div>
                        <div id="next-button" title="Next" onClick={evt=>this.trackChange(evt)} className={(this.trackChangeBtnClassName(true))} ref={(r) => this.forwardBtn=r}><i className="fa fa-fast-forward"/></div>
                        <div id="mute-button" title="Toggle mute" onClick={evt=>{}}><i className="fa fa-volume-off"></i></div>
                        <div id="volume-down-button" title="Volume Down" onClick={evt=>this.volumeChange(false)}><i className="fa fa-volume-down"/></div>
                        <div id="volume-up-button" title="Volume Up" onClick={evt=>this.volumeChange(true)}><i className="fa fa-volume-up"/></div>
                        <div id="settings-button" title="Settings" onClick={evt=>{}}><i className="fa fa-cog"/></div>
                    </div>
                </div>
            </div>
            );
    }

    protected loadSettings(response: PouchDB.Core.AllDocsResponse<Track | Playlist | Setting<any>>) {
        if (response.rows.length==0) {
            var enableScrobblingSetting: Setting<boolean> = {
                _id: EnableScrobblingSetting,
                DocType: DocumentType.Setting,
                Value: false,
                IsVisible: true
            };
            this.props.db.put(enableScrobblingSetting);
            this.settings.push(enableScrobblingSetting);
            var lastFMSessionKeySetting: Setting<string> = {
                _id: LastFMSessionKeySetting,
                DocType: DocumentType.Setting,
                Value: "",
                IsVisible: true
            };
            this.props.db.put(lastFMSessionKeySetting);
            this.settings.push(lastFMSessionKeySetting);
        }
        else 
            this.settings = response.rows.map(row => row.doc).map(doc => doc as Setting<any>);
    }

    private loadFiles(callback?: () => any): void {
        this.props.db.get("All").then((response) => {
            var list = response as Playlist;
            if (list != null) {
                this.props.db.get(CurrentSongIndexSetting).then(res => {
                    var setting = res as Setting<number>
                    if (setting != null) {
                        var indizes = [setting.Value - 1, setting.Value, setting.Value + 1]
                        var files: string[] = [];
                        var keys: string[] = [];
                        var invalidIndizes = 0;
                        for (var i=0;i<indizes.length;i++) {
                            var idx = mod(indizes[i], indizes.length);
                            if(indizes[i]>=0 && indizes[i]<list.Tracks.length)
                                keys[idx] = list.Tracks[indizes[i]]._id;
                            else 
                                keys[idx] = "";
                                
                        }
                        this.props.db.allDocs({attachments: true, include_docs: true, keys: keys}).then((response) => {
                            for(var i=0;i<keys.length;i++) {
                                var file = "";
                                var key = keys[i];
                                if (key != "") {
                                    var track = response.rows[i].doc as Track;
                                    file = track.path;
                                }
                                
                                files[i] = file;
                            }
                            this.setState({
                                currentFile: files,
                                currentIndex: setting.Value
                            }, callback);
                        });
                    }
                });
                
            }
        });
    }

    private playlistEvent(event: PlaylistMessageTypes, trackIdx: number): void {
        switch(event) {
            case PlaylistMessage_TrackChanged:
                var isPlaying = this.state.state.some(state => state == PlayerState.Playing);
                this.state.state.fill(PlayerState.Loaded)
                this.setState({
                    state: this.state.state, 
                    containerState: "disabled", 
                    currentFile: this.state.currentFile, 
                    currentPos: this.state.currentPos, 
                    currentIndex: this.state.currentIndex, 
                    currentVolume: this.state.currentVolume
                }, () => {
                    this.props.db.get(CurrentSongIndexSetting).then(res => {
                        var currentSongIndexSetting = res as Setting<number>;
                        currentSongIndexSetting.Value = trackIdx;
                        this.props.db.put(currentSongIndexSetting).then(res => {
                            this.loadFiles();
                        });
                        
                    });
                });
                
                
                break;
        }
    }

    private play(): void {
        this.props.db.get("All").then((response) => {
            var list = response as Playlist;
            if (list != null) {
                this.props.db.get(list.Tracks[this.state.currentIndex]._id).then(value => {
                    var track = value as Track;
                    new Notification('Now playing', {
                        body: `${track.title} from ${track.artist}`
                    });
                });
            }
        });
        this.state.state[mod(this.state.currentIndex, this.state.state.length)] = PlayerState.Playing;
        this.setState({
            state: this.state.state
        });
        PubSub.publish(PlayerMessageTypes_Play, {});
    }

    private createDummyMouseEvent(): React.MouseEvent<HTMLDivElement> {
        return {
            altKey: false,
            button: 0,
            buttons: 0,
            clientX: 0,
            clientY: 0,
            ctrlKey: false,
            getModifierState: (blub: string) => true,
            metaKey: false,
            pageX: 0,
            pageY: 0,
            relatedTarget: this.forwardBtn,
            screenX: 0,
            screenY: 0,
            shiftKey: false,
            bubbles: false,
            cancelable: false,
            currentTarget: this.forwardBtn,
            defaultPrevented: false,
            isDefaultPrevented: () => false,
            isPropagationStopped: () => false,
            persist: () => {},
            eventPhase: 0,
            isTrusted: false,
            nativeEvent: {
                bubbles: false,
                cancelBubble: false,
                cancelable: false,
                currentTarget: this.forwardBtn,
                defaultPrevented: false,
                eventPhase: 0,
                isTrusted: false,
                returnValue: false,
                srcElement: this.forwardBtn,
                target: this.forwardBtn,
                timeStamp: 0,
                type: "",
                initEvent: (eventTypeArg: string, canBubbleArg: boolean, cancelableArg: boolean) => {},
                preventDefault: () => {},
                stopImmediatePropagation: () => {},
                stopPropagation: () => {},
                AT_TARGET: 0,
                BUBBLING_PHASE: 0,
                CAPTURING_PHASE: 0,
                scoped: false,
                deepPath: () => new EventTarget[0]
            },
            preventDefault: () => {},
            stopPropagation: () => {},
            target: this.forwardBtn,
            timeStamp: new Date(),
            type: ""
        };
    }

    private trackChangeBtnClassName(isForwardBtn: boolean): string {
        var changeValue = (isForwardBtn) ? 1 : -1;
        return (this.state.currentFile[mod((this.state.currentIndex + changeValue), 3)] != null && this.state.currentFile[mod((this.state.currentIndex + changeValue), 3)]) ? "enabled" : "disabled";
    }

    // testdata for generating the api-signature                                                                                                                                                 
    //api_keybef50d03aa4fa431554f3bac85147580artistCalibanmethodtrack.scrobblesk2b19d6abdccc11a6825bde6ba305e16ctimestamp1461172285trackKing66717d5c66601f8f7789cd9f93444252 => 4d0e837d63a2618c408736b3dc9e0ced
    private sign(data: Map<string, string>): string {
        let retValue = "";
        for(let entry of data) {
            retValue += entry[0] + entry[1];
        }
        retValue += "66717d5c66601f8f7789cd9f93444252";
        return md5(retValue);
    }

    private posChange(event: WaveSurferEventParams): void {
        var pos = Math.floor(event.originalArgs[0]);
        if (pos == 0) {
            event.wavesurfer.drawBuffer();
            let trackDuration = Math.ceil(event.wavesurfer.getDuration());
            if (trackDuration > 30 && this.trackDurationHalf < 0) {
                let now = new Date(); 
                this.trackStartPlaybackTimestamp = Math.floor(now.valueOf() / 1000);
                this.trackDurationHalf = trackDuration / 2;
                console.log(`track.length=${trackDuration}`);
            }
        }
        else if (this.trackDurationHalf > 0 && ((pos > this.trackDurationHalf) || (pos > 240)))  {
            // var enableScrobblingSetting = this.settings.find((setting, index, obj) => { return setting._id == EnableScrobblingSetting }) as Setting<boolean>;
            // var lastFMSessionKeySetting = this.settings.find((setting, index, obj) => { return setting._id == LastFMSessionKeySetting }) as Setting<string>;
            // if (enableScrobblingSetting && enableScrobblingSetting.Value && lastFMSessionKeySetting && (lastFMSessionKeySetting.Value.length > 0)) {
                this.props.db.get("All").then((response) => {
                    let list = response as Playlist;
                    if (list != null) {
                        this.props.db.get(list.Tracks[this.state.currentIndex]._id).then(value => {
                            let track = value as Track;
                            /*let track = {
                                artist: "Caliban",
                                title: "King"
                            };*/
                            let map = new Map<string,string>();
                            map.set("album", track.album);
                            map.set("api_key", "bef50d03aa4fa431554f3bac85147580");
                            map.set("artist", track.artist);
                            map.set("method", "track.scrobble");
                            map.set("sk", "2b19d6abdccc11a6825bde6ba305e16c");
                            map.set("timestamp", this.trackStartPlaybackTimestamp.toString());
                            //map.set("timestamp", "1461172285");
                            map.set("track", track.title);
                            let signature = this.sign(map);
                            map.set("api_sig", signature);
                            map.set("format", "json");
                            let requestParams = "";
                            for(let entry of map) {
                                requestParams += `${entry[0]}=${entry[1]}&`;
                            }
                            requestParams=requestParams.substr(0, requestParams.lastIndexOf("&"));
                            let reqOptions: RequestOptions = {
                                protocol: "http:",
                                method: "POST",
                                host: "ws.audioscrobbler.com",
                                port: 80,
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                                },
                                path: "/2.0/"
                            }
                            let req = request(reqOptions, response => {
                                response.addListener("data", chunk => {
                                    let buf = chunk as Buffer;
                                    let res = String.fromCharCode.apply(null, buf);
                                    let i = 0;
                                });
                            });
                            req.addListener("error", err => {
                                let i = 0;
                            });
                            req.write(requestParams);
                            req.end();
                        });
                    }
                });
            // }
            this.trackDurationHalf = -1;
        }

    }

    private stopButtonClicked(evt: React.MouseEvent<HTMLDivElement>): void {
        var currentPos=mod(this.state.currentIndex, this.state.currentFile.length);
        //this.waveSurfer[currentPos].props.pos = 0;
        this.state.state[currentPos] = PlayerState.Stopped;
        this.setState({
            state: this.state.state
        });
    }

    private volumeChange(isIncrease: boolean): void {
        const volumeChangeValue = (isIncrease) ? 0.1 : -0.1;
        var newVolume = this.state.currentVolume + volumeChangeValue;
        this.setState({
            currentVolume: newVolume
        });
    }

    private trackChange(evt: React.MouseEvent<HTMLDivElement>): void {
        var target = evt.currentTarget as HTMLElement;
        var className = target.className;
        if (className != "disabled") {
            var title = target.title;
            var changeValue = (title == "Next") ? 1 : -1;
            var newIndex = this.state.currentIndex + changeValue;
            var loadIndex = mod((newIndex - changeValue), this.state.currentFile.length);
            var playIndex = mod(newIndex, this.state.currentFile.length);
            var insertIndex = mod((newIndex + changeValue), this.state.currentFile.length);
            var trackToInsertIndex = newIndex + changeValue;
            var promise = new Promise<string>((resolve, reject) => {
                this.props.db.get("All").then((response) => {
                    var list = response as Playlist;
                    if (list != null) {
                        this.props.db.get(list.Tracks[newIndex]._id).then(value => {
                            var track = value as Track;
                            new Notification('Now playing', {
                                body: `${track.title} from ${track.artist}`
                            });
                        });
                        if (list.Tracks.length > trackToInsertIndex) {
                            this.props.db.get(list.Tracks[trackToInsertIndex]._id).then((value) => {
                                var track = value as Track;
                                resolve(track.path);
                            });
                        }
                        else
                            resolve("");
                    }
                    else {
                        resolve("");
                    }
                });
            }).then(value => {
                console.log(this.state);
                this.state.currentFile[insertIndex] = value;
                this.state.state[insertIndex] = PlayerState.Loaded;
                this.setState({ 
                    state: this.state.state, 
                    currentFile: this.state.currentFile 
                });
            });
            
            this.state.state[playIndex] = PlayerState.Playing;
            this.state.state[loadIndex] = PlayerState.Loaded;
            this.setState({
                state: this.state.state, 
                currentIndex: newIndex
            });
            var msgType = (title == "Next") ? PlayerMessageTypes_Forward : PlayerMessageTypes_Backward;
            PubSub.publish(msgType, {});
        }
    }

    private onReady(): void {
        this.state.currentPos[mod(this.state.currentIndex, this.state.currentFile.length)] = 10;
        switch(this.state.state[this.state.currentIndex]) {
            case PlayerState.Loaded:
                this.state.state[this.state.currentIndex] = PlayerState.Ready;
                break;
            case PlayerState.Forward:
                this.state.state[this.state.currentIndex] = PlayerState.Playing;
                break;
        }
        this.setState({
            state: this.state.state, 
            containerState: "enabled"
        });
    }
}