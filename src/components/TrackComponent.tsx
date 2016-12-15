import * as React from "react";
import * as PubSub from "pubsub-js";

import {Track} from "../base/track";
import {ReactPlayerDB, PlaylistMessage_TrackChanged, PlaylistMessage_TrackRemoved} from "../base/typedefs";

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
            content = <div><i className="fa fa-play fa-lg" onClick={evt => PubSub.publish(PlaylistMessage_TrackChanged, this.props.trackIdx)}/> <i className="fa fa-bookmark-o fa-lg"/> <i className="fa fa-trash fa-lg" onClick={evt => PubSub.publish(PlaylistMessage_TrackRemoved, this.props.trackIdx)}/></div>;
        return <div>{content}</div>;
    }

}