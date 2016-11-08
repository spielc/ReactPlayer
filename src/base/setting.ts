import {DocumentType} from "./enums"

export interface Setting<T> {
    _id: string;
    Value: T;
    DocType: DocumentType.Setting;  
}
