import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Reactable from "reactable";
import { observer } from "mobx-react";

import {Track} from "../base/track";
import {Playlist} from "../base/playlist";
import {Setting} from "../base/setting";
import { PlayerMessageType, PlayerMessageTypes_Forward, PlayerMessageTypes_Backward, PlayerMessageTypes, ReactPlayerDB, CurrentSongIndexSetting, PlaybackStateSetting, LibraryModeEnabledSetting, PlayerMessageTypes_Play, PlaylistMessageType, PlaylistMessageTypes, PlaylistMessage_TrackChanged, PlaylistMessage_TrackRemoved, PlaylistMessage_Changed, PlaylistIdPrefix, CurrentPlaylistSetting } from "../base/typedefs";
import {DocumentType, PlayerState} from "../base/enums";
import {shuffle} from "../base/util";
import {TrackComponent} from "./TrackComponent";
import {ComponentWithSettings, ComponentWithSettingsProperties} from "./ComponentWithSettings";
import { AppState } from "../base/appstate";


interface PlaylistComponentProperties {
    state: AppState
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

@observer
export class PlaylistComponent extends React.Component<PlaylistComponentProperties> {
    
    private tokens: any[];
    private dropZone: HTMLDivElement;
    private playlistName: HTMLInputElement;
    private playlistSelector: HTMLSelectElement;
    private displayedColumns: string[];

    constructor(props: PlaylistComponentProperties, context?: any) {
        super(props, context);

        this.displayedColumns = ["indicator","title", "album", "artist", "actions"];
    }

    private dropZoneDrop(event: React.DragEvent<HTMLDivElement>): void {
        event.stopPropagation();
	    event.preventDefault();
        var files = event.dataTransfer.files;
        for (var i=0;i<files.length;i++) {
            var file = files.item(i);
            this.props.state.addTrack(file);
            // this.handleFile(file);
            // var reader = new FileReader();
            // reader.onload = (event) => {
            //     var fileReader=event.target as FileReader;
            //     var data = fileReader.result as ArrayBuffer;
            //     var dataBuffer = new Uint8Array(data);
            //     this.props.state.addTrack(file.path, dataBuffer);
            // };
            // reader.readAsArrayBuffer(file);
            
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

    public componentDidMount() : void {
        window.document.addEventListener("dragover", (event) => {
            event.stopPropagation();
            event.preventDefault();
            if (this.dropZone)
                this.dropZone.className = "";
        }, false);

        window.document.addEventListener("drop", (event) => {
            event.stopPropagation();
            event.preventDefault();
            //this.dropZone.className = "";
        }, false);
    }

    public componentWillUnmount() : void {
        // this.tokens.forEach(token => PubSub.unsubscribe(token));
        window.document.removeEventListener("dragover");
    }

    public render(): JSX.Element {
        let playlists = this.props.state.playlistNames.map(playlist => <option value={playlist}>{playlist.replace(PlaylistIdPrefix, "")}</option>);

        let dropZone = <div />;
        if (this.props.state.libraryModeEnabled) {
            dropZone = <div hidden={false} id="drop-zone" className="hidden" ref={r => this.dropZone = r} onDragLeave={evt => this.dropZoneDragLeave(evt)} onDragOver={evt => this.dropZoneDragOver(evt)} onDrop={evt => this.dropZoneDrop(evt)}>Drag &amp; Drop Files Here</div>;
        }

        let data = this.props.state.playlist.map(track => {
            let index = this.props.state.playlist.indexOf(track);
            let isSelected = this.props.state.selection.find(sel => sel === track._id) !== undefined;
            return { 
                ...track,
                actions:  <div><i className="fa fa-play fa-lg" onClick={evt => this.props.state.play(index)}/> <i className="fa fa-bookmark-o fa-lg" onClick={evt => this.props.state.select(index)}/> <i className="fa fa-trash fa-lg" onClick={evt => this.props.state.removeTrack(index)}/></div>,
                indicator: <div hidden={(!isSelected && (!this.props.state.isPlaying || index != this.props.state.currentIndex))}><i className="fa fa-play fa-lg" style={{ color: (isSelected) ? "lightblue" : "red" }}/></div>
            };
        });

        let columns: JSX.Element[] = [];
        for(var colName of this.displayedColumns) {
            let col = <PlaylistTableTh column={colName} key={colName}>
                        <strong className="name-header">{colName}</strong>
                      </PlaylistTableTh>;
            if (colName === "indicator") {
                col = <PlaylistTableTh column="indicator" key="indicator">
                        <strong className="name-header"><i className="fa fa-play fa-lg"/></strong>
                      </PlaylistTableTh>;
            }
            else if (colName === "actions") {
                col = <PlaylistTableTh column="actions" key="actions">
                        <strong className="name-header">actions</strong>
                      </PlaylistTableTh>;
            }
            columns.push(col);
        }
        return (
            <div>
                {dropZone}
                <PlaylistTable id="demo-table" columns={this.displayedColumns} filterable={this.displayedColumns} data={data} filterBy={this.props.state.filterText} onFilter={value => this.props.state.filterText = value}>
                    <PlaylistTableHeader>
                        {columns}
                    </PlaylistTableHeader>
                    <PlaylistTableTfoot>
                        <tr className="reactable-footer">
                            <td/>
                            <td><div title="Load persisted playlist..."><select ref={r => this.playlistSelector = r}>{playlists}</select>&nbsp;<i className="fa fa-folder-open" onClick={evt => this.props.state.switchPlaylist(this.playlistSelector.value)}/></div></td>
                            <td><div hidden={false} title="Create new playlist..."><input type="text" ref={r => this.playlistName = r}/>&nbsp;<i className="fa fa-file" onClick={evt => this.props.state.addPlaylist(this.playlistName.value)}/></div></td>
                            <td><div hidden={false} title="Shuffle" onClick={(evt) => this.props.state.shufflePlaylist()}><i className="fa fa-random"/></div></td>
                            <td><div><i className="fa fa-clipboard fa-lg" onClick={evt => this.props.state.copyPaste()}/><i className="fa fa-bookmark-o fa-lg" onClick={evt => this.props.state.selectAll()}/><i className="fa fa-trash fa-lg" onClick={evt => this.props.state.clearPlaylist()}/></div></td>
                        </tr>
                    </PlaylistTableTfoot>
                </PlaylistTable>
            </div>
        );
    }
}
