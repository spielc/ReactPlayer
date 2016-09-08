export class Setting {
    constructor(private _id: string, public value: string) {

    }
}

export class Settings {

    private settings: Setting[];
    //public const _id: string = "80dd63bfe3648f5755a1d3b1b1c7efd1";

    constructor() {
        this.settings = [];
    }

    //public GetSetting()

}