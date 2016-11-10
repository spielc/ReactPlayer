import React = require("react");
import ReactDOM = require("react-dom");
import WaveSurfer from "react-wavesurfer";

import {PlayerState} from "../base/enums";
import {Track} from "../base/track";
import {Playlist} from "../base/playlist";
import {ReactPlayerDB} from "../base/typedefs";

export interface PlayerComponentProperties {
    db : ReactPlayerDB;
}

interface PlayerComponentState {
    state: PlayerState[];
    containerState: string;
    currentFile: Blob[];
    currentPos: number[];
    currentIndex: number;
    currentVolume: number;
}

interface WaveSurferEventParams {
        wavesurfer: any;
        originalArgs: any[];
    }

export class PlayerComponent extends React.Component<PlayerComponentProperties, PlayerComponentState> {

    private waveSurfer: WaveSurfer[];
    //private playlist: string[];
    private oldVolume: number;

    constructor(props: PlayerComponentProperties, context?: any) {
        super(props, context);
        /*this.playlist=["", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/01- Intro.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/02- Her Voice Resides.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/03- 4 Words (To Choke Upon).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/04- Tears Don`t Fall.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/05- Suffocating Under Words Of Sorrow (What Can I Do).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/06- Hit The Floor.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/07- All These Things I Hate (Revolve Around Me).mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/08- Hand Of Blood.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/09- Room 409.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/10- The Poison.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/11- 10 Years Today.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/12- Cries In Vain.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/13- Spit You Out.mp3", "/home/christoph/music/Bullet For My Valentine/Bullet For My Valentine - The Poison (2005)/14- The End.mp3", ""];*/
        this.state= { state : [PlayerState.Loaded, PlayerState.Loaded, PlayerState.Loaded], containerState : "disabled", currentFile : [], currentPos : [0, 0, 0], currentIndex : 1, currentVolume : 0.5 };
        this.waveSurfer=[];
        // TODO we have to get this using pubsub-event
        this.props.db.get("All").then((response) => {
            var list = response as Playlist;
            if (list != null) {
                var files: Blob[] = [];
                files.push(new Blob());
                var keys: string[] = [list.Tracks[0]._id, list.Tracks[1]._id];
                this.props.db.allDocs({ attachments: true, include_docs: true, keys: keys }).then((response) => {
                    response.rows.forEach((value) => {
                        var doc = value.doc as Track;
                        var data = doc._attachments["attachmentId"].data as any;
                        var base64Data = data as string;
                        //console.log(attachment);
                        var file = this.base64ToBlob(base64Data);
                        files.push(file);
                    });
                    this.setState({
                        state: this.state.state,
                        containerState: this.state.containerState,
                        currentFile: files,
                        currentPos: this.state.currentPos,
                        currentIndex: this.state.currentIndex,
                        currentVolume: this.state.currentVolume
                    });
                });
            }
        });
    }

    public render(): JSX.Element {
        console.log(this.state.currentIndex);
        return (
            <div>
                <div hidden={(this.state.currentIndex % 3) != 0}>
                    <WaveSurfer audioFile={this.state.currentFile[0]} playing={this.state.state[0]==PlayerState.Playing} pos={0} volume={this.state.currentVolume} onReady={()=>this.onReady()} onFinish={(evt)=>this.trackChange(true)} onPosChange={(evt)=>this.posChange(evt)} ref={(r) => { this.waveSurfer[0]=r } } />
                </div>
                <div hidden={(this.state.currentIndex % 3) != 1}>
                    <WaveSurfer audioFile={this.state.currentFile[1]} playing={this.state.state[1]==PlayerState.Playing} pos={0} volume={this.state.currentVolume} onReady={()=>this.onReady()} onFinish={(evt)=>this.trackChange(true)} onPosChange={(evt)=>this.posChange(evt)} ref={(r) => { this.waveSurfer[1]=r } } />
                </div>
                <div hidden={(this.state.currentIndex % 3) != 2}>
                    <WaveSurfer audioFile={this.state.currentFile[2]} playing={this.state.state[2]==PlayerState.Playing} pos={0} volume={this.state.currentVolume} onReady={()=>this.onReady()} onFinish={(evt)=>this.trackChange(true)} onPosChange={(evt)=>this.posChange(evt)} ref={(r) => { this.waveSurfer[2]=r } } />
                </div>
                <div id="container" className={this.state.containerState}>
                    <div className="player-control">
                        <div id="previous-button" title="Previous" onClick={evt=>this.trackChange(false)}><i className="fa fa-fast-backward"></i></div>
                        <div id="play-button" title="Play" onClick={evt=>{this.setState({state: [PlayerState.Loaded, PlayerState.Playing, PlayerState.Loaded], containerState: "enabled", currentFile: this.state.currentFile, currentPos: this.state.currentPos, currentIndex: this.state.currentIndex, currentVolume: this.state.currentVolume});}}><i className="fa fa-play"></i></div>
                        <div id="pause-button" title="Pause" onClick={evt=>{this.setState({state: [PlayerState.Loaded, PlayerState.Paused, PlayerState.Loaded], containerState: "enabled", currentFile: this.state.currentFile, currentPos: this.state.currentPos, currentIndex: this.state.currentIndex, currentVolume: this.state.currentVolume });}}><i className="fa fa-pause"></i></div>
                        <div id="stop-button" title="Stop" onClick={evt=>this.stopButtonClicked(evt)}><i className="fa fa-stop"></i></div>
                        <div id="next-button" title="Next" onClick={evt=>this.trackChange(true)}><i className="fa fa-fast-forward"></i></div>
                        <div id="mute-button" title="Toggle mute" onClick={evt=>{}}><i className="fa fa-volume-off"></i></div>
                        <div id="volume-down-button" title="Volume Down" onClick={evt=>this.volumeChange(false)}><i className="fa fa-volume-down"></i></div>
                        <div id="volume-up-button" title="Volume Up" onClick={evt=>this.volumeChange(true)}><i className="fa fa-volume-up"></i></div>
                    </div>
                </div>
            </div>
            );
    }

    private posChange(event: WaveSurferEventParams): void {
        var pos = Math.floor(event.originalArgs[0]);
        if (pos == 0) {
            event.wavesurfer.drawBuffer();
        }
    }

    private base64ToBlob(base64EncodedData: string) : Blob {
        var decodedData = atob(base64EncodedData);
        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(decodedData.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < decodedData.length; i++) {
            ia[i] = decodedData.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        //var bb = new Blob([ab]);
        var bb = new Blob([ab]);
        return bb;
    }

    private stopButtonClicked(evt: React.MouseEvent): void {
        var currentPos=this.state.currentIndex % this.state.currentFile.length;
        this.waveSurfer[currentPos].props.pos = 0;
        this.state.state[currentPos] = PlayerState.Stopped;
        this.setState({state: this.state.state, containerState: this.state.containerState, currentFile: this.state.currentFile, currentPos: this.state.currentPos, currentIndex: this.state.currentIndex, currentVolume: this.state.currentVolume});
    }

    private volumeChange(isIncrease: boolean): void {
        const volumeChangeValue = (isIncrease) ? 0.1 : -0.1;
        var newVolume = this.state.currentVolume + volumeChangeValue;
        this.setState({state: this.state.state, containerState: this.state.containerState, currentFile: this.state.currentFile, currentPos: this.state.currentPos, currentIndex: this.state.currentIndex, currentVolume: newVolume});
    }

    private trackChange(isForward: boolean): void {
        var changeValue = (isForward) ? 1 : -1;
        var newIndex = this.state.currentIndex + changeValue;
        var loadIndex = (newIndex - changeValue) % this.state.currentFile.length;
        var playIndex = newIndex % this.state.currentFile.length;
        var insertIndex = (newIndex + changeValue) % this.state.currentFile.length;
        var trackToInsertIndex = newIndex + changeValue;
        //this.state.currentFile[insertIndex] = this.playlist[trackToInsertIndex];
        this.state.state[playIndex] = PlayerState.Playing;
        this.state.state[loadIndex] = PlayerState.Loaded;
        this.setState({state: this.state.state, containerState: this.state.containerState, currentFile: this.state.currentFile, currentPos: this.state.currentPos, currentIndex: newIndex, currentVolume: this.state.currentVolume});
    }

    private onReady(): void {
        this.state.currentPos[this.state.currentIndex % this.state.currentFile.length] = 10;
        switch(this.state.state[this.state.currentIndex]) {
            case PlayerState.Loaded:
                this.state.state[this.state.currentIndex] = PlayerState.Ready;
                break;
            case PlayerState.Forward:
                this.state.state[this.state.currentIndex] = PlayerState.Playing;
                break;
        }
        this.setState({state: this.state.state, containerState: "enabled", currentFile: this.state.currentFile, currentPos: this.state.currentPos, currentIndex: this.state.currentIndex, currentVolume: this.state.currentVolume});
    }
}