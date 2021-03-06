import * as React from "react";
import * as ReactDOM from "react-dom";
import PouchDB = require("pouchdb-browser");
//import {SvgContainer} from "./components/SvgContainer";
import {PlayerComponent} from "./components/PlayerComponent";
import {PlaylistComponent} from "./components/PlaylistComponent";
import {AppState} from "./base/appstate";
import { PouchDBPersistence } from "./persistency/PouchDBPersistence";
import { Track } from "./base/track";
import { Playlist } from "./base/playlist";
import { Setting } from "./base/setting";

var db = new PouchDB<Track | Playlist | Setting<any>>("ReactPlayerDB", {auto_compaction: true});
var persistence = new PouchDBPersistence(db);

var state = new AppState(persistence);

ReactDOM.render(<PlayerComponent state={state} />, document.getElementById("player"));
ReactDOM.render(<PlaylistComponent state={state} />, document.getElementById("playlist"));

//ReactDom.render(
//    <SvgContainer height={100} width={100}>
//        <rect height={50} width={50} x={25} y={25} fill="mediumorchid" stroke="crimson" strokeWidth={3}/>
//    </SvgContainer>,
//    document.getElementById("container"));
