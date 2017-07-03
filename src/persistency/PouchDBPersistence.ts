import { IValueDidChange } from "mobx";

import { Persistence, ChangeType } from "../base/persistence";
import { Setting } from "../base/setting";
import { Track } from "../base/track";
import { Playlist } from "../base/playlist";
import { DocumentType } from "../base/enums";
import { ReactPlayerDB, CurrentPlaylistSetting, PlaylistIdPrefix, CurrentSongIndexSetting, SettingIdPrefix } from "../base/typedefs";

type PersistedObject = Setting<any> | Track | Playlist;

export class PouchDBPersistence implements Persistence {
    
    private prevPromise: Promise<any>;
    
    constructor(private db: ReactPlayerDB) {
        this.prevPromise = Promise.resolve();
    }

    init(): Promise<any> {
        let promise = new Promise((resolve, reject) => this.db.info().then(info => {
            if (info.doc_count === 0) {
                // empty database => initialize it...
                let data: (Track | Playlist | Setting<any>)[] = [];
                let currentPlaylistSetting: Setting<string> = {
                    _id: CurrentPlaylistSetting,
                    Value: `${PlaylistIdPrefix}All`,
                    DocType: DocumentType.Setting,
                    IsVisible: false
                }
                data.push(currentPlaylistSetting);
                let currentSongIndexSetting: Setting<number> = {
                    _id: CurrentSongIndexSetting,
                    Value: 0,
                    DocType: DocumentType.Setting,
                    IsVisible: false
                }
                data.push(currentSongIndexSetting);
                let library: Playlist = {
                    _id: `${PlaylistIdPrefix}All`,
                    Tracks: [],
                    DocType: DocumentType.Playlist
                }
                data.push(library);
                this.db.bulkDocs(data).then(result => resolve());
            }
            else
                resolve();
        }));
        return promise;
    }

    private persist(obj: PersistedObject, type: ChangeType): void {
        this.prevPromise = this.prevPromise.then(() => new Promise((resolve, reject) => {
            console.log(`${type}: ${obj._id}`) ;
            switch(type) {
                case "remove":
                case "update":
                    this.db.get(obj._id).then(doc => {
                        if (type === "update") {
                            this.db.put({...obj, _rev: doc._rev}).then(res => {
                                resolve();
                            },
                            error => {
                                console.log(`Updating the db FAILED: ${error}`);
                                reject();
                            });
                        }
                        else {
                            this.db.remove({...obj, _rev: doc._rev}).then(res => {
                                resolve();
                            },
                            error => {
                                console.log(`Deleting from the db FAILED: ${error}`);
                                reject();
                            });
                        }
                        
                    });
                    break;
                case "add":
                    this.db.put(obj).then(res => {
                        resolve();
                    },
                    error => {
                        console.log(`Updating the db FAILED: ${error}`);
                        reject();
                    });
                    break;
                default:
                    console.log(`Unknown ChangeType '${type}'`);
                    reject();
            }
        }));
               
    }

    persistSetting(setting: Setting<any>, type: ChangeType): void {
        this.persist(setting, type);
    }
    persistTrack(track: Track, type: ChangeType): void {
        this.persist(track, type);
    }
    persistPlaylist(playlist: Playlist, type: ChangeType): void {
        this.persist(playlist, type);
    }

    getPlaylists(): Promise<Playlist[]> {
        return new Promise<Playlist[]>((resolve, reject) => {
            let selectOptions: PouchDB.Core.AllDocsWithinRangeOptions = {
                include_docs: true,
                startkey: PlaylistIdPrefix,
                endkey: `${PlaylistIdPrefix}\uffff`
            };
            this.db.allDocs(selectOptions).then(result => resolve(result.rows.map(row => row.doc).map(doc => doc as Playlist)),
            reason => reject(reason));
        });
    }
    
    getSettings(): Promise<Setting<any>[]> {
        return new Promise<Setting<any>[]>((resolve, reject) => {
            let selectOptions: PouchDB.Core.AllDocsWithinRangeOptions = {
                include_docs: true,
                startkey: SettingIdPrefix,
                endkey: `${SettingIdPrefix}\uffff`
            };
            this.db.allDocs(selectOptions).then(result => resolve(result.rows.map(row => row.doc).map(doc => doc as Setting<any>)),
            reason => reject(reason));
        });
    }

}