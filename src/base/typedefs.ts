import PouchDB = require("pouchdb-browser");
import {Track} from "./track";
import {Playlist} from "./playlist";
import {Setting} from "./setting";

export type ReactPlayerDB = PouchDB.Database<Track | Playlist | Setting<any>>;