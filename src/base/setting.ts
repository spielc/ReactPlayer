import {DocumentType} from "./enums"

export class Setting<T> {

    public DocType: DocumentType;

    constructor(public _id: string, public value: T) {
        this.DocType = DocumentType.Setting; 
    }
}
