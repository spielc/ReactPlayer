// import ID3 = require("id3-parser");
import PouchDB = require("pouchdb-browser");

import {DocumentType} from "./enums";

export interface Attachment {
    type: string,
    data: Blob
}

export interface Attachments {
    [attachmentId: string]: Attachment;
}

export interface Track {//extends ID3.Tag {
    _id: string;
    _attachments: Attachments;
    DocType: DocumentType; 
}