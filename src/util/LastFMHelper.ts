import {request, RequestOptions} from "http";
import md5 = require("md5");

export class LastFMHelper {

    constructor(private apiKey: string, private sessionKey: string) {

    }

    public startRequest(requestParams: Map<string, string>, sign: boolean): void {
        requestParams.set("api_key", this.apiKey);
        requestParams.set("sk", this.sessionKey);
        requestParams = this.toSortedMap(requestParams);
        if (sign) {
            let signature = this.sign(requestParams);
            requestParams.set("api_sig", signature);
        }
        requestParams.set("format", "json");
        let reqParams = "";
        for(let entry of requestParams) {
            reqParams += `${entry[0]}=${entry[1]}&`;
        }
        reqParams=reqParams.substr(0, reqParams.lastIndexOf("&"));

        let reqOptions: RequestOptions = {
            protocol: "http:",
            method: "POST",
            host: "ws.audioscrobbler.com",
            port: 80,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
            },
            path: "/2.0/"
        }
        let promise = new Promise((resolve, reject) => {
            let req = request(reqOptions, response => {
            response.addListener("data", chunk => {
                    let buf = chunk as Buffer;
                    let res = String.fromCharCode.apply(null, buf);
                    let i = 0;
                    resolve(JSON.parse(res));
                });
            });
            req.addListener("error", err => {
                reject(err);
            });
            req.write(requestParams);
            req.end();
        });
        let req = request(reqOptions, response => {
            response.addListener("data", chunk => {
                let buf = chunk as Buffer;
                let res = String.fromCharCode.apply(null, buf);
                let i = 0;
            });
        });
        req.addListener("error", err => {
            let i = 0;
        });
        req.write(requestParams);
        req.end();
    }

    private sign(map: Map<string, string>): string {
        let retValue = "";
        for(let entry of map) {
            retValue += entry[0] + entry[1];
        }
        retValue += "66717d5c66601f8f7789cd9f93444252";
        return md5(retValue);
    }

    private toSortedMap<K, V>(map: Map<K, V>): Map<K, V> {
        let retValue = new Map<K, V>();
        let keys: K[] = [];
        for (let key of map.keys())
            keys.push(key);
        keys.sort();
        for (let key of keys) 
            retValue.set(key, map.get(key));
        return retValue;
    }
}