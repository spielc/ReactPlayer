import {DocumentType} from "./enums"

export class Setting<T> {
    _id: string;
    Value: T;
    DocType: DocumentType.Setting;

    constructor(readonly IsVisible = false) {
        
    }

}
