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

export function TrackComponent(props: TrackComponentProperties): JSX.Element {
    var content: any = "";
    if (props.value != "actions")
        content = props.value;
    else
        // TODO re-implement select event...
        content = <div><i className="fa fa-play fa-lg" onClick={evt => trackChanged(props.db, props.trackIdx)}/> <i className="fa fa-bookmark-o fa-lg" onClick={evt => trackSelected(props.db)}/> <i className="fa fa-trash fa-lg" onClick={evt => trackDeleted(props.db, props.trackIdx)}/></div>;
    return <div>{content}</div>;
}

function trackSelected(db: ReactPlayerDB): void {
    db.get(CurrentPlaylistSetting).then(response => {
        let setting = response as Setting<string>;
        db.get(setting.Value).then(res => {
        });
    });
}

function trackChanged(db: ReactPlayerDB, trackIdx: number): void {
    db.get(CurrentSongIndexSetting).then(response => {
        let setting = response as Setting<number>;
        setting.Value = trackIdx;
        db.put(setting);
    })
}

function trackDeleted(db: ReactPlayerDB, trackIdx: number): void {
    db.get(CurrentPlaylistSetting).then(response => {
        let setting = response as Setting<string>;
        db.get(setting.Value).then(res => {
            let playlist = res as Playlist;
            playlist.Tracks.splice(trackIdx, 1);
            db.put(playlist).then(re => {
                db.get(CurrentSongIndexSetting).then(r => {
                    let s = r as Setting<number>;
                    if (s.Value > trackIdx) {
                        s.Value -= 1;
                        db.put(s);
                    }
                });
            });
            
        });
    });
}