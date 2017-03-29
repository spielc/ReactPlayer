import * as ID3 from "id3-parser";
//import PouchDB = require("pouchdb-browser");

import {DocumentType} from "./enums";

export interface Track extends ID3.Tag {
    _id: string;
    path: string;
    DocType: DocumentType;
}