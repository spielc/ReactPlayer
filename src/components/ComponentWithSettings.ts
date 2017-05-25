import * as React from "react";
import * as PouchDB from "pouchdb-browser";

import {ReactPlayerDB, SettingIdPrefix} from "../base/typedefs";
import {Setting} from "../base/setting";
import {Track} from "../base/track";
import {Playlist} from "../base/playlist";

export interface ComponentWithSettingsProperties {
    db : ReactPlayerDB;
}

export abstract class ComponentWithSettings<P extends ComponentWithSettingsProperties, S> extends React.Component<P, S> {
    protected settings: Setting<any>[];

    constructor(props: P, context?: any) {
        super(props, context);

        this.settings = [];

        var settingsSelectOptions: PouchDB.Core.AllDocsWithinRangeOptions = {
            include_docs: true,
            startkey: `${SettingIdPrefix}${this.constructor.name}.`,
            endkey: `${SettingIdPrefix}${this.constructor.name}.\uffff`
        } 

        this.props.db.allDocs(settingsSelectOptions).then(response => this.loadSettings(response));

        //TODO implement a common PouchDB-changes-handler for Settings<any>-objects

    }

    protected abstract loadSettings(response: PouchDB.Core.AllDocsResponse<Track | Playlist | Setting<any>>): void;
}