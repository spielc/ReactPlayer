import * as React from "react";

import {Playlist} from "../base/playlist";
import {Track} from "../base/track";
import {Setting} from "../base/setting";
import {ReactPlayerDB, CurrentSongIndexSetting, CurrentPlaylistSetting} from "../base/typedefs";

export interface TrackComponentProperties {
    db : ReactPlayerDB,
    trackIdx: number,
    value: string,
    libraryModeEnabled: boolean
}

export class TrackComponent extends React.Component<TrackComponentProperties, {}> {
    
    constructor(props: TrackComponentProperties, context?: any) {
        super(props, context);
    }

    public render(): JSX.Element {
        var content: any = "";
        if (this.props.value != "actions")
            content = this.props.value;
        else
            // TODO re-implement select event...
            content = <div><i className="fa fa-play fa-lg" onClick={evt => this.trackChanged()}/> <i className="fa fa-bookmark-o fa-lg" onClick={evt => this.trackSelected()}/> <i className="fa fa-trash fa-lg" onClick={evt => this.trackDeleted()}/></div>;
        return <div>{content}</div>;
    }

    private trackSelected(): void {
        this.props.db.get(CurrentPlaylistSetting).then(response => {
            let setting = response as Setting<string>;
            this.props.db.get(setting.Value).then(res => {
            });
        });
    }

    private trackChanged(): void {
        this.props.db.get(CurrentSongIndexSetting).then(response => {
            let setting = response as Setting<number>;
            setting.Value = this.props.trackIdx;
            this.props.db.put(setting);
        })
    }

    private trackDeleted(): void {
        this.props.db.get(CurrentPlaylistSetting).then(response => {
            let setting = response as Setting<string>;
            this.props.db.get(setting.Value).then(res => {
                let playlist = res as Playlist;
                playlist.Tracks.splice(this.props.trackIdx, 1);
                this.props.db.put(playlist).then(re => {
                    this.props.db.get(CurrentSongIndexSetting).then(r => {
                        let s = r as Setting<number>;
                        if (s.Value > this.props.trackIdx) {
                            s.Value -= 1;
                            this.props.db.put(s);
                        }
                    });
                });
                
            });
        });
    }

}