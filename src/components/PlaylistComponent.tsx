import * as React from "react";
import * as ReactDOM from "react-dom";
import ReactTable from "react-table";
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

@observer
export class PlaylistComponent extends React.Component<PlaylistComponentProperties> {
    
    private tokens: any[];
    private dropZone: HTMLDivElement;
    private playlistName: HTMLInputElement;
    private playlistSelector: HTMLSelectElement;
    private displayedColumns: string[];
    private playlistTable: ReactTable<Track>;
    private pageSize: number;

    constructor(props: PlaylistComponentProperties, context?: any) {
        super(props, context);

        this.displayedColumns = ["indicator","title", "album", "artist", "actions"];
        this.pageSize = -1;
    }

    private dropZoneDrop(event: React.DragEvent<HTMLDivElement>): void {
        event.stopPropagation();
	    event.preventDefault();
        var files = event.dataTransfer.files;
        for (var i=0;i<files.length;i++) {
            var file = files.item(i);
            this.props.state.addTrack(file);
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

    private currentPage(): number {
        if (this.playlistTable) {
            if (this.pageSize<0) {
                this.pageSize = this.playlistTable.props.defaultPageSize;
            }
            let currentPage = Math.trunc(this.props.state.currentIndex / this.pageSize);
            if (currentPage<0)
                currentPage = 0;
            return currentPage;
        }
        return 0;
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
        // window.document.removeEventListener("dragover");
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
                actions:  <div><i className="fa fa-play fa-lg" onClick={evt => this.props.state.play(index)}/> <i className="fa fa-bookmark fa-lg" onClick={evt => this.props.state.select(index)}/> <i className="fa fa-trash fa-lg" onClick={evt => this.props.state.removeTrack(index)}/></div>,
                indicator: <div hidden={(!isSelected && (!this.props.state.isPlaying || index != this.props.state.currentIndex))}><i className="fa fa-play fa-lg" style={{ color: (isSelected) ? "lightblue" : "red" }}/></div>
            };
        });

        let cols = this.displayedColumns.map(col => {
            let retValue = {
                Header: col,
                accessor: col,
                width: screen.availWidth / this.displayedColumns.length,
                filterable: true
            };
            if (col === 'indicator') {
                let actRetValue = {
                    ...retValue,
                    Cell: (props: any) => {
                        let isSelected = this.props.state.selection.find(sel => sel === this.props.state.playlist[props.index]._id) !== undefined;
                        return <div hidden={(!isSelected && (!this.props.state.isPlaying || props.index != this.props.state.currentIndex))}><i className="fa fa-play fa-lg" style={{ color: (isSelected) ? "lightblue" : "red" }}/></div>
                    }
                }
                actRetValue.Header = '';
                actRetValue.width = 30;
                actRetValue.filterable = false;
                return actRetValue;
            }
            else if (col === 'actions') {
                let actRetValue = {
                    ...retValue,
                    Cell: (props: any) => <div><i className='fa fa-play fa-lg' onClick={evt => this.props.state.play(props.index)}/> <i className='fa fa-bookmark fa-lg' onClick={evt => this.props.state.select(props.index)}/> <i className='fa fa-trash fa-lg' onClick={evt => this.props.state.removeTrack(props.index)}/></div>,
                    Footer: <div><i className='fa fa-clipboard fa-lg' onClick={evt => this.props.state.copyPaste()}/><i className='fa fa-bookmark fa-lg' onClick={evt => this.props.state.selectAll()}/><i className='fa fa-trash fa-lg' onClick={evt => this.props.state.clearPlaylist()}/></div>
                }
                actRetValue.width = 100;
                actRetValue.filterable = false;
                return actRetValue;
            }
            else {
                switch (col) {
                    case 'title':
                        return {
                            ...retValue,
                            Footer: <div title='Load persisted playlist...'><select ref={r => this.playlistSelector = r}>{playlists}</select>&nbsp;<i className='fa fa-folder-open' onClick={evt => this.props.state.switchPlaylist(this.playlistSelector.value)}/></div>
                        }
                    case 'album':
                        return {
                            ...retValue,
                            Footer: <div hidden={false} title='Create new playlist...'><input type='text' ref={r => this.playlistName = r}/>&nbsp;<i className='fa fa-file' onClick={evt => this.props.state.addPlaylist(this.playlistName.value)}/></div>
                        }
                    case 'artist':
                        return {
                            ...retValue,
                            Footer: <div hidden={false} title='Shuffle' onClick={(evt) => this.props.state.shufflePlaylist()}><i className='fa fa-random'/></div>
                        }
                }
            }
            return retValue;
        });

        return (
            <div>
                {dropZone}
                <ReactTable data={this.props.state.playlist} columns={cols} ref={r => this.playlistTable = r} page={(this.props.state.followModeEnabled) ? this.currentPage() : undefined} onPageSizeChange={(pageSize, pageIndex) => this.pageSize = pageSize}/>;
            </div>
        );
    }
}
