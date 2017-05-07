import * as React from "react";
import * as ReactDOM from "react-dom";
import PouchDB = require("pouchdb-browser");

import {SettingsComponent} from "./components/SettingsComponent";

var db = new PouchDB("ReactPlayerDB");

ReactDOM.render(<SettingsComponent db={db} />, document.getElementById("settings"));