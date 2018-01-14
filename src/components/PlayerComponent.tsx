import * as React from "react";
import * as ReactDOM from "react-dom";
import {autorun, whyRun} from "mobx";
import {observer} from "mobx-react";
import WaveSurfer from "react-wavesurfer";
import {readFile} from "fs";
import {request, RequestOptions} from "http";
import md5 = require("md5");
const {BrowserWindow} = require("electron").remote;

import {ComponentWithSettings, ComponentWithSettingsProperties} from "./ComponentWithSettings";
import {PlayerState, DocumentType} from "../base/enums";
import {AppState} from "../base/appstate";
import {Track} from "../base/track";
import {Playlist} from "../base/playlist";
import { PlayerMessageTypes_Play, PlayerMessageTypes_Forward, PlayerMessageTypes_Backward, PlayerMessageTypes, ReactPlayerDB, CurrentSongIndexSetting, PlaybackStateSetting, LibraryModeEnabledSetting, PlaylistMessageType, PlaylistMessageTypes, PlaylistMessage_Changed, PlaylistMessage_TrackChanged, WindowManagementMessage_Define, WindowManagementMessage_Show, SettingsWindowName, WindowManagementMessage_RegisterHandler, WindowManagementMessage_LifeCycleEvent, SettingIdPrefix, PlaylistIdPrefix } from "../base/typedefs";
import {Setting} from "../base/setting";
import {LastFMHelper} from "../util/LastFMHelper";
import {mod} from "../base/util";

interface PlayerComponentProperties {
    state: AppState
}

interface WaveSurferEventParams {
        wavesurfer: any;
        originalArgs: any[];
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
        this.waveSurfer=[];
        this.trackDurationHalf = -1;
        this.trackStartPlaybackTimestamp = -1;
        this.lastFMHelper = null;
    }    

    public render(): JSX.Element {

        let style: React.CSSProperties = {
            color: (this.props.state.libraryModeEnabled) ? "lightblue" : ""
        }

        
        
        return (
            <div>
                <div hidden={(this.props.state.normalizedCurrentIndex) != 0}>
                    <WaveSurfer audioFile={(this.props.state.currentFile[0].length == 0) ? new Blob() : this.props.state.currentFile[0]} playing={this.props.state.state[0]==PlayerState.Playing} pos={0} volume={this.props.state.currentVolume} onFinish={(evt)=>this.props.state.forward()} onPosChange={(evt)=>this.posChange(evt)} onReady={() => this.props.state.ready(0)} ref={(r) => { this.waveSurfer[0]=r } } options={ {height: 30} } />
                </div>
                <div hidden={(this.props.state.normalizedCurrentIndex) != 1}>
                    <WaveSurfer audioFile={(this.props.state.currentFile[1].length == 0) ? new Blob() : this.props.state.currentFile[1]} playing={this.props.state.state[1]==PlayerState.Playing} pos={0} volume={this.props.state.currentVolume} onFinish={(evt)=>this.props.state.forward()} onPosChange={(evt)=>this.posChange(evt)} onReady={() => this.props.state.ready(1)} ref={(r) => { this.waveSurfer[1]=r } } options={ {height: 30} } />
                </div>
                <div hidden={(this.props.state.normalizedCurrentIndex) != 2}>
                    <WaveSurfer audioFile={(this.props.state.currentFile[2].length == 0) ? new Blob() : this.props.state.currentFile[2]} playing={this.props.state.state[2]==PlayerState.Playing} pos={0} volume={this.props.state.currentVolume} onFinish={(evt)=>this.props.state.forward()} onPosChange={(evt)=>this.posChange(evt)} onReady={() => this.props.state.ready(2)} ref={(r) => { this.waveSurfer[2]=r } } options={ {height: 30} } />
                </div>
                <div id="container" className={this.props.state.containerState}>
                    <div className="player-control">
                        <div id="previous-button" title="Previous" onClick={evt=>this.props.state.backward()} className={(this.trackChangeBtnClassName(false))}><i className="fa fa-fast-backward"/></div>
                        <div id="play-button" title="Play" onClick={evt => this.props.state.play()}><i className="fa fa-play"/></div>
                        <div id="pause-button" title="Pause" onClick={evt => this.props.state.pause()}><i className="fa fa-pause"/></div>
                        <div id="stop-button" title="Stop" onClick={evt=>this.props.state.stop()}><i className="fa fa-stop"/></div>
                        <div id="next-button" title="Next" onClick={evt=>this.props.state.forward()} className={(this.trackChangeBtnClassName(true))}><i className="fa fa-fast-forward"/></div>
                        <div id="mute-button" title="Toggle mute" onClick={evt=>this.props.state.toggleMute()}><i className="fa fa-volume-off"></i></div>
                        <div id="volume-down-button" title="Volume Down" onClick={evt => this.props.state.decreaseVolume()}><i className="fa fa-volume-down"/></div>
                        <div id="volume-up-button" title="Volume Up" onClick={evt => this.props.state.increaseVolume()}><i className="fa fa-volume-up"/></div>
                        <div id="library-button" title="Library"><i className="fa fa-book" style={{ color: (this.props.state.libraryModeEnabled) ? "lightblue" : ""}} onClick={evt => this.props.state.toggleLibraryMode()} /></div>
                        <div id="follow-button" title="Follow"><strong style={{ color: (this.props.state.followModeEnabled) ? "lightblue" : ""}} onClick={evt => this.props.state.toggleFollowMode()}>F</strong></div>
                        <div id="settings-button" title="Settings" onClick={evt=>this.openSettingsDialog()}><i className="fa fa-cog"/></div>
                    </div>
                </div>
            </div>
        );
    }

    private toggleLibraryMode(event: React.MouseEvent<HTMLElement>): void {
        let color = event.currentTarget.style.color;
        if (color == "")
            color = "lightblue";
        else
            color = "";
        event.currentTarget.style.color = color;
        // TODO fix that
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
            if (this.props.state.settings.length > 0) {
                let enableScrobblingSetting = this.props.state.settings.find((setting, index, obj) => { return setting._id == EnableScrobblingSetting }) as Setting<boolean>;
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
            // var enableScrobblingSetting = this.settings.find((setting, index, obj) => { return setting._id == EnableScrobblingSetting }) as Setting<boolean>;
            // if (enableScrobblingSetting && enableScrobblingSetting.Value) { 
            //     this.props.db.get(`${PlaylistIdPrefix}All`).then((response) => {
            //         let list = response as Playlist;
            //         if (list != null) {
            //             this.props.db.get(list.Tracks[this.state.currentIndex]._id).then(value => {
            //                 let track = value as Track;
            //                 let map = new Map<string,string>();
            //                 map.set("album", track.album);
            //                 map.set("artist", track.artist);
            //                 map.set("method", "track.scrobble");
            //                 map.set("timestamp", this.trackStartPlaybackTimestamp.toString());
            //                 map.set("track", track.title);
            //                 if (this.lastFMHelper) {
            //                     this.lastFMHelper.startRequest(map, true);
            //                 }
            //             });
            //         }
            //     });
            // }
            // this.trackDurationHalf = -1;
        }

    }
}