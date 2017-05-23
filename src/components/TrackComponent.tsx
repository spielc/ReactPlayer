import * as React from "react";

import {Track} from "../base/track";
import {Setting} from "../base/setting";
import {ReactPlayerDB, CurrentSongIndexSetting} from "../base/typedefs";

export interface TrackComponentProperties {
    db : ReactPlayerDB,
    trackIdx: number,
    value: string
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
            content = <div><i className="fa fa-play fa-lg" onClick={evt => this.trackChanged()}/> <i className="fa fa-bookmark-o fa-lg"/> <i className="fa fa-trash fa-lg" onClick={evt => this.trackDeleted()}/></div>;
        return <div>{content}</div>;
    }

    private trackChanged():void {
        this.props.db.get(CurrentSongIndexSetting).then(response => {
            let setting = response as Setting<number>;
            setting.Value = this.props.trackIdx;
            this.props.db.put(setting);
        })
    }

    private trackDeleted(): void {
        // TODO get the current playlist and remove the track with idx from the list of tracks
    }

}