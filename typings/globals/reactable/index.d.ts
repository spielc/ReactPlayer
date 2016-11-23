declare module "reactable" {

    import React = require("react");

    export interface KeyLabelObject {
        key: string,
        label: string
    }

    export type ColumnsType = string | KeyLabelObject;

    export interface TableComponentProperties<T> {
        data?: T[],
        className?: string,
        columns?: ColumnsType[],
        id?: string,
        sortable?: string[]
    }

    export interface ThProperties {
        column: string,
        className?: string
    }

    export interface TrProperties<T> {
        data?: T,
        className?: string
    }

    
    export class Table<T> extends React.Component<TableComponentProperties<T>, {}> {
        
    }

    export class Thead extends React.Component<{}, {}> {

    }

    export class Th extends React.Component<ThProperties, {}> {
        
    }

    export class Tr<T> extends React.Component<TrProperties<T>, {}> {
        
    }

    export class Tfoot extends React.Component<{}, {}> {

    }
}