// import * as ID3 from "id3-parser";
//import PouchDB = require("pouchdb-browser");

import {DocumentType} from "./enums";
import { IID3Tag } from "id3-parser/lib/interface";

export interface Track extends IID3Tag {
    _id: string;
    path: string;
    DocType: DocumentType;
    [idx: string]: any;
}