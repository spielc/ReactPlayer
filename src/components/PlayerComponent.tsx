import * as React from "react";
import {observer} from "mobx-react";
import WaveSurfer from "wavesurfer.js";
const {BrowserWindow} = require("electron");

import {PlayerState, DocumentType} from "../base/enums";
import {AppState} from "../base/appstate";
import { CurrentSongIndexSetting, SettingIdPrefix } from "../base/typedefs";
import {Setting} from "../base/setting";
import {LastFMHelper} from "../util/LastFMHelper";
import {mod} from "../base/util";

interface PlayerComponentProperties {
    state: AppState
}


const EnableScrobblingSetting = SettingIdPrefix + "PlayerComponent.EnableScrobbling";
const LastFMSessionKeySetting = SettingIdPrefix + "PlayerComponent.EnableLastSessionKey";

@observer
export class PlayerComponent extends React.Component<PlayerComponentProperties,{}> {
    
    private waveSurfer: WaveSurfer[];
    private trackDurationHalf: number;
    private trackStartPlaybackTimestamp: number;
    private lastFMHelper: LastFMHelper;

    constructor(props: PlayerComponentProperties, context?: any) {
        super(props, context);
        this.waveSurfer = [];
        this.trackDurationHalf = -1;
        this.trackStartPlaybackTimestamp = -1;
        this.lastFMHelper = null;
        
    }
    
    public componentDidMount(): void {
        for (let i=0;i<3;i++) {
            const props = {
                container: `#wavesurfer${i}`,
                height: 30
            };
            this.waveSurfer.push(new WaveSurfer(props));
            this.waveSurfer[i].init();
            this.waveSurfer[i].on("audioprocess", (pos) => this.posChange(pos, this.waveSurfer[i]));
            this.waveSurfer[i].on("ready", () => this.props.state.ready(i));
            this.waveSurfer[i].on("finish", () => this.props.state.forward());     
        }
    }    

    public render(): JSX.Element {


        const waveStyles: React.CSSProperties[] = [{ opacity: 0 }, { opacity: 0 }, { opacity: 0 }];
        if (this.props.state.normalizedCurrentIndex >= 0) {
            waveStyles[this.props.state.normalizedCurrentIndex].opacity = 1.0;
        }
        if (this.waveSurfer.length > 0 ) {
            
            for (let i=0;i<this.waveSurfer.length;i++) {
                this.waveSurfer[i].setVolume(this.props.state.currentVolume);
                this.waveSurfer[i].pause();
                switch(this.props.state.state[i]) {
                case PlayerState.Loaded:
                    this.waveSurfer[i].load((this.props.state.currentFile[i].length === 0) ? "" : this.props.state.currentFile[i]);             
                    break;
                case PlayerState.Playing:
                    this.waveSurfer[i].play();
                    break;
                default:
                    break;
                }
            }
        }

        return (
            <div>
                <div id="wavesurfer0" style={waveStyles[0]} />
                <div id="wavesurfer1" style={waveStyles[1]} />
                <div id="wavesurfer2" style={waveStyles[2]} />
                <div id="container" className={this.props.state.containerState}>
                    <div className="player-control">
                        <div id="previous-button" title="Previous" onClick={()=>this.props.state.backward()} className={(this.trackChangeBtnClassName(false))}><i className="fa fa-fast-backward"/></div>
                        <div id="play-button" title="Play" onClick={() => this.props.state.play()}><i className="fa fa-play"/></div>
                        <div id="pause-button" title="Pause" onClick={() => this.props.state.pause()}><i className="fa fa-pause"/></div>
                        <div id="stop-button" title="Stop" onClick={()=>this.props.state.stop()}><i className="fa fa-stop"/></div>
                        <div id="next-button" title="Next" onClick={()=>this.props.state.forward()} className={(this.trackChangeBtnClassName(true))}><i className="fa fa-fast-forward"/></div>
                        <div id="mute-button" title="Toggle mute" onClick={()=>this.props.state.toggleMute()}><i className="fa fa-volume-off"></i></div>
                        <div id="volume-down-button" title="Volume Down" onClick={() => this.props.state.decreaseVolume()}><i className="fa fa-volume-down"/></div>
                        <div id="volume-up-button" title="Volume Up" onClick={() => this.props.state.increaseVolume()}><i className="fa fa-volume-up"/></div>
                        <div id="library-button" title="Library"><i className="fa fa-book" style={{ color: (this.props.state.libraryModeEnabled) ? "lightblue" : ""}} onClick={() => this.props.state.toggleLibraryMode()} /></div>
                        <div id="follow-button" title="Follow"><strong style={{ color: (this.props.state.followModeEnabled) ? "lightblue" : ""}} onClick={() => this.props.state.toggleFollowMode()}>F</strong></div>
                        <div id="settings-button" title="Settings" onClick={()=>this.openSettingsDialog()}><i className="fa fa-cog"/></div>
                    </div>
                </div>
            </div>
        );
    }


    private openSettingsDialog(): void {
        let settingsWindow = new BrowserWindow({
            modal: true,
            title: "Settings"
        });
        settingsWindow.loadURL(`file://${__dirname}/../settings.html`);
    }

    private trackChangeBtnClassName(isForwardBtn: boolean): string {
        var changeValue = (isForwardBtn) ? 1 : -1;
        return (this.props.state.currentFile[mod((this.props.state.currentIndex + changeValue), 3)] != null && this.props.state.currentFile[mod((this.props.state.currentIndex + changeValue), 3)]) ? "enabled" : "disabled";
    }

    private posChange(evtPos: number, waveSurfer: WaveSurfer): void {
        var pos = Math.floor(evtPos);
        if (pos == 0) {
            // event.wavesurfer.drawBuffer();
            let trackDuration = Math.ceil(waveSurfer.getDuration());
            // waveSurfer.Drawer.progress(pos/trackDuration);
            if (trackDuration > 30 && this.trackDurationHalf < 0) {
                let now = new Date(); 
                this.trackStartPlaybackTimestamp = Math.floor(now.valueOf() / 1000);
                this.trackDurationHalf = trackDuration / 2;
                console.log(`track.length=${trackDuration}`);
            }
        }
        else if (this.trackDurationHalf > 0 && ((pos > this.trackDurationHalf) || (pos > 240)))  {
            if (this.props.state.settings.length > 0) {
                let enableScrobblingSetting = this.props.state.settings.find((setting) => { return setting._id == EnableScrobblingSetting }) as Setting<boolean>;
                if (enableScrobblingSetting) {
                    if (enableScrobblingSetting.Value) {
                        if (!this.lastFMHelper) {
                            let lastFMSessionKeySetting = this.props.state.settings.find(setting => setting._id == LastFMSessionKeySetting) as Setting<string>;
                            if (lastFMSessionKeySetting.Value !== "")
                                this.lastFMHelper = new LastFMHelper("bef50d03aa4fa431554f3bac85147580", lastFMSessionKeySetting.Value);
                        }
                        
                        let currentSongIndexSetting = this.props.state.settings.find(setting => setting._id == CurrentSongIndexSetting) as Setting<number>;
                        let track = this.props.state.playlist[currentSongIndexSetting.Value];
                        let map = new Map<string,string>();
                        map.set("album", track.album);
                        map.set("artist", track.artist);
                        map.set("method", "track.scrobble");
                        map.set("timestamp", this.trackStartPlaybackTimestamp.toString());
                        map.set("track", track.title);
                        if (this.lastFMHelper)
                            this.lastFMHelper.startRequest(map, true);
                        this.trackDurationHalf = -1;
                    }
                }
                else {
                    let enableScrobblingSetting: Setting<boolean> = {
                        _id: EnableScrobblingSetting,
                        Value: false,
                        DocType: DocumentType.Setting,
                        IsVisible: true
                    };
                    this.props.state.settings.push(enableScrobblingSetting);
                    let lastFMSessionKeySetting: Setting<string> = {
                        _id: LastFMSessionKeySetting,
                        Value: "",
                        DocType: DocumentType.Setting,
                        IsVisible: true
                    };
                    this.props.state.settings.push(lastFMSessionKeySetting);
                }
            }
        }

    }
}