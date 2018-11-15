import * as React from "react";
import * as ReactDOM from "react-dom";
import PouchDB = require("pouchdb-browser");

import {SettingsComponent} from "./components/SettingsComponent";
import { PouchDBPersistence } from "./persistency/PouchDBPersistence";
import { AppState } from "./base/appstate";
import { Track } from "./base/track";
import { Playlist } from "./base/playlist";
import { Setting } from "./base/setting";

var db = new PouchDB<Track | Playlist | Setting<any>>("ReactPlayerDB", {auto_compaction: true});
var persistence = new PouchDBPersistence(db);

var state = new AppState(persistence);

ReactDOM.render(<SettingsComponent state={state} />, document.getElementById("settings"));