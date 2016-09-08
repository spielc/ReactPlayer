import * as React from "react";
import * as ReactDOM from "react-dom";
import PouchDB = require("pouchdb-browser");

import { PlayerComponent } from "./components/PlayerComponent";
import { PlaylistComponent } from "./components/PlaylistComponent";

var db = new PouchDB("ReactPlayerDB");

ReactDOM.render(<PlaylistComponent db={db} />, document.getElementById("playlist"));
ReactDOM.render(<PlayerComponent db={db} />, document.getElementById("player"));