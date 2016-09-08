import {Track} from "./track";
import {DocumentType} from "./enums"

export interface Playlist {
    _id: string;
    Tracks: Track[];
    DocType: DocumentType;   
}

/*export class Playlist {

    private tracks: Track[];

    public constructor(public _id: string) {
        this.tracks = [];
    }

    public addTrack(track: Track): void {
        this.tracks.push(track);
    }

}*/