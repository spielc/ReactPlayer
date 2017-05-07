import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Reactable from "reactable";

import {ipcRenderer} from "electron";

import {ReactPlayerDB, SettingsWindowName, WindowManagementMessage_RegisterHandler, WindowManagementMessage_LifeCycleEvent} from "../base/typedefs";
import {Setting} from "../base/setting";

const EnterKeyIdent = "Enter";

type SettingsTable = new () => Reactable.Table<Setting<any>>;
const SettingsTable = Reactable.Table as SettingsTable;

type SettingsTableHeader = new () => Reactable.Thead;
const SettingsTableHeader = Reactable.Thead as SettingsTableHeader;

type SettingsTableTh = new () => Reactable.Th;
const SettingsTableTh = Reactable.Th as SettingsTableTh;

type SettingsTableRow = new () => Reactable.Tr<Setting<any>>;
const SettingsTableRow = Reactable.Tr as SettingsTableRow;

type SettingsTableTd = new () => Reactable.Td;
const SettingsTableTd = Reactable.Td as SettingsTableTd;

interface SettingsComponentProperties {
    db: ReactPlayerDB
}

interface SettingsComponentState {
    settings: Setting<any>[];
}

export class SettingsComponent extends React.Component<SettingsComponentProperties, SettingsComponentState> {

    constructor(props: SettingsComponentProperties, context?: any) {
        super(props, context);

        this.state = {
            settings: []
        };       
    }

    public componentDidMount() : void {

        

        ipcRenderer.sendSync(WindowManagementMessage_RegisterHandler, {//windowDef);
            WindowId: SettingsWindowName,
            EventId: "show"
        });

        ipcRenderer.on(WindowManagementMessage_LifeCycleEvent, (event, args) => {
            let settingsSelectOptions: PouchDB.Core.AllDocsWithinRangeOptions = {
                include_docs: true,
                startkey: "Settings.",
                endkey: "Settings.\uffff"
            } 

            this.props.db.allDocs(settingsSelectOptions).then(response => {
                this.setState({
                    settings: response.rows.map(row => row.doc).map(doc => doc as Setting<any>).filter(setting => setting.IsVisible)
                });
                
                console.log(`this.settings.length=${this.state.settings.length}`);
            }); 
            
        });
    }

    public render(): JSX.Element {
        let rows: JSX.Element[] = [];
        for(let setting of this.state.settings) {
            rows.push(
                <SettingsTableRow>
                    <SettingsTableTd column="_id">{setting._id}</SettingsTableTd>
                    <SettingsTableTd column="Value">
                        <input name={setting._id} defaultValue={JSON.stringify(setting.Value)} onKeyDown={evt => this.keyDownEvent(evt)}/>
                    </SettingsTableTd>
                </SettingsTableRow>
            )
        }
        var columns: JSX.Element[] = [
            <SettingsTableTh column="_id" key="_id">
                <strong className="name-header">Name</strong>
            </SettingsTableTh>,
            <SettingsTableTh column="Value" key="Value">
                <strong className="name-header">Value</strong>
            </SettingsTableTh>
        ];
        return (
            <SettingsTable>
                <SettingsTableHeader>
                    {columns}
                </SettingsTableHeader>
                {rows}
            </SettingsTable>
        );
    }

    private keyDownEvent(event: React.KeyboardEvent<HTMLInputElement>): void {
        if (event.key === EnterKeyIdent) {
            try {
                let inputValue = JSON.parse(event.currentTarget.value);
                let currentSetting = this.state.settings.find(setting => setting._id == event.currentTarget.name);
                let currentValue = currentSetting.Value;
                if ((typeof inputValue === typeof currentValue) && inputValue != currentValue) {
                    currentSetting.Value = inputValue;
                    this.props.db.get(event.currentTarget.name).then(response => {
                        let setting = response as Setting<any>;
                        setting.Value = inputValue;
                        this.props.db.put(setting);
                    });
                }
            } catch (error) {

            }
        }
    }

}