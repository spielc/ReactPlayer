import * as React from "react";
import * as ReactDOM from "react-dom";
import ReactTable from "react-table";
import { observer } from "mobx-react";
import {ipcRenderer} from "electron";

import {ReactPlayerDB, SettingsWindowName, WindowManagementMessage_RegisterHandler, WindowManagementMessage_LifeCycleEvent, SettingIdPrefix} from "../base/typedefs";
import {Setting} from "../base/setting";
import { AppState } from "../base/appstate";



const EnterKeyIdent = "Enter";

interface SettingsComponentProperties {
    state: AppState
}

@observer
export class SettingsComponent extends React.Component<SettingsComponentProperties, {}> {

    constructor(props: SettingsComponentProperties, context?: any) {
        super(props, context);     
    }

    public render(): JSX.Element {
        var columns = [
            {
                Header: 'Name',
                accessor: '_id'
            },
            {
                Header: 'Value',
                accessor: 'Value',
                Cell: (data: any, column: any) => <input name={data.original._id} defaultValue={JSON.stringify(data.original.Value)} onKeyDown={evt => this.keyDownEvent(evt)}/>
            }
        ]
        return (
            <ReactTable data={this.props.state.settings.filter(setting => setting.IsVisible)} columns={columns}/>
        );
    }

    private keyDownEvent(event: React.KeyboardEvent<HTMLInputElement>): void {
        if (event.key === EnterKeyIdent) {
            try {
                let inputValue = JSON.parse(event.currentTarget.value);
                let currentSetting = this.props.state.settings.find(setting => setting._id == event.currentTarget.name);
                let currentValue = currentSetting.Value;
                if ((typeof inputValue === typeof currentValue) && inputValue != currentValue) {
                    currentSetting.Value = inputValue;
                }
            } catch (error) {

            }
        }
    }

}