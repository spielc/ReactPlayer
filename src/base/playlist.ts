import {Track} from "./track";

type ViewFunc = (doc: Track) => void;

export interface View {
    map: string; 
}

export interface Views {
    [name: string]: View; 
}

export class Playlist {

    get _id(): string {
        return "_design/" + this.name;
    }

    get views(): Views {
        //var func: ViewFunc = (doc) => { emit(doc); };
        var view: View = {
            map: function(doc: Track | Playlist) { 
                var emit: (data: any) => { };
                emit(doc); 
            }.toString()
        };
        var views: Views = {};
        views[this.name] = view;
        return views;
    }

    constructor(private name: string) {

    }
}