import ID3 = require("id3-parser");

export interface Track extends ID3.Tag {
    _id : string;
    playlists : string[];
}