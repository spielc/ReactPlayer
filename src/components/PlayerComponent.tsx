import * as React from "react";
import * as ReactDOM from "react-dom";
import WaveSurfer from "react-wavesurfer";
import {readFile} from "fs";
import {request, RequestOptions} from "http";
import md5 = require("md5");
import {ipcRenderer, BrowserWindow} from "electron";

import {ComponentWithSettings, ComponentWithSettingsProperties} from "./ComponentWithSettings";
import {PlayerState, DocumentType} from "../base/enums";
import {Track} from "../base/track";
import {Playlist} from "../base/playlist";
import {PlayerMessageTypes_Play, PlayerMessageTypes_Forward, PlayerMessageTypes_Backward, PlayerMessageTypes, ReactPlayerDB, CurrentSongIndexSetting, PlaybackStateSetting, PlaylistMessageType, PlaylistMessageTypes, PlaylistMessage_Changed, PlaylistMessage_TrackChanged, WindowManagementMessage_Define, WindowManagementMessage_Show, WindowDefinitionType, SettingsWindowName, WindowManagementMessage_RegisterHandler, WindowManagementMessage_LifeCycleEvent} from "../base/typedefs";
import {Setting} from "../base/setting";
import {LastFMHelper} from "../util/LastFMHelper";
import {mod} from "../base/util";

interface PlayerComponentState {
    state: PlayerState[];
    containerState: "enabled" | "disabled";
    currentFile: string[];
    currentPos: number[];
    currentIndex: number;
    currentVolume: number;
}

interface WaveSurferEventParams {
        wavesurfer: any;
        originalArgs: any[];
}

const EnableScrobblingSetting = "Settings.PlayerComponent.EnableScrobbling";
const LastFMSessionKeySetting = "Settings.PlayerComponent.EnableLastSessionKey";

export class PlayerComponent extends ComponentWithSettings<ComponentWithSettingsProperties, PlayerComponentState> {
    
    private waveSurfer: WaveSurfer[];
    //private playlist: string[];
    private oldVolume: number;
    private forwardBtn: HTMLDivElement;
    private tokens: any[];
    private trackDurationHalf: number;
    private trackStartPlaybackTimestamp: number;
    private win: any;
    private lastFMHelper: LastFMHelper;
    private isCurrentSongIndexSettingChanger: boolean;

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
        this.lastFMHelper = null;
        this.isCurrentSongIndexSettingChanger = false;

        this.props.db.changes({
            include_docs: true,
            since: "now",
            live: true
        }).on("change", args => {
            if (args.id) {
                var changeArgs = args; //as PouchDB.Core.ChangeResponse;
                this.props.db.get(args.id).then(value => {
                    switch(value.DocType) {
                        case DocumentType.Setting: {
                            if (value._id == CurrentSongIndexSetting && !this.isCurrentSongIndexSettingChanger) {
                                var currentSongIndexSetting = value as Setting<number>;
                                var isPlaying = this.state.state.some(state => state == PlayerState.Playing);
                                this.state.state.fill(PlayerState.Loaded)
                                this.setState({
                                    state: this.state.state, 
                                    containerState: "disabled"
                                }, () => this.loadFiles());
                            }
                            this.isCurrentSongIndexSettingChanger = false;
                        }
                    }
                });
            }
        });
    }    

    public componentDidMount() : void {
        // this.tokens.push(PubSub.subscribe(PlaylistMessageType, (event: PlaylistMessageTypes, trackIdx: number) => { this.playlistEvent(event, trackIdx); }));
        ipcRenderer.sendSync(WindowManagementMessage_Define, {
            WindowId: SettingsWindowName,
            URL: `file://${__dirname}/../settings.html`,
            Options: {
                modal: true,
                show: false,
                title: "Settings"
            }
        });
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
                        <div id="play-button" title="Play" onClick={evt => this.play()}><i className="fa fa-play"/></div>
                        <div id="pause-button" title="Pause" onClick={evt => this.pause()}><i className="fa fa-pause"/></div>
                        <div id="stop-button" title="Stop" onClick={evt=>this.stopButtonClicked(evt)}><i className="fa fa-stop"/></div>
                        <div id="next-button" title="Next" onClick={evt=>this.trackChange(evt)} className={(this.trackChangeBtnClassName(true))} ref={(r) => this.forwardBtn=r}><i className="fa fa-fast-forward"/></div>
                        <div id="mute-button" title="Toggle mute" onClick={evt=>{}}><i className="fa fa-volume-off"></i></div>
                        <div id="volume-down-button" title="Volume Down" onClick={evt=>this.volumeChange(false)}><i className="fa fa-volume-down"/></div>
                        <div id="volume-up-button" title="Volume Up" onClick={evt=>this.volumeChange(true)}><i className="fa fa-volume-up"/></div>
                        <div id="settings-button" title="Settings" onClick={evt=>this.openSettingsDialog()}><i className="fa fa-cog"/></div>
                    </div>
                </div>
            </div>
            );
    }

    protected loadSettings(response: PouchDB.Core.AllDocsResponse<Track | Playlist | Setting<any>>) {
        if (response.rows.length==0) {
            let enableScrobblingSetting: Setting<boolean> = {
                _id: EnableScrobblingSetting,
                DocType: DocumentType.Setting,
                Value: false,
                IsVisible: true
            };
            this.props.db.put(enableScrobblingSetting);
            this.settings.push(enableScrobblingSetting);
            let lastFMSessionKeySetting: Setting<string> = {
                _id: LastFMSessionKeySetting,
                DocType: DocumentType.Setting,
                Value: "",
                IsVisible: true
            };
            this.props.db.put(lastFMSessionKeySetting);
            this.settings.push(lastFMSessionKeySetting);
            let playbackStateSetting: Setting<PlayerState> = {
                _id: PlaybackStateSetting,
                DocType: DocumentType.Setting,
                Value: PlayerState.Loaded,
                IsVisible: false
            }
            this.props.db.put(playbackStateSetting);
            this.settings.push(playbackStateSetting);
        }
        else 
            this.settings = response.rows.map(row => row.doc).map(doc => doc as Setting<any>);
        let lastFMSessionKeySetting = this.settings.find(setting => setting._id == LastFMSessionKeySetting) as Setting<string>;
        if (lastFMSessionKeySetting.Value !== "")
            this.lastFMHelper = new LastFMHelper("bef50d03aa4fa431554f3bac85147580", lastFMSessionKeySetting.Value);
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

    private openSettingsDialog(): void {
        // TODO fix this that the settings dialog gets opened
        // window.on("closed", () => {
        //     window.removeAllListeners();
        //     window = null;
        //     console.log(`Window '${winDef.WindowId}' closed!`);
        // });
        // windows.set(winDef.WindowId, window);
        //console.log(ipcRenderer.sendSync("synchronous-message", "ping"));
        ipcRenderer.sendSync(WindowManagementMessage_Show, SettingsWindowName);
        // TODO send ipc-Message to Main-process which registers the Settings-dialog
        // let windowDef: WindowDefinitionType = [
        //     SettingsWindowName,
        //     `file://${__dirname}/../settings.html`,
        //     {
        //         modal: true,
        //         show: false,
        //         title: "Settings"
        //     }
        // ];
        ipcRenderer.sendSync(WindowManagementMessage_Define, {//windowDef);
            WindowId: SettingsWindowName,
            URL: `file://${__dirname}/../settings.html`,
            Options: {
                modal: true,
                show: false,
                title: "Settings"
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

        this.changePlayerState(PlayerState.Playing);
    }

    private pause(): void {
        this.setState({
            state: [PlayerState.Loaded, PlayerState.Paused, PlayerState.Loaded], 
            containerState: "enabled" 
        });
        this.changePlayerState(PlayerState.Paused);
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
                deepPath: () => new EventTarget[0],
                altKey: false,
                button: 0,
                buttons: 0,
                clientX: 0,
                clientY: 0,
                ctrlKey: false,
                fromElement: null,
                layerX: 0,
                layerY: 0,
                metaKey: false,
                movementX: 0,
                movementY: 0,
                offsetX: 0,
                offsetY: 0,
                pageX: 0,
                pageY: 0,
                relatedTarget: this.forwardBtn,
                screenX: 0,
                screenY: 0,
                shiftKey: false,
                toElement: this.forwardBtn,
                which: 0,
                x: 0,
                y: 0,
                getModifierState: (blub: string) => true,
                initMouseEvent: (typeArg: string, canBubbleArg: boolean, cancelableArg: boolean, viewArg: Window, detailArg: number, screenXArg: number, screenYArg: number, clientXArg: number, clientYArg: number, ctrlKeyArg: boolean, altKeyArg: boolean, shiftKeyArg: boolean, metaKeyArg: boolean, buttonArg: number, relatedTargetArg: EventTarget | null) => {},
                detail: 0,
                view: null,
                initUIEvent: (typeArg: string, canBubbleArg: boolean, cancelableArg: boolean, viewArg: Window, detailArg: number) => {}
            },
            preventDefault: () => {},
            stopPropagation: () => {},
            target: this.forwardBtn,
            timeStamp: 0,
            type: ""
        };
    }

    private changePlayerState(newState: PlayerState): void {
        this.props.db.get(PlaybackStateSetting).then(response => {
            let setting = response as Setting<PlayerState>;
            setting.Value = newState;
            this.props.db.put(setting);
        });
    }

    private trackChangeBtnClassName(isForwardBtn: boolean): string {
        var changeValue = (isForwardBtn) ? 1 : -1;
        return (this.state.currentFile[mod((this.state.currentIndex + changeValue), 3)] != null && this.state.currentFile[mod((this.state.currentIndex + changeValue), 3)]) ? "enabled" : "disabled";
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
            var enableScrobblingSetting = this.settings.find((setting, index, obj) => { return setting._id == EnableScrobblingSetting }) as Setting<boolean>;
            if (enableScrobblingSetting && enableScrobblingSetting.Value) { 
                this.props.db.get("All").then((response) => {
                    let list = response as Playlist;
                    if (list != null) {
                        this.props.db.get(list.Tracks[this.state.currentIndex]._id).then(value => {
                            let track = value as Track;
                            let map = new Map<string,string>();
                            map.set("album", track.album);
                            map.set("artist", track.artist);
                            map.set("method", "track.scrobble");
                            map.set("timestamp", this.trackStartPlaybackTimestamp.toString());
                            map.set("track", track.title);
                            if (this.lastFMHelper) {
                                this.lastFMHelper.startRequest(map, true);
                            }
                        });
                    }
                });
            }
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
        this.changePlayerState(PlayerState.Stopped);
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
            // var msgType = (title == "Next") ? PlayerMessageTypes_Forward : PlayerMessageTypes_Backward;
            // PubSub.publish(msgType, {});
            this.props.db.get(CurrentSongIndexSetting).then(result => {
                var setting = result as Setting<number>;
                setting.Value += changeValue;
                this.isCurrentSongIndexSettingChanger = true;
                this.props.db.put(setting);
            })
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